import json
from pathlib import Path

import pytest

from cellproof.eval import literature as lit

ROOT = Path(__file__).resolve().parents[1]
evidence = json.loads(lit.EVIDENCE.read_text(encoding="utf-8"))
candidates = json.loads(lit.CANDIDATES.read_text(encoding="utf-8"))
taken = {r["pmcid"] for rows in candidates["candidates"].values() for r in rows if r["taken"]}

# The papers the protocol took before anything was read (commit 2cd6d51) and the verdicts they got then. Amendment 1 added a second wave;
# nothing read in it may change these.
FIRST_WAVE = {
    "PTEN": {"PMC2914702": "contradicts", "PMC5627969": "off_topic", "PMC3722247": "off_topic", "PMC3614551": "agrees_in_direction",
             "PMC6440033": "contradicts", "PMC5834544": "agrees_in_direction"},
    "RB1": {"PMC5412766": "off_topic", "PMC3827056": "agrees_in_direction", "PMC2247029": "off_topic", "PMC3909110": "off_topic",
            "PMC4237942": "off_topic", "PMC2394264": "agrees_in_direction"},
}
# Listed in docs/literature_check.md by commit 2e8b74a, before any of their texts was downloaded.
SECOND_WAVE = {
    "PTEN": ["PMC6798410", "PMC3315579", "PMC4441389", "PMC7145659", "PMC6267624", "PMC3909012"],
    "RB1": ["PMC9237030", "PMC5465815", "PMC5385017", "PMC11049397", "PMC4220401", "PMC11237859"],
}


def qualifying(rows):
    return [r for r in rows if r["pmcid"] and r["pmcid"] not in lit.held_out_sources() and (r["license"] or "").startswith("cc")]


def count(papers):
    return {v: sum(p["verdict"] == v for p in papers) for v in lit.VERDICTS}


def test_the_protocol_took_ranks_one_to_twelve_per_gene_in_two_waves_and_all_of_them_were_read_and_nothing_else():
    for gene, rows in candidates["candidates"].items():
        ranked = qualifying(rows)
        assert [r["rank"] for r in ranked] == list(range(1, len(ranked) + 1)), gene  # the stored rank is the rule's rank
        assert [r["pmcid"] for r in rows if r["wave"] == 1] == [r["pmcid"] for r in ranked[: lit.FIRST_WAVE]], gene  # by the rule, in the citation order of the search
        assert [r["pmcid"] for r in rows if r["wave"] == 2] == [r["pmcid"] for r in ranked[lit.FIRST_WAVE: lit.PER_GENE]], gene
        assert all(r["taken"] == bool(r["wave"]) for r in rows) and not any(r["wave"] for r in rows if r not in ranked)
        papers = evidence["genes"][gene]["papers"]
        assert [p["pmcid"] for p in papers] == [r["pmcid"] for r in rows if r["taken"]], gene  # none skipped, none added
        assert {p["pmcid"]: p["wave"] for p in papers} == {r["pmcid"]: r["wave"] for r in rows if r["taken"]}, gene
    assert not taken & lit.held_out_sources()  # the held-out source papers are never used here
    assert candidates["queries"] == lit.QUERIES and candidates["first_wave"] == lit.FIRST_WAVE == 6 and candidates["per_gene"] == lit.PER_GENE == 12


def test_the_first_wave_is_what_was_fixed_before_reading_the_second_is_what_the_amendment_listed_and_no_first_wave_verdict_changed():
    for gene, block in evidence["genes"].items():
        first = {p["pmcid"]: p["verdict"] for p in block["papers"] if p["wave"] == 1}
        assert first == FIRST_WAVE[gene], gene
        assert [p["pmcid"] for p in block["papers"] if p["wave"] == 2] == SECOND_WAVE[gene], gene
    assert evidence["waves"].keys() == {"1", "2"}


def test_the_selection_counts_only_papers_that_qualify_and_splits_them_into_two_waves():
    records = [{"pmcid": f"PMC{i}", "license": "cc by", "title": f"t{i}.", "pubYear": 2020, "citedByCount": 100 - i} for i in range(1, 19)]
    records.insert(2, {"pmcid": "PMC77", "license": "", "title": "no licence"})
    records.insert(4, {"pmcid": None, "license": "cc by", "title": "no PMC id"})
    records.insert(6, {"pmcid": "PMC99", "license": "cc by", "title": "a held-out source"})
    fake = lambda url: json.dumps({"resultList": {"result": records}}).encode()  # noqa: E731
    rows = lit.candidates(fetch=fake, excluded={"PMC99"})["PTEN"]
    qualifies = [r for r in rows if r["rank"]]
    assert [r["pmcid"] for r in qualifies][:3] == ["PMC1", "PMC2", "PMC3"] and len(qualifies) == 18
    assert [r["rank"] for r in qualifies] == list(range(1, 19))
    assert [r["wave"] for r in qualifies] == [1] * 6 + [2] * 6 + [0] * 6
    skipped = [r for r in rows if not r["rank"]]
    assert {r["title"] for r in skipped} == {"no licence", "no PMC id", "a held-out source"} and not any(r["wave"] or r["taken"] for r in skipped)
    assert all(r["taken"] == (r["wave"] > 0) for r in rows)


