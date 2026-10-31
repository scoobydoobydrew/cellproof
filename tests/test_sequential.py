import json
import random
from pathlib import Path

import biodivine_aeon as aeon
import pytest

from cellproof.analysis.interventions import describe, minimal_sets
from cellproof.analysis.sequential import Explorer, fate_patterns, ordered_partitions, stage_name
from cellproof.network.bnet import load_bnet
from cellproof.network.phenotypes import classify

ROOT = Path(__file__).resolve().parents[1]
rules = load_bnet(ROOT / "data" / "models" / "repaired_min2.bnet")
STORED = ROOT / "results" / "sequences.json"


@pytest.fixture(scope="module")
def settled():
    return Explorer(rules, "settled")


@pytest.fixture(scope="module")
def visit():
    return Explorer(rules, "visit")


def lit(node, value=0):
    return frozenset({(node, value)})


def test_the_fate_patterns_are_what_classify_says_on_random_states(settled):
    graph = settled.graph(frozenset())
    patterns = fate_patterns(graph)
    rng = random.Random(1)
    for p_on in (0.5, 0.85):  # the second makes the fate patterns common enough to be tested
        for _ in range(250):
            state = {node: rng.random() < p_on for node in rules}
            state["DNA_damage"] = True
            point = graph.mk_subspace(state)
            inside = [name for name, pattern in patterns.items() if not pattern.intersect(point).is_empty()]
            expected = classify({node: int(value) for node, value in state.items()})
            assert inside == ([expected] if expected in patterns else []), state


def test_ordered_partitions_are_the_fubini_numbers_and_cover_every_set_once():
    counts = [sum(1 for _ in ordered_partitions(tuple((f"n{i}", 0) for i in range(k)))) for k in range(1, 6)]
    assert counts == [1, 3, 13, 75, 541]
    three = tuple((n, 0) for n in "abc")
    for stages in ordered_partitions(three):
        assert sorted(l for s in stages for l in s) == sorted(three) and all(stages)
    assert stage_name((lit("ATR"), frozenset({("CHK1", 0), ("Wee1", 1)}))) == "ATR KO  then  CHK1 KO + Wee1 E1"


def test_radiation_alone_has_four_attractors_and_a_healthy_cell_can_reach_only_two_of_them(settled, visit):
    assert sorted(lab for _, lab in settled.attractors(frozenset())) == ["apoptosis", "arrest", "autophagy", "senescence"]
    assert sorted(set(settled.reached((frozenset(),)).labels)) == ["apoptosis", "senescence"]  # the two fates the tissue run reached
    assert visit.reached((frozenset(),)).labels == ("senescence",)  # a cell that touches an apoptosis state dies; only senescence survives


def test_h0_agrees_with_the_solvers_fixed_point_search_on_single_literals_and_h1_adds_two(settled, visit):
    solver_singles = {s[0] for s in minimal_sets(rules, 1)}
    singles = [(n, v) for n in ("Cdc25", "E2F1", "Myc", "PTEN", "RB", "Sirt1", "TUG1", "WWP1", "miR221", "AKT", "p53") for v in (0, 1)]
    h0 = {s for s in singles if settled.h0(frozenset({s}))}
    h1 = {s for s in singles if settled.h1(frozenset({s}))}
    assert h0 == {s for s in singles if s in solver_singles}
    assert h1 - h0 == {("Cdc25", 1), ("Sirt1", 1)}  # only apoptosis is reachable from a healthy start, though other attractors exist
    assert all(visit.h1(frozenset({s})) for s in h1)


def test_a_cell_that_is_already_dead_gets_no_later_stage(settled):
    stages = (lit("PTEN"), lit("Cdc25", 1))
    assert settled.h1(lit("PTEN")) and settled.reached(stages).alive is None and settled.reached(stages).labels == ()
    with pytest.raises(ValueError):
        settled.reached((lit("PTEN"), lit("PTEN", 1)))  # one node, two stages


def test_the_symbolic_second_stage_equals_enumerating_the_states_of_the_first(settled):
    """The second stage sets the new nodes in every state the cells settled in. Check it against doing exactly that state by state."""
    first, second = lit("ATR"), lit("CHK1")
    before = settled.reached((first,))
    assert before.alive is not None  # some cells survive the first stage, so the second stage has something to do
    both = first | second
    graph = settled.graph(both)
    start = None
    for state in before.alive.vertices().items():
        point = graph.mk_subspace({**state.to_named_dict(), "CHK1": False})
        start = point if start is None else start.union(point)
    reach = aeon.Reachability.reach_fwd(graph, start)
    expected = tuple(sorted(lab for a, lab in settled.attractors(both) if not a.intersect(reach).is_empty()))
    assert settled.reached((first, second)).labels == expected


