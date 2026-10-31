import json
from pathlib import Path

import pytest

from cellproof.eval import literature as lit

ROOT = Path(__file__).resolve().parents[1]
evidence = json.loads(lit.EVIDENCE.read_text(encoding="utf-8"))
candidates = json.loads(lit.CANDIDATES.read_text(encoding="utf-8"))
taken = {r["pmcid"] for rows in candidates["candidates"].values() for r in rows if r["taken"]}


def test_the_protocol_took_the_first_six_qualifying_papers_per_gene_and_all_of_them_were_read_and_nothing_else():
    for gene, rows in candidates["candidates"].items():
        qualifying = [r for r in rows if r["pmcid"] and r["pmcid"] not in lit.held_out_sources() and (r["license"] or "").startswith("cc")]
        assert [r["pmcid"] for r in rows if r["taken"]] == [r["pmcid"] for r in qualifying[: lit.PER_GENE]], gene  # by the rule, in the citation order of the search
        assert [p["pmcid"] for p in evidence["genes"][gene]["papers"]] == [r["pmcid"] for r in rows if r["taken"]], gene  # none skipped, none added
    assert not taken & lit.held_out_sources()  # the held-out source papers are never used here
    assert candidates["queries"] == lit.QUERIES and candidates["per_gene"] == lit.PER_GENE == 6


def test_the_stored_evidence_has_no_problem_and_its_quotes_are_short_and_where_the_text_is_present_found_in_the_paper():
    assert lit.problems(evidence, taken=taken) == []
    quotes = [q for block in evidence["genes"].values() for p in block["papers"] for q in p["quotes"]]
    assert len(quotes) == 10 and all(len(q["text"].split()) <= 40 for q in quotes)
    assert all(p["only_apoptosis_reported"] is False for block in evidence["genes"].values() for p in block["papers"])  # no paper says it, and none could confirm it


def test_what_was_found_is_two_agreeing_and_two_contradicting_papers_for_pten_and_two_agreeing_for_rb1():
    count = {g: {v: sum(p["verdict"] == v for p in b["papers"]) for v in lit.VERDICTS} for g, b in evidence["genes"].items()}
    assert count["PTEN"] == {"agrees_in_direction": 2, "contradicts": 2, "mixed": 0, "off_topic": 2}
    assert count["RB1"] == {"agrees_in_direction": 2, "contradicts": 0, "mixed": 0, "off_topic": 4}
    senescence = [p for b in evidence["genes"].values() for p in b["papers"] if "senescence" in (p["fate_reported"] or "")]
    assert [p["pmcid"] for p in senescence] == ["PMC3614551"]  # PTEN-deficient cells and senescence: a fate the model says cannot occur


@pytest.mark.parametrize("change, expected", [
    (lambda p: p.update(verdict="maybe"), "unknown verdict"),
    (lambda p: p.update(quotes=[]), "needs a quote"),
    (lambda p: p["quotes"].append({"text": "a sentence that is not in this paper at all, nowhere", "where": "x", "says": "y"}), "quote not found"),
    (lambda p: p["quotes"].append({"text": " ".join(["word"] * 41), "where": "x", "says": "y"}), "more than 40 words"),
    (lambda p: p.update(pmcid="PMC0"), "not taken by the protocol"),
])
def test_the_checker_names_each_kind_of_problem(change, expected):
    doc = json.loads(json.dumps(evidence))
    change(doc["genes"]["PTEN"]["papers"][0])
    assert any(expected in line for line in lit.problems(doc, taken=taken))


def test_an_off_topic_paper_needs_its_reason():
    doc = json.loads(json.dumps(evidence))
    off = next(p for p in doc["genes"]["PTEN"]["papers"] if p["verdict"] == "off_topic")
    off["note"] = ""
    assert any("needs its reason" in line for line in lit.problems(doc, taken=taken))
