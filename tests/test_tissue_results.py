import json
import random
from collections import Counter
from pathlib import Path

import pytest

from cellproof.analysis.interventions import describe, fates, minimal_sets
from cellproof.network.bnet import load_bnet
from cellproof.network.logic import evaluate
from cellproof.network.phenotypes import classify
from cellproof.report.data import AGREE_BELOW
from cellproof.tissue.experiments import SEED, misses, novel_sets
from cellproof.tissue.maboss import start_state

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "results" / "tissue"
CHECKED = load_bnet(ROOT / "data" / "models" / "repaired_min2.bnet")
summary = json.loads((FOLDER / "summary.json").read_text(encoding="utf-8")) if (FOLDER / "summary.json").exists() else None
pytestmark = pytest.mark.skipif(summary is None, reason="results/tissue has not been written (python -m cellproof.cli tissue)")


def rows(group):
    return [r for r in summary["rows"] if r["group"] == group]


def run(name):
    return json.loads((FOLDER / f"{name}.json").read_text(encoding="utf-8"))


def test_the_stored_hits_are_the_solvers_current_sets_and_the_misses_are_sets_it_rejects():
    sets = minimal_sets(CHECKED, 2)
    assert [r["label"] for r in rows("hit")] == [describe(s) for s in sets]
    drawn = misses(CHECKED, sets, len(sets))
    assert [r["label"] for r in rows("miss")] == [describe(s) for s in drawn]  # same seed, same draw
    assert all(fates(CHECKED, dict(s)) != {"apoptosis"} for s in drawn) and SEED == 20261031


def test_the_simulation_and_the_exact_solver_agree_on_every_set_and_the_solvers_sets_reach_zero_in_the_long_runs():
    for r in rows("hit"):
        assert r["alive_end"] / r["cells"] < AGREE_BELOW, r["label"]  # after 72 hours; a few cells are still dying
    for r in rows("miss"):
        assert r["alive_end"] / r["cells"] >= AGREE_BELOW, r["label"]
    longs = rows("long")
    assert len(longs) == len(rows("hit")) and all(r["alive_end"] == 0 for r in longs)  # slow, not stuck


@pytest.mark.skipif(not (ROOT / "results" / "sequences.json").exists(), reason="results/sequences.json has not been written")
def test_v3_the_sets_that_only_the_start_aware_analysis_finds_leave_no_cell_alive_as_predicted():
    """docs/sequential_protocol.md, V3: the prediction (fewer than 1% alive at 72 h) was written down before these runs."""
    stored = json.loads((ROOT / "results" / "sequences.json").read_text(encoding="utf-8"))["visit"]["summary"]["h1_only"]
    novel = rows("novel")
    assert [r["label"] for r in novel] == stored == ["AMPK_MAPK KO + CHK1 KO", "Cdc25 E1", "Sirt1 E1"]
    assert all(r["alive_end"] / r["cells"] < AGREE_BELOW for r in novel)
    assert all(fates(CHECKED, dict(s)) != {"apoptosis"} for s in novel_sets())  # the solver, which looks at every start, does not find them


def test_every_run_accounts_for_every_cell_at_every_snapshot_and_the_layout_is_shared():
    positions = None
    for r in summary["rows"]:
        data = run(r["name"])
        assert all(sum(c) == data["cells"] for c in data["counts"]), r["name"]
        assert data["counts"][0] == [data["cells"], 0, 0, 0, 0, 0]  # the radiation has just hit healthy cells
        assert data["alive"] == [sum(c[:4]) for c in data["counts"]]
        if "frames" in data:
            assert len(data["frames"]) == len(data["times"]) and all(len(f) == data["cells"] for f in data["frames"])
            positions = positions or data["positions"]
            assert data["positions"] == positions
    assert len({r["seed"] for r in summary["rows"]}) == len(summary["rows"])  # no two conditions share a random stream


def test_a_plain_asynchronous_simulation_reaches_the_same_end_states_in_about_the_same_shares_as_the_simulator():
    """An independent implementation of the same rule (every node that disagrees with its rule flips at the same rate; no MaBoSS, no
    PhysiBoSS, no agents) must end where the stored simulation of the radiation-only tissue ended."""
    stored = run("radiation_only")
    rng = random.Random(11)
    names, n, out = list(CHECKED), 800, Counter()
    for _ in range(n):
        state = {k: v for k, v in start_state(CHECKED).items() if k in CHECKED}
        for _ in range(20000):
            wants = [k for k in names if evaluate(CHECKED[k], state) != state[k]]
            if not wants:
                break
            state[rng.choice(wants)] ^= 1
        out[classify(state)] += 1
    assert set(out) <= {"apoptosis", "senescence"}  # the other two stable states are reached by neither engine
    assert stored["counts"][-1][1] == stored["counts"][-1][3] == 0
    assert abs(stored["counts"][-1][2] / stored["cells"] - out["senescence"] / n) < 0.03
