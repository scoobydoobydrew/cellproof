"""The local server for dropped PDFs: who may talk to it, what it accepts, and the jobs. The reading itself is replaced by a stand-in (no model call,
no solver); its real path is tested in test_ingest.py."""
import http.client
import json
import threading
import time

import pytest

from cellproof import serve
from cellproof.ingest import pipeline
from cellproof.ingest.guard import Verdict
from cellproof.ingest.pdf import PdfError

PDF = b"%PDF-1.4 a stand-in; the server does not read it, the reading is replaced"


def record(paper="USR-0123456789"):
    return {
        "id": paper, "title": "A paper", "filename": "a.pdf", "doi": None, "added": "2026-11-01T10:00:00+00:00", "pages": 3, "chars": 9000, "warnings": [],
        "counts": {"grounded": 2}, "cost_usd": 0.05, "model": "m", "model_file": "f", "model_sha256": "x", "graph": {"nodes": [], "edges": [], "counts": {}},
        "extraction": {"mechanism": [{"quote": "must not leave the disk"}]},
    }


@pytest.fixture
def running(tmp_path, monkeypatch):
    monkeypatch.setattr(serve, "has_key", lambda: True)
    page = tmp_path / "report.html"
    page.write_text("<html>the report</html>", encoding="utf-8")
    gate = threading.Event()
    seen = []

    def stand_in(data, name, *, root, progress, **_):
        seen.append(name)
        progress("read", "done", {"pages": 3})
        gate.wait(5)
        if name == "refused.pdf":
            raise pipeline.Refused(Verdict("heldout", "an audit source", "arya2010"))
        if name == "broken.pdf":
            raise PdfError("the PDF has almost no text")
        rec = record()
        (root / "papers" / rec["id"]).mkdir(parents=True, exist_ok=True)
        (root / "papers" / rec["id"] / "record.json").write_text(json.dumps(rec), encoding="utf-8")
        return rec

    server = serve.make_server(0, tmp_path, page, stand_in)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    server.gate, server.seen = gate, seen
    gate.set()
    yield server
    server.shutdown()
    server.server_close()


def call(server, method, path, body=None, headers=None, host=None):
    port = server.server_address[1]
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    sent = {"Host": f"127.0.0.1:{port}" if host is None else host, **(headers or {})}
    connection.request(method, path, body=body, headers=sent)
    response = connection.getresponse()
    raw = response.read()
    connection.close()
    kind = response.getheader("Content-Type", "")
    return response.status, (json.loads(raw) if "json" in kind else raw.decode("utf-8"))


UPLOAD = {"Content-Type": "application/pdf", "X-CellProof": "1"}


def wait_for(server, job):
    for _ in range(100):
        status, state = call(server, "GET", f"/api/job/{job}")
        if state["state"] != "running":
            return state
        time.sleep(0.05)
    raise AssertionError("the job did not finish")


def test_serves_the_report_the_status_and_the_list(running):
    assert call(running, "GET", "/") == (200, "<html>the report</html>")
    status, state = call(running, "GET", "/api/status")
    assert status == 200 and state["enabled"] and state["key"] and state["limit_mb"] == 40 and not state["busy"]
    assert call(running, "GET", "/api/papers") == (200, {"papers": []})


def test_only_the_servers_own_address_is_answered(running):
    port = running.server_address[1]
    for host in ("evil.example", f"evil.example:{port}", f"127.0.0.1:{port + 1}", ""):
        assert call(running, "GET", "/api/status", host=host)[0] == 403
    assert call(running, "GET", "/api/status", host=f"localhost:{port}")[0] == 200


def test_a_change_needs_the_pages_own_header_and_no_other_origin(running):
    port = running.server_address[1]
    assert call(running, "POST", "/api/plan", PDF, {"Content-Type": "application/pdf"})[0] == 403  # no header
    assert call(running, "POST", "/api/plan", PDF, {**UPLOAD, "Origin": "https://evil.example"})[0] == 403  # a page on another site
    assert call(running, "DELETE", "/api/paper/USR-0123456789", headers={})[0] == 403
    assert call(running, "POST", "/api/plan", PDF, {**UPLOAD, "Origin": f"http://127.0.0.1:{port}"})[0] != 403


