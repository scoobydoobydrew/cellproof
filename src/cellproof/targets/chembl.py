"""Measured chemistry for a gene's protein, from ChEMBL (open data, CC BY-SA 3.0; see THIRD_PARTY.md). Nothing is predicted: every
compound listed has a measured activity against the human protein, with its assay and the publication it came from.

Two things are counted that a model trained on such data would trip over, and are reported, never filtered silently:
  * an assay whose description mentions *phosphorylation* is a readout of activity in cells (for RB1, of its own phosphorylation),
    which does not say that the compound binds the protein ChEMBL files the activity under;
  * potency is the pChEMBL value, minus the log10 of the molar IC50, Ki, Kd or EC50 (6 means 1 micromolar or better).
"""
from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Callable

BASE = "https://www.ebi.ac.uk/chembl/api/data"
ONLY = ("molecule_chembl_id,molecule_pref_name,standard_type,standard_relation,standard_value,standard_units,pchembl_value,"
        "assay_chembl_id,assay_type,assay_description,document_chembl_id,data_validity_comment")
PAGE = 1000
PHOSPHORYLATION = re.compile(r"\bphosphorylation\b", re.IGNORECASE)  # "Inhibition of RB1 phosphorylation in human MCF7 cells ..."
TOP = 5
CACHE = Path(__file__).resolve().parents[3] / "data" / "raw" / "chembl"  # git-ignored: raw responses, so that a rerun is cheap


def get(path: str, **params) -> dict:
    url = f"{BASE}/{path}.json?" + urllib.parse.urlencode(params)
    cached = CACHE / (hashlib.sha1(url.encode("utf-8")).hexdigest() + ".json")
    if path != "status" and cached.exists():  # the release number is always asked afresh
        return json.loads(cached.read_text(encoding="utf-8"))
    request = urllib.request.Request(url, headers={"User-Agent": "cellproof-hackathon/0.1", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = json.load(response)
            if path != "status":
                CACHE.mkdir(parents=True, exist_ok=True)
                cached.write_text(json.dumps(data), encoding="utf-8")
            return data
        except urllib.error.URLError:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))
    raise AssertionError("unreachable")


def release(fetch: Callable[..., dict] = get) -> str:
    return fetch("status")["chembl_db_version"]


def human_target(accession: str, fetch: Callable[..., dict] = get) -> dict | None:
    """The human single-protein target of a UniProt accession, or None."""
    targets = fetch("target", target_components__accession=accession, target_type="SINGLE PROTEIN", organism="Homo sapiens", limit=5)["targets"]
    return {k: targets[0][k] for k in ("target_chembl_id", "pref_name", "organism", "target_type")} if targets else None


def activities(target_chembl_id: str, min_pchembl: float, fetch: Callable[..., dict] = get) -> list[dict]:
    """Every activity record of the target with a pChEMBL value of at least `min_pchembl`, paged."""
    out: list[dict] = []
    while True:
        page = fetch("activity", target_chembl_id=target_chembl_id, pchembl_value__gte=min_pchembl, limit=PAGE, offset=len(out), only=ONLY)
        out += page["activities"]
        if len(out) >= page["page_meta"]["total_count"] or not page["activities"]:
            return out


def count(target_chembl_id: str, fetch: Callable[..., dict] = get, **filters) -> int:
    return fetch("activity", target_chembl_id=target_chembl_id, limit=1, **filters)["page_meta"]["total_count"]


def top_compounds(records: list[dict]) -> list[dict]:
    """The TOP most potent compounds among `records` (one record per compound, its best), with their assays and publications."""
    best: dict[str, dict] = {}
    for record in records:
        key = record["molecule_chembl_id"]
        if key not in best or float(record["pchembl_value"]) > float(best[key]["pchembl_value"]):
            best[key] = record
    ranked = sorted(best.values(), key=lambda r: -float(r["pchembl_value"]))
    return [{
        "compound": r["molecule_chembl_id"], "name": r["molecule_pref_name"], "measure": r["standard_type"], "relation": r["standard_relation"],
        "value": r["standard_value"], "units": r["standard_units"], "pchembl": float(r["pchembl_value"]), "assay": r["assay_chembl_id"],
        "assay_type": r["assay_type"], "assay_description": r["assay_description"], "document": r["document_chembl_id"],
        "mentions_phosphorylation": bool(PHOSPHORYLATION.search(r["assay_description"] or "")), "validity_comment": r["data_validity_comment"],
    } for r in ranked[:TOP]]


def dossier(accession: str, fetch: Callable[..., dict] = get) -> dict:
    """What ChEMBL holds on one protein: its target entry, how many activity records reach each potency, the distinct compounds at 1
    micromolar or better (all of those records are read), and the most potent compounds at any potency."""
    target = human_target(accession, fetch)
    if target is None:
        return {"uniprot": accession, "chembl_target": None}
    tid = target["target_chembl_id"]
    records = {"all": count(tid, fetch), **{f"pchembl_{level}_or_more": count(tid, fetch, pchembl_value__gte=level) for level in (4, 5, 6)}}
    strong = activities(tid, 6, fetch) if records["pchembl_6_or_more"] else []
    top = fetch("activity", target_chembl_id=tid, pchembl_value__isnull="false", order_by="-pchembl_value", limit=5 * TOP, only=ONLY)["activities"]
    return {"uniprot": accession, "chembl_target": target, "records": records,
            "at_1_micromolar_or_better": {
                "compounds": len({r["molecule_chembl_id"] for r in strong}),
                "assay_types": dict(Counter(r["assay_type"] for r in strong)),
                "records_mentioning_phosphorylation": sum(bool(PHOSPHORYLATION.search(r["assay_description"] or "")) for r in strong)},
            "most_potent": top_compounds(top)}
