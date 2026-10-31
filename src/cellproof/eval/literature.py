"""A literature check of two of the solver's answers: does losing PTEN, or losing RB1, agree with what open-access papers report?

The model says that after DNA damage a cell without PTEN (or without RB) has apoptosis as its only stable end state. Papers
rarely speak in end states; they report apoptosis, cell death, survival or radiosensitivity. So the comparison is of direction
only, and it can contradict the model but never confirm its finer claim ("only apoptosis").

Protocol, fixed on 2026-10-31 before any paper was read (docs/literature_check.md has the same text):
  1. Search Europe PMC, open access, Creative Commons licence, not a review, not retracted, not one of the held-out source papers,
     in Europe PMC's citation order, with the two queries below (the gene in the title; radiation and loss of the gene in the abstract).
  2. Take the first FIRST_WAVE papers per gene that meet those conditions (the first wave). Nothing else decides which papers are read.
     Amendment 1, written after the first wave was read and committed before the second was downloaded: the next papers, up to
     PER_GENE per gene, by the same rule (the second wave). Both waves are reported next to each other.
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
FIRST_WAVE = 6  # the papers the protocol took before anything was read
PER_GENE = 12  # with the second wave of Amendment 1: ranks 7 to 12 of the same lists
VERDICTS = ("agrees_in_direction", "contradicts", "mixed", "off_topic")
# How the gene was varied in an on-topic paper (docs/literature_check.md): changed in the same cells, cell lines or tumours compared, or indirect.
DESIGNS = ("changed", "compared", "indirect")

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
    """For each gene, every hit of the first page in Europe PMC's citation order, with its rank among the papers that qualify (a PMC id, a
    Creative Commons licence, not a held-out source) and the wave in which the protocol takes it: 1 for ranks 1 to FIRST_WAVE, 2 for the
    next ones up to PER_GENE (Amendment 1), 0 for a paper that is not taken."""
    excluded = held_out_sources() if excluded is None else excluded
    out: dict[str, list[dict]] = {}
    for gene, query in QUERIES.items():
        rank, rows = 0, []
        for record in search(query, fetch=fetch):
            pmcid, licence = record.get("pmcid"), (record.get("license") or "").lower()
            qualifies = bool(pmcid) and pmcid not in excluded and licence.startswith("cc")
            rank += qualifies
            wave = (1 if rank <= FIRST_WAVE else 2 if rank <= PER_GENE else 0) if qualifies else 0
            rows.append({"pmcid": pmcid, "doi": record.get("doi"), "title": (record.get("title") or "").rstrip("."), "year": record.get("pubYear"),
                         "cited_by": record.get("citedByCount"), "license": licence or None, "rank": rank if qualifies else None, "wave": wave, "taken": bool(wave)})
        out[gene] = rows
    return out


def run(fetch: Callable[[str], bytes] = _get) -> dict:
    """Search, save the list of candidates (committed) and download the texts of the papers the protocol takes (git-ignored)."""
    found = candidates(fetch)
    CANDIDATES.parent.mkdir(parents=True, exist_ok=True)
    CANDIDATES.write_text(json.dumps({"queries": QUERIES, "first_wave": FIRST_WAVE, "per_gene": PER_GENE, "candidates": found}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    taken = [{"pmcid": r["pmcid"]} for rows in found.values() for r in rows if r["taken"]]
    download(taken, TEXTS, fetch=fetch)
    return found


def problems(evidence: dict, texts: Path = TEXTS, taken: set[str] | None = None) -> list[str]:
    """What is wrong with the evidence file: a verdict, wave or design outside the lists, a paper the protocol did not take, a quote that is
    not in the paper (checked only where the text is on this machine), or a verdict that its own quotes do not allow (an on-topic paper
    without a quote)."""
    found: list[str] = []
    for gene, block in evidence["genes"].items():
        for paper in block["papers"]:
            name = f"{gene} {paper['pmcid']}"
            if paper["verdict"] not in VERDICTS:
                found.append(f"{name}: unknown verdict {paper['verdict']!r}")
            if paper.get("wave") not in (1, 2):
                found.append(f"{name}: unknown wave {paper.get('wave')!r}")
            if taken is not None and paper["pmcid"] not in taken:
                found.append(f"{name}: not taken by the protocol")
            if paper["verdict"] == "off_topic":
                if not paper.get("note"):
                    found.append(f"{name}: an off-topic paper needs its reason")
                if paper.get("design"):
                    found.append(f"{name}: an off-topic paper has no design")
                continue
            if paper.get("design") not in DESIGNS:
                found.append(f"{name}: unknown design {paper.get('design')!r}")
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