@pytest.mark.skipif(not STORED.exists(), reason="results/sequences.json has not been written")
def test_the_stored_searches_say_what_the_amended_protocol_reports():
    d = json.loads(STORED.read_text(encoding="utf-8"))
    solver = {describe(tuple(sorted(s))) for s in minimal_sets(rules, 2)}
    for death in ("settled", "visit"):
        part, s = d[death], d[death]["summary"]
        assert part["radiation_alone"]["all_attractors"] == ["apoptosis", "arrest", "autophagy", "senescence"]
        assert set(s["h0_minimal"]) == solver and s["h0_equals_solver"] and len(s["h0_minimal"]) == 11  # the all-attractor reading reproduces the fixed-point search
        assert s["h1_only"] == ["AMPK_MAPK KO + CHK1 KO", "Cdc25 E1", "Sirt1 E1"] and len(s["h1_minimal"]) == 10
        assert s["sequence_only"] == [] and s["pairs"] == 1012 and s["singles"] == 46  # settling in between finds nothing that one stage does not
        assert part["kinases"]["sequences"] == 1081 and part["kinases"]["hits"] == 0
        assert all(r["h1"] for r in part["pairs"] if r["h0"]) and all(r["h1"] for r in part["singles"] if r["h0"])  # H0 implies H1
    assert d["settled"]["radiation_alone"]["reachable"] == ["apoptosis", "senescence"] and d["visit"]["radiation_alone"]["reachable"] == ["senescence"]
    s2 = d["s2"]  # three knock-outs, `visit`: only sets with no smaller hit inside were searched, in every ordered list of stages
    assert (s2["meaning"], s2["triples"], s2["searched"], s2["sequences"]) == ("visit", 1771, 1122, 14586) and s2["h1_minimal"] == [] and s2["sequence_only"] == []


@pytest.mark.skipif(not STORED.exists(), reason="results/sequences.json has not been written")
def test_one_pair_works_only_when_both_changes_are_made_at_once_because_the_first_leaves_cells_that_settle_in_senescence():
    d = json.loads(STORED.read_text(encoding="utf-8"))
    for death in ("settled", "visit"):
        only_at_once = [r for r in d[death]["pairs"] if r["h1"] and not (r["h2_ab"] or r["h2_ba"])]
        assert [r["literals"] for r in only_at_once] == [[["AMPK_MAPK", 0], ["CHK1", 0]]]
        detail = next(r for r in d[death]["pair_details"] if r["literals"] == [["AMPK_MAPK", 0], ["CHK1", 0]])
        for key in ("ab_fates", "ba_fates"):
            assert "senescence" in detail[key]["after_stage_1"] and detail[key]["after_stage_2"] == ["senescence"]  # the second change does not move the settled cells
        alone = {tuple(r["literal"]) for r in d[death]["singles"] if r["h1"]}
        some_order = [r for r in d[death]["pairs"] if (r["h2_ab"] or r["h2_ba"]) and not r["h1"]]
        assert some_order and all(any(tuple(l) in alone for l in r["literals"]) for r in some_order)  # the pairs that work only in some order contain a literal that works alone


@pytest.mark.skipif(not STORED.exists(), reason="results/sequences.json has not been written")
def test_the_two_validations_against_the_tissue_are_reported_as_they_came_out():
    v = json.loads(STORED.read_text(encoding="utf-8"))["validation"]
    assert v["total"] == 23 and v["agree_below"] == 0.01
    assert v["v1_fates_within_reachable"] == 15 and v["v1_only_apoptosis_leaves_few"] == 23  # V1, as fixed before the results: failed for 8 conditions
    failed = {r["name"] for r in v["conditions"] if not r["v1_fates_within_reachable"]}
    assert failed == {"hit_03", "hit_05", "hit_06", "hit_07", "miss_01", "miss_02", "miss_03", "miss_07"}  # the eight listed in Amendment 1
    assert v["v2_survival_matches"] == 23 and v["v2_fates_visited"] == 23  # V2, added after seeing V1: the meaning the simulation implements
    assert v["settled_only_apoptosis"] == v["visit_only_death"] == 11
