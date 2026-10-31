import random
import re
from pathlib import Path

import pytest

from cellproof.analysis.attractors import fixed_points, perturb
from cellproof.analysis.interventions import minimal_sets
from cellproof.network.bnet import load_bnet
from cellproof.network.logic import evaluate
from cellproof.network.phenotypes import classify
from cellproof.tissue.maboss import FATE_OF, READOUTS, bnd, cfg, healthy_state, start_state

DATA = Path(__file__).resolve().parents[1] / "data"
BASE = load_bnet(DATA / "base" / "gupta2023.bnet")
CHECKED = load_bnet(DATA / "models" / "repaired_min2.bnet")
UNCHECKED = load_bnet(DATA / "models" / "naive_min2.bnet")
NODE = re.compile(r"Node (\w+) \{\n  logic = (.*);\n  rate_up = @logic \? (\$\w+) : 0;\n  rate_down = @logic \? 0 : (\$\w+);\n\}")


def _fates_on(state: dict[str, int]) -> set[str]:
    return {FATE_OF[node] for node, rule in READOUTS.items() if evaluate(rule, state)}


def test_each_output_node_is_on_exactly_when_the_phenotype_function_names_that_fate():
    """PhysiBoSS can connect one node to a behaviour, not a pattern, so the fates are nodes of their own; they must say what
    classify says. Checked on every stable state of the damaged network under every intervention of the search, and on random
    states, which also covers the states the simulation passes through."""
    states = [fp for setting in ({}, *(dict(s) for s in minimal_sets(BASE, 2))) for fp in fixed_points(perturb(BASE, {"DNA_damage": 1, **setting}))]
    rng = random.Random(7)
    states += [{node: rng.randint(0, 1) for node in BASE} for _ in range(4000)]
    damaged_fates = {"apoptosis", "autophagy", "senescence", "arrest"}
    seen = set()
    for state in states:
        verdict = classify(state)
        assert _fates_on(state) == ({verdict} if verdict in damaged_fates else set()), state
        seen |= _fates_on(state)
    assert seen == damaged_fates  # every fate is exercised by the states above


def test_the_network_file_keeps_every_rule_word_for_word_and_a_forced_gene_becomes_a_constant():
    text = bnd(CHECKED, {"PTEN": 0, "E2F1": 1})
    parsed = {name: (logic, rate_up) for name, logic, rate_up, rate_down in NODE.findall(text)}
    assert all(up == down for _, _, up, down in NODE.findall(text))  # one rate per node, up and down
    assert len(parsed) == len(CHECKED) + len(READOUTS) == text.count("Node ")
    for node, rule in CHECKED.items():
        expected = {"PTEN": "0", "E2F1": "1"}.get(node, rule)
        assert parsed[node] == (expected, "$rate"), node
    assert all(parsed[node] == (rule, "$readout_rate") for node, rule in READOUTS.items())


def test_an_undamaged_cell_has_one_stable_state_in_the_published_and_the_checked_network_but_not_in_the_unchecked_one():
    for rules in (BASE, CHECKED):
        healthy = healthy_state(rules)
        assert healthy["DNA_damage"] == 0 and set(healthy) == set(rules)
    assert healthy_state(BASE) == {k: v for k, v in healthy_state(CHECKED).items() if k in BASE}
    with pytest.raises(ValueError, match="exactly one stable state"):
        healthy_state(UNCHECKED)  # applying the rules unchecked leaves three: a symptom of what the solver catches


def test_the_start_state_is_a_healthy_cell_hit_by_the_radiation_with_the_intervention_applied():
    healthy = healthy_state(CHECKED)
    state = start_state(CHECKED, {"PTEN": 0, "E2F1": 1})
    assert state["DNA_damage"] == 1 and state["PTEN"] == 0 and state["E2F1"] == 1
    assert all(state[node] == healthy[node] for node in CHECKED if node not in ("DNA_damage", "PTEN", "E2F1"))
    assert all(state[node] == 0 for node in READOUTS) and set(state) == set(CHECKED) | set(READOUTS)


def test_the_run_file_gives_every_node_a_start_state_and_the_two_rates():
    state = start_state(BASE)
    text = cfg(state, seed=5)
    starts = dict(re.findall(r"^(\w+)\.istate = (\d);$", text, flags=re.M))
    assert starts == {node: str(value) for node, value in state.items()}
    assert "$rate = 1.0;" in text and "$readout_rate = 20.0;" in text and "seed_pseudorandom = 5;" in text
