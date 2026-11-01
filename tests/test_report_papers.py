"""The papers section of the page: its data is the logs of the pipeline drawn as graphs, and nothing a person dropped in."""
import json
import os
import re
from pathlib import Path

import pytest

from cellproof.ingest.graph import VERDICT, VERDICTS
from cellproof.network.bnet import load_bnet
from cellproof.report import data as report_data
from cellproof.report.build import WEB, parts

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def block():
    return report_data.papers_block()


def test_every_corpus_paper_is_a_graph_and_the_environment_is_left_as_it_was(block):
    manifest = json.loads((ROOT / "data" / "corpus" / "manifest.json").read_text(encoding="utf-8"))["papers"]
    assert [p["id"] for p in block["auto"]] == [p["pmcid"] for p in manifest]
    assert all("<" not in p["title"] for p in block["auto"])  # a title with markup (G<sub>2</sub>) is shown as text
    for paper in block["auto"]:
        graph = paper["graph"]
        assert set(graph["counts"]) == set(VERDICTS) and sum(graph["counts"].values()) == len(graph["edges"])
        assert all(set(e) >= {"id", "s", "t", "effect", "verdict", "why", "n", "support"} and len(e["support"]) <= 2 for e in graph["edges"])
        ids = {n["id"] for n in graph["nodes"]}
        assert all(e["s"] in ids and e["t"] in ids and e["s"] != e["t"] for e in graph["edges"])


def test_the_verdicts_are_the_ones_the_augmentation_logged(block):
    log = {r["edge"]: r for r in json.loads((ROOT / "results" / "augment_repaired_min1.json").read_text(encoding="utf-8"))}
    rules = load_bnet(ROOT / "data" / "models" / "repaired_min1.bnet")
    shown = set()
    for paper in block["auto"]:
        for edge in paper["graph"]["edges"]:
            both = edge["s"] in rules and edge["t"] in rules
            if both:
                assert edge["verdict"] == VERDICT[log[edge["id"]]["status"]], edge["id"]  # the solver's word, not ours
                shown.add((paper["id"], edge["id"]))
            else:
                assert edge["verdict"] == "outside" and "not in the model" in edge["why"], edge["id"]
    for record in log.values():
        for support in record["support"]:
            assert (support["pmcid"], record["edge"]) in shown, (support["pmcid"], record["edge"])  # nothing the log knows is missing from the page


def test_a_node_is_marked_as_in_the_model_only_if_it_is(block):
    rules = load_bnet(ROOT / "data" / "models" / "repaired_min1.bnet")
    for paper in block["auto"]:
        for node in paper["graph"]["nodes"]:
            assert node["model"] == (node["id"] in rules)
            assert node["model"] or node["id"].startswith("?") or node["id"] not in rules


def test_the_page_carries_the_block_but_never_a_dropped_paper():
    source = (ROOT / "src" / "cellproof" / "report" / "data.py").read_text(encoding="utf-8")
    assert "user_papers" not in source  # the page is built from the committed corpus only
    head, body, script = parts({"papers": {"auto": [], "model": {}}})
    assert '"papers":{"auto":[]' in script and 'id="papers"' in body and 'id="ppSvg"' in body and 'id="ppFile"' in body
    assert body.index('id="bench"') < body.index('id="papers"') < body.index('id="search"')
    assert '<a href="#papers" data-i18n="nav.papers">' in body


def test_the_page_script_checks_for_a_server_only_on_this_computer_and_sends_the_pages_own_header():
    js = (WEB / "papers.js").read_text(encoding="utf-8")
    assert "localhost|127" in js and '"X-CellProof": "1"' in js and "api/plan" in js and "api/ingest" in js
    assert re.search(r"if \(!/\^\(localhost\|127", js)  # a file or a published page never calls out
    for word in ("clinical trial", "proof", "patient", "personalis", "cure", "treatment"):
        assert word not in js.lower().replace("cellproof", ""), word


def test_building_the_block_leaves_the_offline_switch_as_it_was(monkeypatch):
    monkeypatch.delenv("CELLPROOF_OFFLINE", raising=False)
    report_data.papers_block()
    assert "CELLPROOF_OFFLINE" not in os.environ
    monkeypatch.setenv("CELLPROOF_OFFLINE", "0")
    report_data.papers_block()
    assert os.environ["CELLPROOF_OFFLINE"] == "0"
