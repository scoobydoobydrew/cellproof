import hashlib
import http.client
import json
import threading
from pathlib import Path

import pytest

from cellproof.eval import label_tool as tool
from cellproof.extract.claims import normalize
from cellproof.extract.stats import LABELS

ROOT = Path(__file__).resolve().parents[1]
FROZEN = ROOT / "data" / "heldout" / "gupta2023_heldout.json"


@pytest.fixture()
def sandbox(tmp_path, monkeypatch):
    """Work on copies, so that no test can ever write a label into the real files."""
    m4 = tmp_path / "m4.csv"
    m4.write_bytes((ROOT / "data" / "labels" / "m4_sample.csv").read_bytes())
    monkeypatch.setattr(tool, "M4_PATH", m4)
    monkeypatch.setattr(tool, "D4_PATH", tmp_path / "d4.csv")
    return tmp_path


def test_a_label_goes_to_its_own_row_and_every_other_column_and_row_is_kept(sandbox):
    before = tool.read_rows(tool.M4_PATH)
    done = tool.save_m4("L02", "wrong_direction", "  checked twice ")
    after = tool.read_rows(tool.M4_PATH)
    assert len(after) == len(before) == 50 and list(after[0]) == list(before[0])
    assert after[1]["label"] == "wrong_direction" and after[1]["note"] == "checked twice"
    assert done == sum(bool(r["label"]) for r in after)
    for k, (old, new) in enumerate(zip(before, after)):
        skip = ("label", "note") if k == 1 else ()
        assert {key: v for key, v in old.items() if key not in skip} == {key: v for key, v in new.items() if key not in skip}


def test_only_the_five_labels_are_accepted_and_an_empty_one_clears(sandbox):
    with pytest.raises(ValueError):
        tool.save_m4("L01", "maybe", "")
    with pytest.raises(KeyError):
        tool.save_m4("L99", "correct", "")
    for label in LABELS:
        tool.save_m4("L03", label, "")
    tool.save_m4("L03", "", "")
    assert tool.read_rows(tool.M4_PATH)[2]["label"] == ""


def test_the_d4_answers_start_blank_one_per_claim_and_the_frozen_item_file_is_never_written(sandbox):
    digest = hashlib.sha256(FROZEN.read_bytes()).hexdigest()
    claims = sum(len(item["claims"]) for item in json.loads(FROZEN.read_text(encoding="utf-8"))["items"])
    rows = tool.d4_rows()
    assert len(rows) == claims == 23 and all(r["verdict"] == "" and r["note"] == "" for r in rows)
    assert tool.save_d4(rows[0]["id"], "does_not_support", "says the opposite") == 1
    assert tool.d4_rows()[0]["verdict"] == "does_not_support"
    with pytest.raises(ValueError):
        tool.save_d4(rows[0]["id"], "yes", "")
    assert hashlib.sha256(FROZEN.read_bytes()).hexdigest() == digest  # D4 answers have their own file


def test_every_label_and_verdict_has_a_button_in_the_page():
    page = tool.PAGE.read_text(encoding="utf-8")
    for value in (*LABELS, *tool.VERDICTS):
        assert f'"{value}"' in page, value


def test_the_paragraph_around_a_quote_is_found_when_the_paper_is_on_this_machine():
    if not tool.RAW_CORPUS.exists():
        pytest.skip("data/raw is not committed")
    row = tool.read_rows(ROOT / "data" / "labels" / "m4_sample.csv")[0]
    paragraph = tool.paragraph_of(tool.RAW_CORPUS, row["pmcid"], row["evidence_quote"])
    assert paragraph and normalize(row["evidence_quote"][:30]) in normalize(paragraph)
    assert tool.paragraph_of(tool.RAW_CORPUS, row["pmcid"], "a sentence that is not in this paper at all") == ""


def _ask(port, method, path, body=None, headers=None):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=20)
    connection.request(method, path, body=None if body is None else json.dumps(body), headers=headers or {})
    response = connection.getresponse()
    payload = response.read()
    connection.close()
    return response.status, payload


def test_the_page_is_served_locally_saves_a_click_and_refuses_what_it_should(sandbox):
    server = tool.make_server(0)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        status, payload = _ask(port, "GET", "/")
        assert status == 200 and b"CellProof reading tasks" in payload
        status, payload = _ask(port, "GET", "/api/state")
        data = json.loads(payload)
        assert status == 200 and len(data["m4"]) == 50 and len(data["d4"]) == 23 and data["labels"] == list(LABELS)
        assert all(row["link"].startswith("https://pmc.ncbi.nlm.nih.gov/articles/PMC") for row in data["m4"] + data["d4"])
        json_type = {"Content-Type": "application/json"}
        status, payload = _ask(port, "POST", "/api/m4", {"id": "L05", "label": "correct", "note": ""}, json_type)
        assert status == 200 and json.loads(payload)["done"] >= 1
        assert tool.read_rows(tool.M4_PATH)[4]["label"] == "correct"
        status, _ = _ask(port, "POST", "/api/m4", {"id": "L05", "label": "nonsense"}, json_type)
        assert status == 400
        status, _ = _ask(port, "POST", "/api/d4", {"id": "H01#1", "verdict": "supports", "note": ""}, json_type)
        assert status == 200
        status, _ = _ask(port, "POST", "/api/m4", {"id": "L05", "label": "correct"}, {"Content-Type": "text/plain"})
        assert status == 403  # a web page on another site cannot send a JSON request without a preflight
        status, _ = _ask(port, "GET", "/api/state", headers={"Host": "evil.example"})
        assert status == 403
    finally:
        server.shutdown()
        server.server_close()
