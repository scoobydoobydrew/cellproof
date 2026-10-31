"""Measured chemistry for two lists of proteins, side by side: the proteins the exact solver would have to inhibit (the
loss-of-function targets of its minimal sets), and, as a comparison, the DNA damage response kinases the project brief names as
candidate radiosensitisation targets (ATR, CHK1, CHK2, WEE1, DNA-PK). For each protein: what the checked model says when it is
knocked out alone, and what ChEMBL holds. The result is a snapshot (results/compounds.json): it needs the network to be made
and nothing to be read.
"""
from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Callable

from cellproof.analysis.interventions import fates
from cellproof.network.bnet import load_bnet
from cellproof.targets import chembl
from cellproof.targets.table import ROOT, gene, target_table

BRIEF = {"ATR": "ATR", "CHEK1": "CHK1", "CHEK2": "CHK2", "WEE1": "Wee1", "PRKDC": "DNA_PK"}  # HGNC symbol -> node of the checked model
CHECKED = ROOT / "data" / "models" / "repaired_min2.bnet"


def _fates(rules: dict[str, str], node: str) -> list[str]:
    return sorted({"unclassified" if f is None else f for f in fates(rules, {node: 0})})


def build(fetch: Callable[..., dict] = chembl.get) -> dict:
    rules = load_bnet(CHECKED)
    wanted: dict[str, dict] = {}  # symbol -> why and which node
    for row in target_table()["rows"]:
        for literal in row["literals"]:
            if literal["action"] == "knock_out" and literal["kind"] == "protein":
                for g in literal["genes"]:
                    entry = wanted.setdefault(g["symbol"], {"node": literal["node"], "why": "the solver would have to inhibit it", "sets": []})
                    entry["sets"].append(row["id"])
    for symbol, node in BRIEF.items():
        wanted.setdefault(symbol, {"node": node, "why": "named in the project brief as a candidate radiosensitisation target, not found by the solver", "sets": []})
    proteins = []
    for symbol, entry in wanted.items():
        record = gene(symbol)
        accession = (record or {}).get("uniprot_ids", [None])[0] if record else None
        knock_out = _fates(rules, entry["node"])
        print(f"{symbol}: asking ChEMBL ...", flush=True)
        proteins.append({"symbol": symbol, "name": record["name"] if record else None, "hgnc_id": record["hgnc_id"] if record else None,
                         "uniprot": accession, **entry, "knock_out_alone_leaves": knock_out, "only_apoptosis": knock_out == ["apoptosis"],
                         "chembl": chembl.dossier(accession, fetch) if accession else None})
    return {"chembl_release": chembl.release(fetch), "queried": datetime.date.today().isoformat(), "model": "data/models/repaired_min2.bnet",
            "levels": "pChEMBL 6 = 1 micromolar or better, 5 = 10 micromolar, 4 = 100 micromolar", "proteins": proteins}


def write(path: Path, fetch: Callable[..., dict] = chembl.get) -> dict:
    result = build(fetch)
    path.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return result
