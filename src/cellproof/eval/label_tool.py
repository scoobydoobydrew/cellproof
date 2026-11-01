"""A local page for the two reading tasks only a person can do: M4 (label 50 extracted claims) and D4 (check that each
held-out quote supports its claim).

The page shows a sentence and the claim made from it, and the person clicks. Nothing is pre-filled or suggested and no
model is called. The held-out item file is never written (its hash is frozen, docs/heldout_protocol.md): the D4 answers go
to their own file, and a claim judged wrong is a reason for a logged amendment, not for an edit here.
"""
from __future__ import annotations

import csv
import json
import os
import tempfile
import threading
import webbrowser
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from cellproof.extract.claims import normalize
from cellproof.extract.stats import LABELS

ROOT = Path(__file__).resolve().parents[3]
PAGE = Path(__file__).parent / "web" / "label.html"
M4_PATH = ROOT / "data" / "labels" / "m4_sample.csv"
D4_PATH = ROOT / "data" / "labels" / "d4_check.csv"
HELDOUT = ROOT / "data" / "heldout" / "gupta2023_heldout.json"
RAW_CORPUS = ROOT / "data" / "raw" / "corpus"
RAW_HELDOUT = ROOT / "data" / "raw" / "heldout_texts"

VERDICTS = ("supports", "does_not_support", "unsure")
D4_FIELDS = ["id", "item", "verdict", "note"]
CONTEXT = 700  # characters of the paragraph kept on each side of the quote