def test_the_stored_evidence_has_no_problem_and_its_quotes_are_short_and_where_the_text_is_present_found_in_the_paper():
    assert lit.problems(evidence, taken=taken) == []
    quotes = [q for block in evidence["genes"].values() for p in block["papers"] for q in p["quotes"]]
    assert len(quotes) == 18 and all(len(q["text"].split()) <= 40 for q in quotes)
    assert all(p["only_apoptosis_reported"] is False for block in evidence["genes"].values() for p in block["papers"])  # no paper says it, and none could confirm it


def test_what_was_found_per_wave_and_per_design():
    papers = {g: b["papers"] for g, b in evidence["genes"].items()}
    first = {g: count([p for p in rows if p["wave"] == 1]) for g, rows in papers.items()}
    second = {g: count([p for p in rows if p["wave"] == 2]) for g, rows in papers.items()}
    assert first["PTEN"] == {"agrees_in_direction": 2, "contradicts": 2, "mixed": 0, "off_topic": 2}
    assert first["RB1"] == {"agrees_in_direction": 2, "contradicts": 0, "mixed": 0, "off_topic": 4}
    assert second["PTEN"] == {"agrees_in_direction": 0, "contradicts": 2, "mixed": 1, "off_topic": 3}
    assert second["RB1"] == {"agrees_in_direction": 0, "contradicts": 1, "mixed": 0, "off_topic": 5}
    assert {g: count(rows) for g, rows in papers.items()} == {
        "PTEN": {"agrees_in_direction": 2, "contradicts": 4, "mixed": 1, "off_topic": 5},
        "RB1": {"agrees_in_direction": 2, "contradicts": 1, "mixed": 0, "off_topic": 9}}
    on = [(g, p) for g, rows in papers.items() for p in rows if p["verdict"] != "off_topic"]
    by_design = {d: sorted((g, p["verdict"]) for g, p in on if p["design"] == d) for d in lit.DESIGNS}
    assert by_design == {
        "changed": [("PTEN", "agrees_in_direction"), ("PTEN", "contradicts"), ("PTEN", "contradicts"), ("RB1", "contradicts")],
        "compared": [("PTEN", "agrees_in_direction"), ("PTEN", "mixed"), ("RB1", "agrees_in_direction"), ("RB1", "agrees_in_direction")],
        "indirect": [("PTEN", "contradicts"), ("PTEN", "contradicts")]}
    senescence = [p for _, p in on if "senescence" in (p["fate_reported"] or "")]
    assert [p["pmcid"] for p in senescence] == ["PMC3614551"]  # PTEN-deficient cells and senescence: a fate the model says cannot occur
    rb_knockout = next(p for p in papers["RB1"] if p["pmcid"] == "PMC11237859")
    assert rb_knockout["verdict"] == "contradicts" and rb_knockout["design"] == "changed"  # the one test in which RB1 itself was knocked out


def test_no_quote_is_taken_from_a_paper_under_a_no_derivatives_or_share_alike_licence():
    papers = [p for block in evidence["genes"].values() for p in block["papers"]]
    assert all(not p["quotes"] for p in papers if p["license"].endswith(("nd", "sa")))  # THIRD_PARTY.md says so
    assert [p["pmcid"] for p in papers if p["quotes"] and "nc" in p["license"]] == ["PMC6267624"]  # the one non-commercial paper that is quoted


@pytest.mark.parametrize("change, expected", [
    (lambda p: p.update(verdict="maybe"), "unknown verdict"),
    (lambda p: p.update(quotes=[]), "needs a quote"),
    (lambda p: p["quotes"].append({"text": "a sentence that is not in this paper at all, nowhere", "where": "x", "says": "y"}), "quote not found"),
    (lambda p: p["quotes"].append({"text": " ".join(["word"] * 41), "where": "x", "says": "y"}), "more than 40 words"),
    (lambda p: p.update(pmcid="PMC0"), "not taken by the protocol"),
    (lambda p: p.update(wave=3), "unknown wave"),
    (lambda p: p.update(design="vibes"), "unknown design"),
    (lambda p: p.update(design=None), "unknown design"),
])
def test_the_checker_names_each_kind_of_problem(change, expected):
    doc = json.loads(json.dumps(evidence))
    change(doc["genes"]["PTEN"]["papers"][0])
    assert any(expected in line for line in lit.problems(doc, taken=taken))


def test_an_off_topic_paper_needs_its_reason_and_has_no_design():
    doc = json.loads(json.dumps(evidence))
    off = next(p for p in doc["genes"]["PTEN"]["papers"] if p["verdict"] == "off_topic")
    off["note"] = ""
    assert any("needs its reason" in line for line in lit.problems(doc, taken=taken))
    off["note"], off["design"] = "reason", "changed"
    assert any("has no design" in line for line in lit.problems(doc, taken=taken))
