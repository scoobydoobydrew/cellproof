"""The tissue experiments: a disc of irradiated cells under each intervention the exact solver found (its hits), under
interventions of the same size that the solver rejected (its misses, a seeded random draw), and under no intervention. The
simulation (PhysiBoSS) and the search (the exact solver) are different engines, so each agreeing with the other is a check
of the translation and of the search, not a new finding about biology.

Everything that is an assumption is in `Settings` and in docs/tissue_notes.md.
"""
from __future__ import annotations

import json
import random
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from itertools import combinations

from cellproof.analysis.interventions import READOUT_NODES, describe, fates, minimal_sets
from cellproof.tissue.project import Settings
from cellproof.tissue.run import OUT, simulate

SEED = 20261031  # draws the misses
SIZE = 2  # genes changed at once, as in the exhaustive search of the report
BASE_SETTINGS = Settings(radius=300.0, max_time=4320.0, snapshot=180.0, threads=3)
LONG = {"max_time": 14400.0, "snapshot": 720.0}  # 240 hours: does what is still alive at 72 hours keep dying, or is it stuck?
RATES = {"unit": 1 / 60, "slow": 1 / 600}  # apoptosis-rate variants of the radiation-only run (per minute: one and a tenth per model time unit); the default is Settings'


def misses(rules: dict[str, str], hits: list, count: int) -> list[tuple[tuple[str, int], ...]]:
    """`count` sets of up to SIZE changes after which the damaged cell does NOT have apoptosis as its only fate, drawn with a fixed seed."""
    literals = [(node, value) for node in sorted(n for n in rules if n not in READOUT_NODES) for value in (0, 1)]
    candidates = [tuple(sorted(c)) for k in range(1, SIZE + 1) for c in combinations(literals, k) if len({n for n, _ in c}) == k]
    failing = [c for c in candidates if fates(rules, dict(c)) != {"apoptosis"}]
    return sorted(random.Random(SEED).sample(failing, count))


def conditions(rules: dict[str, str]) -> list[dict]:
    hits = minimal_sets(rules, SIZE)
    drawn = misses(rules, hits, len(hits))
    out = [{"name": "radiation_only", "group": "radiation", "label": "radiation only", "setting": {}, "settings": {}}]
    for key, kind, sets in (("hit", "solver", hits), ("miss", "random", drawn)):
        for k, literals in enumerate(sets, 1):
            out.append({"name": f"{key}_{k:02d}", "group": key, "label": describe(literals), "setting": dict(literals), "settings": {}})
    for key, rate in RATES.items():
        out.append({"name": f"rate_{key}", "group": "rate", "label": f"radiation only, apoptosis rate {rate:g} per minute", "setting": {}, "settings": {"apoptosis_rate": rate}})
    for k, literals in enumerate(hits, 1):
        out.append({"name": f"long_hit_{k:02d}", "group": "long", "label": f"{describe(literals)}, 240 h", "setting": dict(literals), "settings": LONG})
    return out


def run_all(rules: dict[str, str], template: str, *, force: bool = False, workers: int = 6) -> list[dict]:
    plan = conditions(rules)
    OUT.mkdir(parents=True, exist_ok=True)

    def one(index_and_condition):
        index, condition = index_and_condition
        path = OUT / f"{condition['name']}.json"
        if path.exists() and not force:
            result = json.loads(path.read_text(encoding="utf-8"))
        else:
            settings = replace(BASE_SETTINGS, seed=1000 + index, **condition["settings"])
            result = simulate(condition["name"], rules, condition["setting"], settings, template, keep_frames=condition["group"] != "long")
        print(f"{condition['name']:15s} {condition['label']:44s} alive at the end: {result['alive'][-1]} of {result['cells']}", flush=True)
        return {**result, **{k: condition[k] for k in ("group", "label")}}

    with ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(one, enumerate(plan)))


def table(results: list[dict]) -> list[dict]:
    """One row per condition: how many cells are alive at the end, how they ended, and when 90% were gone."""
    rows = []
    for r in results:
        counts, n = r["counts"][-1], r["cells"]
        gone_90 = next((t for t, alive in zip(r["times"], r["alive"]) if alive <= 0.1 * n), None)
        rows.append({"name": r["name"], "group": r["group"], "label": r["label"], "cells": n, "alive_end": r["alive"][-1],
                     "none": counts[0], "arrest": counts[1], "senescence": counts[2], "autophagy": counts[3], "dead": counts[4] + counts[5],
                     "minutes_to_90_percent_dead": gone_90, "seed": r.get("seed")})
    return rows
