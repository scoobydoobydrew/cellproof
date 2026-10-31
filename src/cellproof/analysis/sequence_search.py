"""The searches of docs/sequential_protocol.md and the file they write, results/sequences.json.

V   the exact reachability against the tissue runs (radiation alone and the 22 sets);
S1  every single literal and every pair of literals on two nodes: H0 and H1 as one stage, H2 in both orders;
S3  the five kinases named in the project brief, knock-outs only: every subset in every ordered list of stages.

Everything is computed under two meanings of "dead" (`settled`, the protocol's first, and `visit`, added by its Amendment 1 after the
first validation failed; see analysis.sequential). `make verify` only reads the stored file; `python -m cellproof.cli sequences`
computes it (a few minutes on several cores).
"""
from __future__ import annotations

import json
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from itertools import combinations
from pathlib import Path

from cellproof.analysis.interventions import describe, minimal_sets
from cellproof.analysis.sequential import BRIEF_KINASES, Explorer, Literal, offered_nodes, ordered_partitions, pair_row, single_row, stage_name, triple_row
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "results" / "sequences.json"
MODEL = "data/models/repaired_min2.bnet"
TISSUE = ROOT / "results" / "tissue"
AGREE_BELOW = 0.01  # the threshold of the 22-of-22 tissue check, fixed before the runs
COMMITTED_FATES = ("arrest", "senescence", "autophagy", "apoptosis")  # what the simulation can say a cell has become; "none" is not a fate
DEATHS = ("settled", "visit")

_EXPLORERS: dict[str, Explorer] = {}


def _explorer(death: str) -> Explorer:
    if death not in _EXPLORERS:
        _EXPLORERS[death] = Explorer(load_bnet(ROOT / MODEL), death)
    return _EXPLORERS[death]


def literal_pairs(rules: dict[str, str]) -> list[tuple[Literal, Literal]]:
    nodes = offered_nodes(rules)
    return [((a, va), (b, vb)) for a, b in combinations(nodes, 2) for va in (0, 1) for vb in (0, 1)]


def _pairs_chunk(task: tuple[str, list[tuple[Literal, Literal]]]) -> list[dict]:
    death, chunk = task
    return [pair_row(_explorer(death), a, b) for a, b in chunk]


def _triples_chunk(task: tuple[str, list[tuple[Literal, ...]]]) -> list[dict]:
    death, chunk = task
    explorer = _explorer(death)
    rows = [triple_row(explorer, t) for t in chunk]
    if explorer.size() > 700:  # a long search would keep every network in memory
        explorer.forget()
    return rows


def triples_search(rules: dict[str, str], death: str, singles: list[dict], pairs: list[dict], pool: ProcessPoolExecutor) -> dict:
    """S2: three knock-outs on three different nodes, as one stage and in every other ordered list of stages. Only sets with no hit inside them
    are searched (a set that has a smaller hit inside is not minimal, and any order of it is trivially a hit)."""
    nodes = offered_nodes(rules)
    single_hits = {tuple(r["literal"]) for r in singles if r["h1"]}
    pair_hits = {frozenset(tuple(l) for l in r["literals"]) for r in pairs if r["h1"]}
    triples = []
    for combo in combinations(nodes, 3):
        literals = tuple((n, 0) for n in combo)
        if any(l in single_hits for l in literals) or any(frozenset(pair) in pair_hits for pair in combinations(literals, 2)):
            continue
        triples.append(literals)
    tasks = [(death, triples[i:i + 12]) for i in range(0, len(triples), 12)]
    rows = [row for part in pool.map(_triples_chunk, tasks) for row in part]
    name = lambda r: describe(tuple(tuple(l) for l in r["literals"]))  # noqa: E731
    return {"meaning": death, "triples": len(list(combinations(nodes, 3))), "searched": len(triples), "sequences": sum(len(list(ordered_partitions(t))) for t in triples),
            "h1_minimal": [name(r) for r in rows if r["h1"]],
            "sequence_only": [{"label": name(r), "orders": r["h2_orders"]} for r in rows if not r["h1"] and r["h2_orders"] > 0]}


