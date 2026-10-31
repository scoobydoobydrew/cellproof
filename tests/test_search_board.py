import json
from pathlib import Path

import pytest

from cellproof.analysis.interventions import READOUT_NODES, describe, fates, search_space
from cellproof.analysis.llm_search import candidate_sets
from cellproof.analysis.search_board import CODE, PROFILES, RESULTS, chosen, kept, verdicts
from cellproof.genotype.outcomes import outcome
from cellproof.network.bnet import load_bnet
from cellproof.report.data import search_block

ROOT = Path(__file__).resolve().parents[1]
GENOTYPES = ROOT / "results" / "genotypes.json"
rules = load_bnet(ROOT / "data" / "models" / "repaired_min2.bnet")
stored = RESULTS.exists() and GENOTYPES.exists()
pytestmark = pytest.mark.skipif(not stored, reason="results/search_board.json or results/genotypes.json has not been written (python -m cellproof.cli board)")


def board() -> dict:
    return json.loads(RESULTS.read_text(encoding="utf-8"))


def test_kept_sets_are_the_minimal_ones_of_the_search_order():
    combos = [(("a", 1),), (("b", 0),), (("a", 1), ("b", 0)), (("a", 1), ("c", 1)), (("b", 0), ("c", 1))]
    assert kept(combos, "-DDDD") == [1, 3]  # b works: {a, b} and {b, c} contain it and are not kept; {a, c} contains nothing smaller that works, so it is
    assert kept(combos, "DODOD") == [0, 4]  # a works: {a, b} contains it; {a, c} does not work; {b, c} does and contains nothing smaller that works
    assert kept(combos, "ONNND") == [4]


def test_the_board_visits_every_set_the_exhaustive_search_visits_in_its_order():
    b = board()
    genes = sorted(n for n in rules if n not in READOUT_NODES)
    assert b["genes"] == genes and len(genes) == 23
    sets = candidate_sets(rules, 2)
    assert len(b["combos"]) == len(sets) == search_space(rules, 2) == 1058
    assert [[(genes[li >> 1], li & 1) for li in c] for c in b["combos"]] == [list(s) for s in sets]
    assert sum(len(c) == 1 for c in b["combos"]) == 46 and all(len(c) in (1, 2) for c in b["combos"])


def test_the_model_cells_kept_sets_are_the_solvers_eleven_and_each_profile_agrees_with_the_genotype_study():
    b, g = board(), json.loads(GENOTYPES.read_text(encoding="utf-8"))
    model = b["profiles"][0]
    assert model["forced"] == [] and model["found_labels"] == g["solver_sets"] and len(model["found"]) == 11
    top = {json.dumps(t["signature"]): t for t in g["r1"]["top_signatures"]}
    assert len(b["profiles"]) == 1 + PROFILES
    for p in b["profiles"][1:]:
        t = top[json.dumps(p["forced"])]
        assert p["samples"] == t["samples"] and p["found_labels"] == t["specific_sets"]  # the same exhaustive search, run twice, by two modules
    skipped = [s["forced"] for s in b["no_search_needed"]]
    assert [["PTEN", 0]] in skipped and [["RB", 0]] in skipped and [["Myc", 1]] in skipped
    assert not any(s["forced"] == p["forced"] for s in b["no_search_needed"] for p in b["profiles"])


def test_no_profile_offers_a_set_that_touches_a_gene_it_fixes_and_p53_lost_leaves_nothing():
    b = board()
    for p in b["profiles"]:
        fixed = {n for n, _ in p["forced"]}
        assert len(p["verdicts"]) == len(b["combos"]) and set(p["verdicts"]) <= set("DON-")
        for marks, c in zip(p["verdicts"], b["combos"]):
            touches = any(b["genes"][li >> 1] in fixed for li in c)
            assert (marks == "-") == touches
    p53 = next(p for p in b["profiles"] if p["forced"] == [["p53", 0]])
    assert p53["found"] == [] and "D" not in p53["verdicts"] and p53["verdicts"].count("-") == 90  # the 90 sets that touch p53 are not offered; none of the rest leaves only death


def test_a_slice_of_every_profile_is_recomputed_exactly():
    b = board()
    sets = candidate_sets(rules, 2)
    for p in b["profiles"]:
        forced = dict(map(tuple, p["forced"]))
        for i in range(0, len(sets), 97):
            expect = "-" if any(n in forced for n, _ in sets[i]) else CODE[outcome(fates(rules, {**forced, **dict(sets[i])}))]
            assert p["verdicts"][i] == expect, (p["forced"], describe(sets[i]))
    assert verdicts(rules, sets[:5], {}) == "".join(CODE[outcome(fates(rules, dict(s)))] for s in sets[:5])


def test_the_page_block_carries_what_the_page_draws_and_the_profile_rule_is_the_stated_one():
    block = search_block()
    b = board()
    assert block["combos"] == b["combos"] and block["genes"] == b["genes"] and [p["verdicts"] for p in block["profiles"]] == [p["verdicts"] for p in b["profiles"]]
    assert set(block["profiles"][0]) == {"forced", "samples", "baseline", "verdicts", "found"} and block["rule"] == b["rule"]
    searched, skipped = chosen(json.loads(GENOTYPES.read_text(encoding="utf-8")))
    assert [p["forced"] for p in b["profiles"][1:]] == [s["forced"] for s in searched] and len(skipped) == len(b["no_search_needed"])
