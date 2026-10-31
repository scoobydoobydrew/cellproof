"""A literature check of two of the solver's answers: does losing PTEN, or losing RB1, agree with what open-access papers report?

The model says that after DNA damage a cell without PTEN (or without RB) has apoptosis as its only stable end state. Papers
rarely speak in end states; they report apoptosis, cell death, survival or radiosensitivity. So the comparison is of direction
only, and it can contradict the model but never confirm its finer claim ("only apoptosis").

Protocol, fixed on 2026-10-31 before any paper was read (docs/literature_check.md has the same text):
  1. Search Europe PMC, open access, Creative Commons licence, not a review, not retracted, not one of the held-out source papers,
     in Europe PMC's citation order, with the two queries below (the gene in the title; radiation and loss of the gene in the abstract).
  2. Take the first PER_GENE papers per gene that meet those conditions. Nothing else decides which papers are read.
  3. For each paper, decide whether it reports what loss or inhibition of the gene does to the response of cells to radiation or to
     DNA damage (apoptosis, cell death, survival, sensitivity). If not, it is `off_topic` and the reason is written down; it is not
     replaced, so that the choice of papers cannot depend on what they say.
  4. For each on-topic paper keep up to two verbatim sentences (code checks that they occur in the paper) and one verdict:
     `agrees_in_direction` (loss gives more apoptosis, more cell death or more radiosensitivity), `contradicts` (less apoptosis, more
     survival, radioresistance) or `mixed` (depends on the context, or no effect, or both).
  5. Report counts and quotes. No percentage and no majority vote.
The papers were read by the assistant, not by a person; the quotes can be checked by anyone in a minute.
"""
from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path

from cellproof.corpus.europepmc import _get, download, search
from cellproof.extract.claims import normalize

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = ROOT / "data" / "literature" / "pten_rb_evidence.json"
CANDIDATES = ROOT / "data" / "literature" / "pten_rb_candidates.json"
TEXTS = ROOT / "data" / "raw" / "literature"  # git-ignored, like every paper text
PER_GENE = 6
VERDICTS = ("agrees_in_direction", "contradicts", "mixed", "off_topic")

RADIATION = "(radiation OR irradiation OR irradiated OR radiosensiti* OR radioresistan* OR radiotherapy)"
NOT_THESE = 'NOT (PUB_TYPE:"review" OR PUB_TYPE:"Review" OR TITLE:Retracted OR TITLE:Correction OR TITLE:Erratum OR TITLE:Retraction)'
QUERIES = {
    "PTEN": f"TITLE:PTEN AND ABSTRACT:{RADIATION} AND ABSTRACT:(loss OR deficien* OR null OR knockdown OR silencing OR mutation OR inhibit* OR deletion OR knockout) AND OPEN_ACCESS:y {NOT_THESE}",
    "RB1": f"TITLE:(RB1 OR retinoblastoma OR pRB) AND ABSTRACT:{RADIATION} AND ABSTRACT:(loss OR deficien* OR null OR knockdown OR silencing OR inactivation OR deletion OR knockout) AND OPEN_ACCESS:y {NOT_THESE}",
}


def held_out_sources() -> set[str]:
    doc = json.loads((ROOT / "data" / "heldout" / "gupta2023_heldout.json").read_text(encoding="utf-8"))
    return {s["pmcid"] for s in doc["sources"].values()}


def candidates(fetch: Callable[[str], bytes] = _get, excluded: set[str] | None = None) -> dict[str, list[dict]]:
    """For each gene, every hit of the first page in Europe PMC's citation order, with whether the protocol takes it."""
    excluded = held_out_sources() if excluded is None else excluded
    out: dict[str, list[dict]] = {}
    for gene, query in QUERIES.items():
        taken, rows = 0, []
        for record in search(query, fetch=fetch):
            pmcid, licence = record.get("pmcid"), (record.get("license") or "").lower()
            ok = bool(pmcid) and pmcid not in excluded and licence.startswith("cc") and taken < PER_GENE
            taken += ok
            rows.append({"pmcid": pmcid, "doi": record.get("doi"), "title": (record.get("title") or "").rstrip("."), "year": record.get("pubYear"),
                         "cited_by": record.get("citedByCount"), "license": licence or None, "taken": ok})
        out[gene] = rows
    return out


def run(fetch: Callable[[str], bytes] = _get) -> dict:
    """Search, save the list of candidates (committed) and download the texts of the papers the protocol takes (git-ignored)."""
    found = candidates(fetch)
    CANDIDATES.parent.mkdir(parents=True, exist_ok=True)
    CANDIDATES.write_text(json.dumps({"queries": QUERIES, "per_gene": PER_GENE, "candidates": found}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    taken = [{"pmcid": r["pmcid"]} for rows in found.values() for r in rows if r["taken"]]
    download(taken, TEXTS, fetch=fetch)
    return found


def problems(evidence: dict, texts: Path = TEXTS, taken: set[str] | None = None) -> list[str]:
    """What is wrong with the evidence file: a verdict outside the list, a paper the protocol did not take, a quote that is not in the paper
    (checked only where the text is on this machine), or a verdict that its own quotes do not allow (an on-topic paper without a quote)."""
    found: list[str] = []
    for gene, block in evidence["genes"].items():
        for paper in block["papers"]:
            name = f"{gene} {paper['pmcid']}"
            if paper["verdict"] not in VERDICTS:
                found.append(f"{name}: unknown verdict {paper['verdict']!r}")
            if taken is not None and paper["pmcid"] not in taken:
                found.append(f"{name}: not taken by the protocol")
            if paper["verdict"] == "off_topic":
                if not paper.get("note"):
                    found.append(f"{name}: an off-topic paper needs its reason")
                continue
            if not paper["quotes"]:
                found.append(f"{name}: an on-topic paper needs a quote")
            text_path = texts / f"{paper['pmcid']}.txt"
            if text_path.exists():
                text = normalize(text_path.read_text(encoding="utf-8"))
                for quote in paper["quotes"]:
                    if len(quote["text"].split()) > 40:
                        found.append(f"{name}: a quote of more than 40 words")
                    if normalize(quote["text"]) not in text:
                        found.append(f"{name}: quote not found in the paper: {quote['text'][:60]}")
    return found
