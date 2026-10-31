"""From a tumour sample's alterations to a signature of forced nodes (docs/genotype_protocol.md: the rule is fixed there, before any outcome).

A node of the model can carry a genotype only if it stands for one protein-coding gene. A homozygous deletion or a truncating mutation
forces it to 0, a high-level amplification forces it to 1 (a loss wins over a gain), and everything else is ignored. R2 is a stated
bound for TP53: every protein-changing TP53 mutation counts as a loss. Only counts of signatures are stored, never a sample or a patient.
"""
from __future__ import annotations

import datetime
import json
from collections import Counter, defaultdict
from pathlib import Path

from cellproof.formalize.entities import NEW_NODE_IDS, NODE_GENES
from cellproof.genotype import cbioportal
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[3]
SIGNATURES = ROOT / "data" / "genotypes" / "tcga_pancan_signatures.json"
MODEL = "data/models/repaired_min2.bnet"
TRUNCATING = frozenset({"Nonsense_Mutation", "Frame_Shift_Del", "Frame_Shift_Ins", "Splice_Site", "Nonstop_Mutation"})
NOT_PROTEIN_CHANGING = frozenset({"Silent", "Splice_Region", "3'UTR", "5'UTR", "Intron", "RNA", "3'Flank", "5'Flank", "IGR"})
ADDED_NODES = {"ATR": "ATR"}  # an added node whose id is its gene symbol (the other added nodes are in NEW_NODE_IDS)
TP53_NODE = "p53"

Signature = tuple[tuple[str, int], ...]


def mapped_nodes(rules: dict[str, str]) -> dict[str, str]:
    """node -> HGNC symbol for the nodes that can carry a genotype: exactly one gene, and by the model's own annotation neither a complex
    nor a non-coding RNA."""
    annotations = json.loads((ROOT / "data" / "base" / "gupta2023_annotations.json").read_text(encoding="utf-8"))["nodes"]
    added = {node: symbol for symbol, node in NEW_NODE_IDS.items()} | ADDED_NODES
    out = {}
    for node in rules:
        symbols = NODE_GENES.get(node) or ((added[node],) if node in added else ())
        text = annotations.get(node, "").lower()
        if len(symbols) == 1 and "complex" not in text and not text.startswith(("long non-coding rna", "microrna")):
            out[node] = symbols[0]
    return out


def signature(forced: dict[str, int]) -> Signature:
    return tuple(sorted(forced.items()))


def sample_signatures(samples: set[str], nodes: dict[str, str], entrez: dict[str, int], mutation_rows: list[dict], cna_rows: list[dict]) -> tuple[Counter, Counter, Counter]:
    """(R1 signatures, R2 signatures, mutation types seen in the mapped genes), counted over `samples` (those with no alteration count as the empty signature)."""
    node_of = {entrez[symbol]: node for node, symbol in nodes.items()}
    loss: dict[str, set[str]] = defaultdict(set)
    gain: dict[str, set[str]] = defaultdict(set)
    broad_tp53: set[str] = set()
    types: Counter = Counter()
    for m in mutation_rows:
        sample, gene, kind = m["sampleId"], int(m["entrezGeneId"]), m["mutationType"]
        if sample not in samples or gene not in node_of:
            continue
        types[kind] += 1
        if kind in TRUNCATING:
            loss[sample].add(node_of[gene])
        if node_of[gene] == TP53_NODE and kind not in NOT_PROTEIN_CHANGING:
            broad_tp53.add(sample)
    for c in cna_rows:
        sample, gene = c["sampleId"], int(c["entrezGeneId"])
        if sample not in samples or gene not in node_of:
            continue
        if c["alteration"] == -2:
            loss[sample].add(node_of[gene])
        elif c["alteration"] == 2:
            gain[sample].add(node_of[gene])
    r1: Counter = Counter()
    r2: Counter = Counter()
    for sample in sorted(samples):
        forced = {node: 0 for node in loss[sample]} | {node: 1 for node in gain[sample] - loss[sample]}
        r1[signature(forced)] += 1
        r2[signature(forced | ({TP53_NODE: 0} if sample in broad_tp53 else {}))] += 1
    return r1, r2, types


def encode(counts: Counter) -> list:
    """[[signature, count], ...] by decreasing count, then by signature: JSON for the committed table."""
    return [[[list(pair) for pair in sig], n] for sig, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]


def decode(rows: list) -> Counter:
    return Counter({tuple((node, int(value)) for node, value in sig): n for sig, n in rows})


def build(studies: list[str] | None = None) -> dict:
    """Fetch (or read from the cache) the mutations and copy-number calls of every atlas study and write the table of signature counts."""
    rules = load_bnet(ROOT / MODEL)
    nodes = mapped_nodes(rules)
    entrez = cbioportal.entrez_ids(sorted(set(nodes.values())))
    genes = sorted(entrez.values())
    out = {"source": {"api": cbioportal.BASE, "profiles": "<study>_mutations and <study>_gistic", "sample_list": "<study>_cnaseq", "queried": datetime.date.today().isoformat(),
                      "licence": "ODC Open Database License, attribution to the original studies (cBioPortal FAQ, read 2026-10-31)",
                      "cite": ["Cerami et al. 2012 Cancer Discov", "Gao et al. 2013 Sci Signal", "de Bruijn et al. 2023 Cancer Res", "TCGA PanCancer Atlas (Hoadley et al. 2018 Cell)"]},
           "rule": {"truncating": sorted(TRUNCATING), "not_protein_changing": sorted(NOT_PROTEIN_CHANGING), "loss": "homozygous deletion (GISTIC -2) or a truncating mutation",
                    "gain": "high-level amplification (GISTIC +2), if there is no loss", "r2": "every protein-changing TP53 mutation also counts as a TP53 loss"},
           "nodes": nodes, "genes": entrez, "studies": {}}
    for study in studies or cbioportal.atlas_studies():
        samples = set(cbioportal.sample_ids(f"{study}_cnaseq"))
        r1, r2, types = sample_signatures(samples, nodes, entrez, cbioportal.mutations(study, genes), cbioportal.copy_number(study, genes))
        out["studies"][study] = {"samples": len(samples), "r1": encode(r1), "r2": encode(r2), "mutation_types": dict(sorted(types.items()))}
    SIGNATURES.parent.mkdir(parents=True, exist_ok=True)
    SIGNATURES.write_text(json.dumps(out, indent=None, separators=(",", ":")) + "\n", encoding="utf-8")
    return out