def read_rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_rows(path: Path, fields: list[str], rows: list[dict]) -> None:
    """Write beside the file and swap it in, so a crash or a full disk cannot leave half a label file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


@lru_cache(maxsize=64)
def _paper(path: str) -> list[tuple[str, str]]:
    """Paragraphs of one paper as (original, normalised) pairs; empty when the text is not on this machine."""
    file = Path(path)
    if not file.exists():
        return []
    return [(line, normalize(line)) for line in file.read_text(encoding="utf-8").splitlines() if line.strip()]


def paragraph_of(folder: Path, pmcid: str, quote: str) -> str:
    """The paragraph of the paper that holds `quote` (found the way extraction found it), cut to a window around it."""
    needle = normalize(quote)
    for original, folded in _paper(str(folder / f"{pmcid}.txt")):
        if needle and needle in folded:
            at = original.lower().find(quote.lower()[:40])
            if at < 0 or len(original) <= 2 * CONTEXT + len(quote):
                return original if len(original) <= 2 * CONTEXT + len(quote) else original[: 2 * CONTEXT] + " ..."
            start, end = max(0, at - CONTEXT), min(len(original), at + len(quote) + CONTEXT)
            return ("... " if start else "") + original[start:end] + (" ..." if end < len(original) else "")
    return ""


def m4_rows() -> list[dict]:
    rows = read_rows(M4_PATH)
    for row in rows:
        row["paragraph"] = paragraph_of(RAW_CORPUS, row["pmcid"], row["evidence_quote"])
        row["link"] = f"https://pmc.ncbi.nlm.nih.gov/articles/{row['pmcid']}/"
    return rows


def d4_claims() -> list[dict]:
    """One entry per held-out claim, flattened from the frozen item file (read only)."""
    doc = json.loads(HELDOUT.read_text(encoding="utf-8"))
    out = []
    for item in doc["items"]:
        source = doc["sources"][item["source"]]
        for n, claim in enumerate(item["claims"], 1):
            details = {k: v for k, v in claim.items() if k not in ("statement", "quote")}
            out.append({
                "id": f"{item['id']}#{n}", "item": item["id"], "cite": source["cite"], "pmcid": source["pmcid"],
                "link": f"https://pmc.ncbi.nlm.nih.gov/articles/{source['pmcid']}/", "locator": item["locator"],
                "context": item["context"], "stimulus": item["stimulus"], "perturbation": item["perturbation"],
                "details": details, "statement": claim["statement"], "quote": claim["quote"],
                "paragraph": paragraph_of(RAW_HELDOUT, source["pmcid"], claim["quote"]),
            })
    return out


def d4_rows() -> list[dict]:
    """The answers so far, one row per held-out claim; the file is created blank on first use."""
    claims = d4_claims()
    saved = {row["id"]: row for row in read_rows(D4_PATH)} if D4_PATH.exists() else {}
    rows = [{"id": c["id"], "item": c["item"], "verdict": saved.get(c["id"], {}).get("verdict", ""),
             "note": saved.get(c["id"], {}).get("note", "")} for c in claims]
    if not D4_PATH.exists():
        write_rows(D4_PATH, D4_FIELDS, rows)
    return rows


def state() -> dict:
    d4 = {row["id"]: row for row in d4_rows()}
    return {
        "labels": list(LABELS), "verdicts": list(VERDICTS), "m4": m4_rows(),
        "d4": [{**claim, "verdict": d4[claim["id"]]["verdict"], "note": d4[claim["id"]]["note"]} for claim in d4_claims()],
    }


def save_m4(row_id: str, label: str, note: str) -> int:
    """Set one label (or clear it with ""); returns how many rows are labelled now."""
    if label and label not in LABELS:
        raise ValueError(f"label must be one of {', '.join(LABELS)} or empty")
    rows = read_rows(M4_PATH)
    row = next((r for r in rows if r["id"] == row_id), None)
    if row is None:
        raise KeyError(row_id)
    row["label"], row["note"] = label, note.strip()
    write_rows(M4_PATH, list(rows[0]), rows)
    return sum(bool(r["label"].strip()) for r in rows)


def save_d4(claim_id: str, verdict: str, note: str) -> int:
    if verdict and verdict not in VERDICTS:
        raise ValueError(f"verdict must be one of {', '.join(VERDICTS)} or empty")
    rows = d4_rows()
    row = next((r for r in rows if r["id"] == claim_id), None)
    if row is None:
        raise KeyError(claim_id)
    row["verdict"], row["note"] = verdict, note.strip()
    write_rows(D4_PATH, D4_FIELDS, rows)
    return sum(bool(r["verdict"]) for r in rows)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args) -> None:  # keep the terminal quiet
        pass

    def _send(self, status: int, body: bytes, kind: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, payload: dict) -> None:
        self._send(status, json.dumps(payload).encode("utf-8"), "application/json; charset=utf-8")

    def _local(self) -> bool:
        return self.headers.get("Host", "").split(":")[0] in ("127.0.0.1", "localhost")

    def do_GET(self) -> None:
        if not self._local():
            return self._json(403, {"error": "local use only"})
        if self.path in ("/", "/index.html"):
            return self._send(200, PAGE.read_bytes(), "text/html; charset=utf-8")
        if self.path == "/api/state":
            return self._json(200, state())
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if not self._local() or "application/json" not in self.headers.get("Content-Type", ""):
            try:  # read a small body that will not be used, so that the client sees this answer and not a reset connection (seen on Windows)
                length = int(self.headers.get("Content-Length", "0"))
                if 0 < length <= 1 << 20:
                    self.rfile.read(length)
            except ValueError:
                pass
            return self._json(403, {"error": "local JSON requests only"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
            if self.path == "/api/m4":
                done = save_m4(str(body["id"]), str(body.get("label", "")), str(body.get("note", "")))
            elif self.path == "/api/d4":
                done = save_d4(str(body["id"]), str(body.get("verdict", "")), str(body.get("note", "")))
            else:
                return self._json(404, {"error": "not found"})
        except (KeyError, ValueError, json.JSONDecodeError) as error:
            return self._json(400, {"error": f"bad request: {error}"})
        except OSError as error:  # for example the CSV is open in a spreadsheet program
            return self._json(500, {"error": f"could not save ({error}); close the file in other programs"})
        self._json(200, {"ok": True, "done": done})


def make_server(port: int = 8765) -> ThreadingHTTPServer:
    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def serve(port: int = 8765, open_browser: bool = True) -> None:
    server = make_server(port)
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    print(f"Labelling page at {url}  (Ctrl+C to stop; every click is saved at once)")
    if open_browser:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
