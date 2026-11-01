"""The report page with a door for your own PDFs.

`cellproof serve` shows results/report.html from this computer and answers the page's calls to read a PDF the AI could not find itself
(a paper that is not open access, or that sits behind a login the person has). Without this server the same page is a static file: it shows
what the AI found on its own and cannot take a PDF, because a page has no key and no solver.

What it answers: the state (is there a key, is it busy), the list of dropped papers and the graph of one, a plan (what the PDF is, what the
guard says, what it would cost, nothing sent), a job that reads it (steps to poll), and the removal of a paper. Local use only, as in the
labelling tool: the address must be this computer's own, every change must carry the page's own header (a page on another site cannot send
it without a permission this server never gives), a PDF is the only upload, and nothing but the report and these calls is served.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
import uuid
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

from cellproof.ingest import pipeline
from cellproof.ingest.pdf import PdfError
from cellproof.meta_client import DEFAULT_MODEL

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "results" / "report.html"
MAX_MB = 40
HEADER = "X-CellProof"
PUBLIC = ("id", "title", "filename", "doi", "added", "pages", "chars", "warnings", "counts", "cost_usd", "model", "model_file", "model_sha256", "graph")
PAPER = re.compile(r"^/api/paper/(USR-[0-9a-f]{10})$")
JOB = re.compile(r"^/api/job/([0-9a-f]{12})$")


def has_key() -> bool:
    load_dotenv()
    return bool(os.environ.get("MODEL_API_KEY"))


class Jobs:
    """One reading at a time (a reading spends money and holds the solver); the last few jobs stay, so that a page can ask how one went."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.jobs: dict[str, dict] = {}
        self.busy = False

    def start(self, data: bytes, name: str, root: Path, run=pipeline.ingest) -> str | None:
        with self.lock:
            if self.busy:
                return None
            self.busy = True
            job = uuid.uuid4().hex[:12]
            self.jobs[job] = {"state": "running", "steps": {}, "paper": None, "error": None, "refused": None, "started": time.time()}
            for old in sorted(self.jobs, key=lambda j: self.jobs[j]["started"])[:-12]:
                del self.jobs[old]
        threading.Thread(target=self._run, args=(job, data, name, root, run), daemon=True).start()
        return job

    def _step(self, job: str, step: str, state: str, detail: dict) -> None:
        with self.lock:
            self.jobs[job]["steps"][step] = {"state": state, **detail}

    def _run(self, job: str, data: bytes, name: str, root: Path, run) -> None:
        outcome = {"state": "done"}
        try:
            record = run(data, name, root=root, progress=lambda step, state, detail: self._step(job, step, state, detail))
            outcome["paper"] = record["id"]
        except pipeline.Refused as refused:
            outcome = {"state": "refused", "refused": {"kind": refused.verdict.kind, "reason": refused.verdict.reason, "paper": refused.verdict.paper}}
        except PdfError as error:
            outcome = {"state": "error", "error": str(error)}
        except Exception as error:  # a failed call must reach the page as a sentence, not stop the server
            outcome = {"state": "error", "error": f"{type(error).__name__}: {str(error)[:300]}"}
        with self.lock:
            self.jobs[job].update(outcome)
            self.busy = False

    def get(self, job: str) -> dict | None:
        with self.lock:
            found = self.jobs.get(job)
            return json.loads(json.dumps(found)) if found else None


def public(record: dict) -> dict:
    return {k: record[k] for k in PUBLIC if k in record}