def validate(settled: Explorer, visit: Explorer) -> dict:
    """Exact analysis against the stored tissue runs (radiation alone, the 11 solver sets and the 11 rejected sets).

    V1, fixed in the protocol before any result, with the `settled` meaning: the fates the simulation reached (arrest, senescence,
    autophagy, apoptosis) must all be among the attractor fates the exact analysis can reach, and where it says no cell can survive,
    fewer than AGREE_BELOW of the cells may be alive at the end of the stored run.

    V2, added by Amendment 1 after V1 had failed for 8 conditions, with the `visit` meaning that the simulation implements: the exact
    analysis says a cell can survive exactly when the simulated share alive is AGREE_BELOW or more (the two-sided check of the earlier
    22-of-22 comparison), and the fates the simulation shows are phenotypes of states that are reachable at all."""
    summary = json.loads((TISSUE / "summary.json").read_text(encoding="utf-8"))
    rows = []
    for row in summary["rows"]:
        if row["group"] not in ("radiation", "hit", "miss"):
            continue
        setting = json.loads((TISSUE / f"{row['name']}.json").read_text(encoding="utf-8"))["setting"]
        held = frozenset((node, int(value)) for node, value in setting.items())
        seen = {"arrest": row["arrest"] > 0, "senescence": row["senescence"] > 0, "autophagy": row["autophagy"] > 0, "apoptosis": row["dead"] > 0}
        alive = row["alive_end"] / row["cells"]
        by_settled, by_visit = settled.reached((held,)), visit.reached((held,))
        visited = settled.visited_fates(held)
        rows.append({
            "name": row["name"], "label": row["label"], "simulated_fates": [f for f in COMMITTED_FATES if seen[f]], "alive_share": round(alive, 4),
            "settled_reachable": sorted(set(by_settled.labels)), "settled_only_apoptosis": by_settled.alive is None,
            "v1_fates_within_reachable": all(f in by_settled.labels for f, yes in seen.items() if yes),
            "v1_only_apoptosis_leaves_few": by_settled.alive is not None or alive < AGREE_BELOW,
            "visit_survivors": sorted(set(by_visit.labels)), "visit_only_death": by_visit.alive is None,
            "v2_survival_matches": (by_visit.alive is not None) == (alive >= AGREE_BELOW),
            "visited_fates": sorted(visited), "v2_fates_visited": all(f in visited for f, yes in seen.items() if yes)})
    count = lambda key: sum(r[key] for r in rows)  # noqa: E731
    return {"agree_below": AGREE_BELOW, "conditions": rows, "total": len(rows),
            "v1_fates_within_reachable": count("v1_fates_within_reachable"), "v1_only_apoptosis_leaves_few": count("v1_only_apoptosis_leaves_few"),
            "v2_survival_matches": count("v2_survival_matches"), "v2_fates_visited": count("v2_fates_visited"),
            "settled_only_apoptosis": count("settled_only_apoptosis"), "visit_only_death": count("visit_only_death")}


