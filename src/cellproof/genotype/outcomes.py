"""What the model says for each genotype signature (docs/genotype_protocol.md), with the solver's own exact function.

For every distinct signature S: the fates of the damaged cell with S forced, and with S and each of the 11 solver sets forced together
(a set that asks for the opposite of what the genotype forces is not applicable); for the most frequent signatures also the exhaustive
search for minimal sets of up to two literals on the network with S forced. Counts only; `make verify` reads results/genotypes.json.
"""
from __future__ import annotations

import json
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from itertools import combinations
from pathlib import Path

from cellproof.analysis.interventions import READOUT_NODES, describe, fates, minimal_sets
from cellproof.genotype.signatures import MODEL, SIGNATURES, TP53_NODE, Signature, decode
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[3]
RESULTS = ROOT / "results" / "genotypes.json"
TOP = 20
LABELS = ("only_apoptosis", "other", "no_stable_state")
Literal = tuple[str, int]

_RULES: dict[str, str] | None = None


def _rules() -> dict[str, str]:
    global _RULES
    if _RULES is None:
        _RULES = load_bnet(ROOT / MODEL)
    return _RULES


def outcome(fate_set: set) -> str:
    """Only apoptosis, no stable state (the network oscillates), or something else."""
    return "only_apoptosis" if fate_set == {"apoptosis"} else "no_stable_state" if not fate_set else "other"


def applicable(genotype: dict[str, int], literals: tuple[Literal, ...]) -> bool:
    """A set is applicable unless one of its literals asks for the opposite of a node the genotype forces."""
    return all(genotype.get(node, value) == value for node, value in literals)


def minimal_sets_given(rules: dict[str, str], genotype: dict[str, int], max_size: int = 2) -> list[tuple[Literal, ...]]:
    """`analysis.interventions.minimal_sets` on the network with the genotype forced, over nodes the genotype does not force."""
    nodes = sorted(n for n in rules if n not in READOUT_NODES and n not in genotype)
    literals = [(n, v) for n in nodes for v in (0, 1)]
    found: list[frozenset[Literal]] = []
    for size in range(1, max_size + 1):
        for combo in combinations(literals, size):
            if len({n for n, _ in combo}) < size:
                continue
            chosen = frozenset(combo)
            if any(smaller <= chosen for smaller in found):
                continue
            if fates(rules, {**genotype, **dict(combo)}) == {"apoptosis"}:
                found.append(chosen)
    return [tuple(sorted(s)) for s in found]


def _search(signature: Signature) -> list[tuple[Literal, ...]]:
    return minimal_sets_given(_rules(), dict(signature))


class Evaluator:
    def __init__(self, rules: dict[str, str]):
        self.rules = rules
        self.sets = minimal_sets(rules, 2)
        self._cache: dict[tuple, set] = {}

    def fates(self, setting: dict[str, int]) -> set:
        key = tuple(sorted(setting.items()))
        if key not in self._cache:
            self._cache[key] = fates(self.rules, setting)
        return self._cache[key]

    def row(self, signature: Signature) -> dict:
        """The baseline label and, per solver set, a label or None when the set is not applicable."""
        genotype = dict(signature)
        return {"baseline": outcome(self.fates(genotype)),
                "sets": [outcome(self.fates({**genotype, **dict(s)})) if applicable(genotype, s) else None for s in self.sets]}


def tally(rows: list[tuple[dict, int]], index: int | None) -> dict[str, int]:
    """Counts by label over (row, number of samples) pairs; index None is the baseline, else a solver set (None is `not_applicable`)."""
    count = Counter()
    for row, n in rows:
        label = row["baseline"] if index is None else row["sets"][index]
        count[label or "not_applicable"] += n
    return {k: count.get(k, 0) for k in (*LABELS, "not_applicable") if index is not None or k != "not_applicable"}


def aggregate(table: dict, rule: str, evaluator: Evaluator, specific: dict[Signature, list]) -> dict:
    per_study = {study: decode(block[rule]) for study, block in table["studies"].items()}
    pooled = sum(per_study.values(), Counter())
    rows = {sig: evaluator.row(sig) for sig in pooled}

    def lost(sig: Signature) -> bool:
        return (TP53_NODE, 0) in sig

    def pick(counter: Counter, keep=lambda sig: True) -> list[tuple[dict, int]]:
        return [(rows[sig], n) for sig, n in counter.items() if keep(sig)]

    sets = []
    for k, literals in enumerate(evaluator.sets):
        sets.append({"label": describe(literals), "all": tally(pick(pooled), k), "tp53_lost": tally(pick(pooled, lost), k), "tp53_intact": tally(pick(pooled, lambda s: not lost(s)), k)})
    studies = []
    for study, counter in per_study.items():
        studies.append({"study": study, "samples": sum(counter.values()), "altered": sum(n for sig, n in counter.items() if sig), "tp53_lost": sum(n for sig, n in counter.items() if lost(sig)),
                        "baseline_only_apoptosis": tally(pick(counter), None)["only_apoptosis"],
                        "sets_only_apoptosis": [tally(pick(counter), k)["only_apoptosis"] for k in range(len(evaluator.sets))]})
    top = []
    for sig, n in sorted(((s, n) for s, n in pooled.items() if s), key=lambda kv: (-kv[1], kv[0]))[:TOP]:
        found = specific.get(sig)
        top.append({"signature": [list(p) for p in sig], "samples": n, "baseline": rows[sig]["baseline"], "baseline_fates": sorted("unclassified" if f is None else f for f in evaluator.fates(dict(sig))),
                    "sets_that_leave_only_apoptosis": [describe(evaluator.sets[k]) for k, label in enumerate(rows[sig]["sets"]) if label == "only_apoptosis"],
                    "specific_sets": None if found is None else [describe(s) for s in found],
                    "specific_search": "not needed: the genotype alone leaves only apoptosis" if found is None else "done, up to two literals"})
    return {"samples": sum(pooled.values()), "studies": len(per_study), "distinct_signatures": len(pooled), "altered": sum(n for sig, n in pooled.items() if sig),
            "tp53_lost": sum(n for sig, n in pooled.items() if lost(sig)),
            "baseline": tally(pick(pooled), None), "baseline_tp53_lost": tally(pick(pooled, lost), None), "baseline_tp53_intact": tally(pick(pooled, lambda s: not lost(s)), None),
            "sets": sets, "per_study": studies, "top_signatures": top}


def run(workers: int = 6) -> dict:
    table = json.loads(SIGNATURES.read_text(encoding="utf-8"))
    rules = _rules()
    evaluator = Evaluator(rules)
    # the genotype-specific search for the most frequent signatures of each rule (skipped where the genotype alone already leaves only apoptosis)
    wanted: set[Signature] = set()
    for rule in ("r1", "r2"):
        pooled = sum((decode(block[rule]) for block in table["studies"].values()), Counter())
        for sig, _ in sorted(((s, n) for s, n in pooled.items() if s), key=lambda kv: (-kv[1], kv[0]))[:TOP]:
            if outcome(evaluator.fates(dict(sig))) != "only_apoptosis":
                wanted.add(sig)
    ordered = sorted(wanted)
    with ProcessPoolExecutor(max_workers=workers) as pool:
        specific = dict(zip(ordered, pool.map(_search, ordered)))
    result = {"protocol": "docs/genotype_protocol.md", "model": MODEL, "source": table["source"], "rule": table["rule"], "nodes": table["nodes"],
              "solver_sets": [describe(s) for s in evaluator.sets], **{rule: aggregate(table, rule, evaluator, specific) for rule in ("r1", "r2")}}
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    RESULTS.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    return result