class Handler(BaseHTTPRequestHandler):
    server_version = "CellProof"

    def log_message(self, *args) -> None:  # keep the terminal quiet
        pass

    @property
    def app(self) -> "Server":
        return self.server  # type: ignore[return-value]

    def _send(self, status: int, body: bytes, kind: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, payload: dict) -> None:
        self._send(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def _discard(self) -> None:
        """Reads a bounded amount of a body that will not be used, so that the client sees the answer and not a reset connection."""
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return
        if 0 < length <= 1 << 20:
            self.rfile.read(length)

    def _local(self) -> bool:
        """The address in the request is this server's own: a page on another site that was made to point at it carries another name."""
        return self.headers.get("Host", "") in self.app.hosts

    def _ours(self) -> bool:
        """A change comes from the page this server gave: it has the header, and an Origin (when the browser sends one) that is this server."""
        origin = self.headers.get("Origin")
        return self.headers.get(HEADER) == "1" and (origin is None or origin in {f"http://{h}" for h in self.app.hosts})

    def do_GET(self) -> None:
        if not self._local():
            return self._json(403, {"error": "local use only"})
        url = urlparse(self.path)
        if url.path in ("/", "/index.html", "/report.html"):
            if not self.app.report.exists():
                return self._json(404, {"error": "results/report.html is not built: run `python -m cellproof.cli report`"})
            return self._send(200, self.app.report.read_bytes(), "text/html; charset=utf-8")
        if url.path == "/api/status":
            return self._json(200, {"enabled": True, "key": has_key(), "model": DEFAULT_MODEL, "busy": self.app.jobs.busy, "limit_mb": MAX_MB})
        if url.path == "/api/papers":
            return self._json(200, {"papers": pipeline.list_papers(self.app.root)})
        match = PAPER.match(url.path)
        if match:
            record = pipeline.load_paper(match.group(1), self.app.root)
            return self._json(200, public(record)) if record else self._json(404, {"error": "no such paper"})
        match = JOB.match(url.path)
        if match:
            job = self.app.jobs.get(match.group(1))
            return self._json(200, job) if job else self._json(404, {"error": "no such job"})
        self._json(404, {"error": "not found"})

    def _pdf(self) -> tuple[bytes, str] | None:
        """The uploaded PDF and the name it had, or None after the reply has been sent."""
        if "application/pdf" not in self.headers.get("Content-Type", ""):
            self._discard()
            self._json(415, {"error": "send the PDF as application/pdf"})
            return None
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._json(411, {"error": "the length of the PDF is needed"})
            return None
        if not 0 < length <= MAX_MB * 1024 * 1024:
            self._json(413, {"error": f"a PDF of at most {MAX_MB} MB"})
            return None
        name = parse_qs(urlparse(self.path).query).get("name", ["paper.pdf"])[0]
        return self.rfile.read(length), os.path.basename(name.replace("\\", "/"))[:200] or "paper.pdf"

    def do_POST(self) -> None:
        if not self._local() or not self._ours():
            self._discard()
            return self._json(403, {"error": "local use only"})
        path = urlparse(self.path).path
        if path not in ("/api/plan", "/api/ingest"):
            self._discard()
            return self._json(404, {"error": "not found"})
        upload = self._pdf()
        if upload is None:
            return
        data, name = upload
        if path == "/api/plan":
            try:
                return self._json(200, pipeline.plan(data, name, root=self.app.root))
            except PdfError as error:
                return self._json(422, {"error": str(error)})
        if not has_key():
            return self._json(400, {"error": "MODEL_API_KEY is not set: copy .env.example to .env and add the key, then restart `cellproof serve`"})
        job = self.app.jobs.start(data, name, self.app.root, self.app.run)
        if job is None:
            return self._json(409, {"error": "another paper is being read: wait for it to finish"})
        self._json(202, {"job": job})

    def do_DELETE(self) -> None:
        if not self._local() or not self._ours():
            return self._json(403, {"error": "local use only"})
        match = PAPER.match(urlparse(self.path).path)
        if not match:
            return self._json(404, {"error": "not found"})
        self._json(200, {"deleted": True}) if pipeline.delete_paper(match.group(1), self.app.root) else self._json(404, {"error": "no such paper"})


class Server(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, port: int, root: Path, report: Path, run) -> None:
        super().__init__(("127.0.0.1", port), Handler)
        shown = self.server_address[1]
        self.hosts = {f"127.0.0.1:{shown}", f"localhost:{shown}"}
        self.root, self.report, self.run, self.jobs = root, report, run, Jobs()


def make_server(port: int = 8767, root: Path = pipeline.USER_ROOT, report: Path = REPORT, run=pipeline.ingest) -> Server:
    return Server(port, root, report, run)


def serve(port: int = 8767, open_browser: bool = True) -> None:
    server = make_server(port)
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    print(f"CellProof at {url}   (Ctrl+C to stop)")
    print(f"  Meta API key: {'found' if has_key() else 'NOT found: copy .env.example to .env and add it, to read your own PDFs'}")
    print("  Your PDFs, the quotes and the model's replies stay in data/user_papers (git-ignored). Only the text of a PDF is sent to the Meta Model API.")
    print("  Drop only papers you are allowed to process: an institutional licence may forbid sending its text to a service.")
    if open_browser:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
