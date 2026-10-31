"""A small client for the public cBioPortal API (https://www.cbioportal.org/api) with an on-disk cache.

Every response is saved under data/raw/cbioportal (git-ignored, like every downloaded source) keyed by a hash of the request, so a
second run, and `CELLPROOF_OFFLINE=1`, never touch the network. Only reads; the calls need no key. Data licence: ODC Open Database
License with attribution to the original studies (cBioPortal FAQ, read 2026-10-31).
"""
from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = "https://www.cbioportal.org/api"
CACHE = ROOT / "data" / "raw" / "cbioportal"
USER_AGENT = "cellproof-hackathon/0.1 (research prototype)"
ATLAS_SUFFIX = "_tcga_pan_can_atlas_2018"


def call(method: str, path: str, body: object | None = None) -> object:
    """One request, cached. A cache miss while CELLPROOF_OFFLINE=1 is an error, never a silent empty answer."""
    key = hashlib.sha256(json.dumps([method, path, body], sort_keys=True).encode()).hexdigest()
    file = CACHE / f"{key}.json"
    if file.exists():
        return json.loads(file.read_text(encoding="utf-8"))
    if os.environ.get("CELLPROOF_OFFLINE") == "1":
        raise RuntimeError(f"offline and not cached: {method} {path}")
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(BASE + path, data=data, method=method,
                                     headers={"Accept": "application/json", "Content-Type": "application/json", "User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=600) as response:
        result = json.load(response)
    CACHE.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(result), encoding="utf-8")
    time.sleep(0.2)
    return result


def atlas_studies() -> list[str]:
    """The ids of the TCGA PanCancer Atlas studies, sorted."""
    found = call("GET", "/studies?" + urllib.parse.urlencode({"keyword": "pan_can_atlas", "projection": "SUMMARY"}))
    return sorted(s["studyId"] for s in found if s["studyId"].endswith(ATLAS_SUFFIX))


def entrez_ids(symbols: list[str]) -> dict[str, int]:
    genes = call("POST", "/genes/fetch?geneIdType=HUGO_GENE_SYMBOL&projection=SUMMARY", sorted(symbols))
    found = {g["hugoGeneSymbol"]: int(g["entrezGeneId"]) for g in genes}
    missing = set(symbols) - set(found)
    if missing:
        raise LookupError(f"cBioPortal does not know the gene symbols {sorted(missing)}")
    return found


def sample_ids(sample_list: str) -> list[str]:
    return call("GET", f"/sample-lists/{sample_list}/sample-ids")


def mutations(study: str, genes: list[int]) -> list[dict]:
    return call("POST", f"/molecular-profiles/{study}_mutations/mutations/fetch?projection=SUMMARY", {"entrezGeneIds": genes, "sampleListId": f"{study}_all"})


def copy_number(study: str, genes: list[int]) -> list[dict]:
    """Only the extreme calls: homozygous deletions (-2) and high-level amplifications (2) of the study's GISTIC profile."""
    return call("POST", f"/molecular-profiles/{study}_gistic/discrete-copy-number/fetch?discreteCopyNumberEventType=HOMDEL_AND_AMP&projection=SUMMARY",
                {"entrezGeneIds": genes, "sampleListId": f"{study}_all"})