def summarize(singles: list[dict], pairs: list[dict], solver_sets: list[tuple[Literal, ...]]) -> dict:
    """The sets of the protocol, from the rows: minimal sets under H0 and H1, and the sequence-only pairs."""
    h0_single = {tuple(r["literal"]) for r in singles if r["h0"]}
    h1_single = {tuple(r["literal"]) for r in singles if r["h1"]}

    def minimal(key: str, smaller: set[Literal]) -> list[list[Literal]]:
        """The single literals that satisfy the condition, then the pairs that do and have no such literal inside."""
        sets = [[literal] for literal in sorted(smaller)]
        sets += [[tuple(l) for l in r["literals"]] for r in pairs if r[key] and not any(tuple(l) in smaller for l in r["literals"])]
        return sets

    h0_sets = minimal("h0", h0_single)
    h1_sets = minimal("h1", h1_single)
    h0_names = {describe(tuple(s)) for s in h0_sets}
    sequence_only = [r for r in pairs if not r["h1"] and (r["h2_ab"] or r["h2_ba"]) and not any(tuple(l) in h1_single for l in r["literals"])]
    solver_names = {describe(tuple(sorted(s))) for s in solver_sets}
    return {
        "h0_minimal": [describe(tuple(s)) for s in h0_sets], "h1_minimal": [describe(tuple(s)) for s in h1_sets],
        "h1_only": sorted(describe(tuple(s)) for s in h1_sets if describe(tuple(s)) not in h0_names),
        "h0_equals_solver": h0_names == solver_names, "h0_not_in_solver": sorted(h0_names - solver_names), "solver_not_in_h0": sorted(solver_names - h0_names),
        "sequence_only": [{"literals": r["literals"], "label": describe(tuple(tuple(l) for l in r["literals"])), "a_then_b": r["h2_ab"], "b_then_a": r["h2_ba"]} for r in sequence_only],
        "pairs": len(pairs), "singles": len(singles),
        "pairs_h1": sum(r["h1"] for r in pairs), "pairs_h2_either_order": sum(r["h2_ab"] or r["h2_ba"] for r in pairs),
        "pairs_order_matters": sum(r["h2_ab"] != r["h2_ba"] for r in pairs if not any(tuple(l) in h1_single for l in r["literals"])),
    }


def kinase_search(explorer: Explorer) -> dict:
    """Every subset of the five kinases of the brief, knocked out, in every ordered list of stages."""
    literals = tuple((node, 0) for node in BRIEF_KINASES)
    rows = []
    for k in range(1, len(literals) + 1):
        for subset in combinations(literals, k):
            for stages in ordered_partitions(subset):
                reached = explorer.reached(stages)
                rows.append({"stages": stage_name(stages), "literals": k, "hit": reached.alive is None, "fates": sorted(set(reached.labels))})
    fate_sets = Counter(tuple(r["fates"]) for r in rows)
    return {"nodes": list(BRIEF_KINASES), "sequences": len(rows), "hits": sum(r["hit"] for r in rows),
            "fate_sets": [{"fates": list(f), "sequences": n} for f, n in sorted(fate_sets.items(), key=lambda kv: -kv[1])], "rows": rows}


def one_meaning(death: str, rules: dict[str, str], explorer: Explorer, pool: ProcessPoolExecutor, kinases: bool) -> dict:
    nodes = offered_nodes(rules)
    singles = [single_row(explorer, (n, v)) for n in nodes for v in (0, 1)]
    pairs_in = literal_pairs(rules)
    tasks = [(death, pairs_in[i:i + 24]) for i in range(0, len(pairs_in), 24)]
    details = [row for part in pool.map(_pairs_chunk, tasks) for row in part]
    pairs = [{k: r[k] for k in ("literals", "h0", "h1", "h2_ab", "h2_ba")} for r in details]
    out = {"radiation_alone": {"all_attractors": sorted(lab for _, lab in explorer.attractors(frozenset())), "reachable": sorted(set(explorer.reached((frozenset(),)).labels))},
           "singles": singles, "pairs": pairs, "pair_details": [r for r in details if r["h1"] or r["h2_ab"] or r["h2_ba"]],
           "summary": summarize(singles, pairs, minimal_sets(rules, 2))}
    if kinases:
        out["kinases"] = kinase_search(explorer)
    return out


def run(workers: int = 6, kinases: bool = True, triples: bool = True) -> dict:
    rules = load_bnet(ROOT / MODEL)
    explorers = {death: Explorer(rules, death) for death in DEATHS}
    result = {"protocol": "docs/sequential_protocol.md", "model": MODEL, "nodes": offered_nodes(rules)}
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for death in DEATHS:
            result[death] = one_meaning(death, rules, explorers[death], pool, kinases)
        if triples:
            result["s2"] = triples_search(rules, "visit", result["visit"]["singles"], result["visit"]["pairs"], pool)
    result["validation"] = validate(explorers["settled"], explorers["visit"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    return result
