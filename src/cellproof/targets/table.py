"""The solver's answers as a list of targets: for each minimal set, which gene is switched off or on, what kind of thing the node
stands for, its official identifiers, and whether the set leaves only apoptosis in the published, the unchecked and the checked model.

What a node *is* comes from the base model's own annotation (Gupta et al. 2023, Supplementary Table S2), not from a guess:
a node it calls a non-coding RNA stays one even where HGNC lists the same gene as protein coding (TUG1 today), and the
mismatch is written next to it. Identifiers come from HGNC (cached in data/ontology/hgnc_targets.json); nothing here knows any
biology that a source file does not say.
"""
from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

from cellproof.analysis.attractors import fixed_points, perturb
from cellproof.analysis.interventions import describe, fates, minimal_sets
from cellproof.formalize.entities import NEW_NODE_IDS, NODE_GENES
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[3]
CACHE = ROOT / "data" / "ontology" / "hgnc_targets.json"
HGNC = "https://rest.genenames.org/fetch/symbol"
FIELDS = ("symbol", "name", "hgnc_id", "locus_group", "locus_type", "uniprot_ids")
MODELS = {"published": "data/base/gupta2023.bnet", "unchecked": "data/models/naive_min2.bnet", "checked": "data/models/repaired_min2.bnet"}
NEW_NODE_SYMBOLS = {node: symbol for symbol, node in NEW_NODE_IDS.items()}


def gene(symbol: str) -> dict | None:
    """HGNC's record of one approved symbol (cached; offline mode never calls the network)."""
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    if symbol not in cache:
        if os.environ.get("CELLPROOF_OFFLINE") == "1":
            return None
        request = urllib.request.Request(f"{HGNC}/{urllib.parse.quote(symbol, safe='')}", headers={"Accept": "application/json", "User-Agent": "cellproof-hackathon/0.1"})
        with urllib.request.urlopen(request, timeout=60) as response:
            docs = json.load(response)["response"]["docs"]
        cache[symbol] = {k: docs[0].get(k) for k in FIELDS} if docs else None
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
        time.sleep(0.12)
    return cache[symbol]


def node_kind(annotation: str, genes: list[dict | None]) -> tuple[str, str]:
    """(kind, note): protein, non_coding_rna, several_genes or unmapped, by the model's own annotation first."""
    text = annotation.lower()
    known = [g for g in genes if g]
    if not known:
        return "unmapped", "no HGNC record"
    if text.startswith("long non-coding rna") or text.startswith("microrna"):
        mismatch = known[0]["locus_group"] == "protein-coding gene"
        return "non_coding_rna", ("HGNC lists this gene as protein coding; the model's annotation says non-coding RNA, and the node stands for the RNA" if mismatch else "")
    if len(known) > 1:
        return "several_genes", "the node merges several genes (the model's annotation names more than one entity)"
    return ("protein", "") if known[0]["locus_group"] == "protein-coding gene" else ("non_coding_rna", "")


def target_table() -> dict:
    rules = {name: load_bnet(ROOT / path) for name, path in MODELS.items()}
    annotations = json.loads((ROOT / "data" / "base" / "gupta2023_annotations.json").read_text(encoding="utf-8"))["nodes"]
    rows = []
    for k, literals in enumerate(minimal_sets(rules["checked"], 2), 1):
        parts = []
        for node, value in literals:
            symbols = NODE_GENES.get(node) or ((NEW_NODE_SYMBOLS[node],) if node in NEW_NODE_SYMBOLS else ())
            genes = [gene(symbol) for symbol in symbols]
            kind, note = node_kind(annotations.get(node, ""), genes)
            parts.append({"node": node, "value": value, "action": "knock_out" if value == 0 else "switch_on", "annotation": annotations.get(node, ""),
                          "kind": kind, "note": note, "genes": [g for g in genes if g]})
        lost = {"p53": 0}  # a cell that has lost p53: do the answers survive it?
        left = fates(rules["checked"], {**lost, **dict(literals)})
        rows.append({"id": f"hit_{k:02d}", "label": describe(literals), "literals": parts,
                     "with_p53_lost": {"fixed_points": len(fixed_points(perturb(rules["checked"], {"DNA_damage": 1, **lost, **dict(literals)}))),
                                       "fates": sorted("unclassified" if f is None else f for f in left), "only_apoptosis": left == {"apoptosis"}},
                     "only_apoptosis_in": {name: fates(model, dict(literals)) == {"apoptosis"} for name, model in rules.items()},
                     "knock_out_only": all(p["value"] == 0 for p in parts), "all_single_proteins": all(p["kind"] == "protein" for p in parts)})
    return {"models": MODELS, "rows": rows}