def test_only_a_pdf_of_a_sensible_size_is_taken(running):
    assert call(running, "POST", "/api/ingest", b"{}", {"Content-Type": "application/json", "X-CellProof": "1"})[0] == 415
    assert call(running, "POST", "/api/ingest", b"", UPLOAD)[0] == 413
    big = {**UPLOAD, "Content-Length": str(serve.MAX_MB * 1024 * 1024 + 1)}
    port = running.server_address[1]
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    connection.putrequest("POST", "/api/ingest", skip_host=True)
    for key, value in {"Host": f"127.0.0.1:{port}", **big}.items():
        connection.putheader(key, value)
    connection.endheaders()
    assert connection.getresponse().status == 413  # refused on the length alone, before reading anything
    assert call(running, "POST", "/api/elsewhere", PDF, UPLOAD)[0] == 404


def test_a_plan_reports_what_the_pdf_is_or_why_it_cannot_be_read(running, monkeypatch):
    monkeypatch.setattr(pipeline, "plan", lambda data, name, root: {"title": name, "guard": {"kind": "ok"}})
    assert call(running, "POST", "/api/plan?name=..%2F..%2Fsecret%5Cown.pdf", PDF, UPLOAD) == (200, {"title": "own.pdf", "guard": {"kind": "ok"}})  # a name is only shown, never a path

    def unreadable(data, name, root):
        raise PdfError("the PDF has almost no text (a scan?)")

    monkeypatch.setattr(pipeline, "plan", unreadable)
    assert call(running, "POST", "/api/plan", PDF, UPLOAD) == (422, {"error": "the PDF has almost no text (a scan?)"})


def test_a_dropped_paper_is_read_in_a_job_and_then_listed_fetched_and_removed(running):
    status, started = call(running, "POST", "/api/ingest?name=own.pdf", PDF, UPLOAD)
    assert status == 202
    state = wait_for(running, started["job"])
    assert state["state"] == "done" and state["paper"] == "USR-0123456789" and state["steps"]["read"] == {"state": "done", "pages": 3}
    assert [p["id"] for p in call(running, "GET", "/api/papers")[1]["papers"]] == ["USR-0123456789"]
    status, paper = call(running, "GET", "/api/paper/USR-0123456789")
    assert status == 200 and paper["title"] == "A paper" and "extraction" not in paper  # the graph and the facts, not the raw quotes twice
    assert call(running, "DELETE", "/api/paper/USR-0123456789", headers={"X-CellProof": "1"}) == (200, {"deleted": True})
    assert call(running, "GET", "/api/paper/USR-0123456789")[0] == 404


@pytest.mark.parametrize("name, state, key", [("refused.pdf", "refused", "refused"), ("broken.pdf", "error", "error")])
def test_a_refusal_and_a_failure_reach_the_page_as_sentences(running, name, state, key):
    _, started = call(running, "POST", f"/api/ingest?name={name}", PDF, UPLOAD)
    finished = wait_for(running, started["job"])
    assert finished["state"] == state and finished[key] and finished["paper"] is None
    assert not call(running, "GET", "/api/status")[1]["busy"]  # the next paper may come


def test_one_paper_is_read_at_a_time(running):
    running.gate.clear()
    _, first = call(running, "POST", "/api/ingest?name=one.pdf", PDF, UPLOAD)
    assert call(running, "GET", "/api/status")[1]["busy"]
    assert call(running, "POST", "/api/ingest?name=two.pdf", PDF, UPLOAD)[0] == 409
    running.gate.set()
    assert wait_for(running, first["job"])["state"] == "done" and running.seen == ["one.pdf"]


def test_without_a_key_nothing_is_started(running, monkeypatch):
    monkeypatch.setattr(serve, "has_key", lambda: False)
    status, body = call(running, "POST", "/api/ingest?name=own.pdf", PDF, UPLOAD)
    assert status == 400 and "MODEL_API_KEY" in body["error"] and running.seen == []


@pytest.mark.parametrize("path", ["/api/paper/../../etc/passwd", "/api/paper/USR-xyz", "/api/job/nothing", "/data/models/repaired_min1.bnet", "/results/report.html"])
def test_nothing_else_is_served(running, path):
    assert call(running, "GET", path)[0] == 404
