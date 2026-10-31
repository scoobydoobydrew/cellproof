"""The search board: the exact solver's verdict on every change of one or two genes, for the model cell and for a few tumour profiles.

For each profile (a genotype forced onto the checked network, as in docs/genotype_protocol.md) and each of the sets the exhaustive search
visits (`candidate_sets`, the order that `report.data` indexes the kept sets by) the fates the damaged cell can still reach: only death
(D), another fate or several (O), or no stable state (N). A set that touches a gene the profile already fixes is not offered (-), the
same rule as `genotype.outcomes.minimal_sets_given`. The kept sets are the minimal ones: a set of two is kept only if neither of its
changes alone leaves only death.

The profiles are chosen by a rule fixed here: the first PROFILES signatures of rule R1 in order of how many tumour samples carry them
(results/genotypes.json) whose genotype alone does not already leave only death (those need no search; they are listed apart), plus the
model cell. The page only draws this file; `make verify` reads results/search_board.json and `cellproof board` writes it.
"""
from __future__ import annotations

import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from cellproof.analysis.interventions import READOUT_NODES, describe, fates
from cellproof.analysis.llm_search import candidate_sets
from cellproof.genotype.outcomes import outcome
from cellproof.genotype.signatures import MODEL, mapped_nodes
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[3]
RESULTS = ROOT / "results" / "search_board.json"
GENOTYPES = ROOT / "results" / "genotypes.json"
PROFILES = 5
CODE = {"only_apoptosis": "D", "other": "O", "no_stable_state": "N"}


def literal_index(genes: list[str], literal: tuple[str, int]) -> int:
    """2 * (position of the gene) + value, so that a set is one or two small integers."""
    return 2 * genes.index(literal[0]) + literal[1]


def verdicts(rules: dict[str, str], combos: list, forced: dict[str, int]) -> str:
    out = []
    for combo in combos:
        if any(node in forced for node, _ in combo):
            out.append("-")
        else:
            out.append(CODE[outcome(fates(rules, {**forced, **dict(combo)}))])
    return "".join(out)


def kept(combos: list, marks: str) -> list[int]:
    """Positions of the minimal sets that leave only death (combos are in the order of growing size)."""
    found: list[int] = []
    for i, combo in enumerate(combos):
        if marks[i] == "D" and not any(set(combos[j]) <= set(combo) for j in found):
            found.append(i)
    return found


def _job(forced: list) -> str:
    rules = load_bnet(ROOT / MODEL)
    return verdicts(rules, candidate_sets(rules, 2), {n: v for n, v in forced})


def chosen(genotypes: dict) -> tuple[list[dict], list[dict]]:
    """(profiles that need a search, signatures among the most frequent whose genotype alone already leaves only death)."""
    searched, skipped = [], []
    for top in genotypes["r1"]["top_signatures"]:
        row = {"forced": top["signature"], "samples": top["samples"]}
        if top["specific_sets"] is None:
            skipped.append(row)
        elif len(searched) < PROFILES:
            searched.append(row | {"baseline": top["baseline"]})
    return searched, skipped


def run(workers: int = 6) -> dict:
    rules = load_bnet(ROOT / MODEL)
    genotypes = json.loads(GENOTYPES.read_text(encoding="utf-8"))
    combos = candidate_sets(rules, 2)
    genes = sorted(n for n in rules if n not in READOUT_NODES)
    searched, skipped = chosen(genotypes)
    profiles = [{"forced": [], "samples": None, "baseline": "other"}, *searched]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        marks = list(pool.map(_job, [p["forced"] for p in profiles]))
    for profile, m in zip(profiles, marks):
        profile["verdicts"] = m
        profile["found"] = kept(combos, m)
        profile["found_labels"] = [describe(combos[i]) for i in profile["found"]]
    symbols = mapped_nodes(rules)
    result = {"protocol": "docs/search_board.md", "model": MODEL, "genes": genes, "symbols": {g: symbols[g] for g in genes if g in symbols},
              "combos": [[literal_index(genes, lit) for lit in combo] for combo in combos], "profiles": profiles, "no_search_needed": skipped,
              "rule": f"the first {PROFILES} signatures of rule R1 by number of samples whose genotype alone does not already leave only death"}
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    RESULTS.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    return result
