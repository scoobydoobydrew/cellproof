"""May this paper go in?

The audit keeps its own source papers out of everything the loop reads (CLAUDE.md section 5): a paper whose outcomes are
scored must never also be a paper the model learns mechanisms from. So a dropped PDF is compared with the audit's sources
(by DOI, PubMed Central id, or author, year and journal), refused if it is one of them, and also not read twice: if it is
already in the open-access corpus, or was dropped before, the existing result is shown instead.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from cellproof.ingest.pdf import DOI, PdfText

PMCID = re.compile(r"\bPMC\d{5,9}\b")
CITE = re.compile(r"^(?P<surname>[A-Za-z'\-]+)\s.*?\.\s+(?P<journal>[A-Za-z][A-Za-z .&]+?)\s+(?P<year>(?:19|20)\d{2})\b")
HEAD = 6000  # the first page holds the title, the authors, the journal and usually the DOI


@dataclass(frozen=True)
class Verdict:
    kind: str  # ok | heldout | corpus | duplicate
    reason: str = ""
    paper: str | None = None  # the id it matched

    @property
    def ok(self) -> bool:
        return self.kind == "ok"


def _fold(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def _dois(text: str) -> set[str]:
    return {m.group(1).rstrip(".,;:)").lower() for m in DOI.finditer(text)}


def _cite_matches(cite: str, head: str) -> bool:
    """Author, year and the journal's words all appear in the first page. A DOI is the better signal; this one catches a PDF whose
    first page carries no DOI, and is strict enough not to refuse a paper that only shares a surname or a year."""
    match = CITE.match(cite)
    if not match:
        return False
    folded = _fold(head)
    words = [w for w in _fold(match["journal"]).split() if len(w) >= 3]
    hits = sum(1 for w in words if w in folded.split())
    return _fold(match["surname"]) in folded and match["year"] in folded and bool(words) and hits >= max(1, (len(words) + 1) // 2)


def check_paper(pdf: PdfText, filename: str, *, heldout_sources: dict[str, dict], corpus: list[dict], existing: list[dict]) -> Verdict:
    head = f"{pdf.text[:HEAD]}\n{filename}"
    dois = _dois(head) | ({pdf.doi} if pdf.doi else set())
    pmcids = set(PMCID.findall(head))
    for key, source in heldout_sources.items():
        if (source.get("doi") and source["doi"].lower() in dois) or (source.get("pmcid") and source["pmcid"] in pmcids) or _cite_matches(source.get("cite", ""), head):
            return Verdict(
                "heldout",
                f"This paper ({source.get('cite', key)}) is one of the sources of the audit. The audit scores outcomes that the model has never read, "
                "so it cannot also be a paper the model reads: it is not added.", key,
            )
    title = _fold(pdf.title)
    first = _fold(head)
    for paper in corpus:
        same_title = len(paper.get("title", "")) >= 30 and _fold(paper["title"]) in first
        if (paper.get("doi") and paper["doi"].lower() in dois) or paper["pmcid"] in pmcids or same_title or (len(title) >= 30 and title == _fold(paper.get("title", ""))):
            return Verdict("corpus", f"The AI has already read this paper on its own ({paper['pmcid']}): see it in the list of papers it found.", paper["pmcid"])
    for record in existing:
        if (record.get("doi") and record["doi"] in dois) or (len(title) >= 30 and title == _fold(record.get("title", ""))):
            return Verdict("duplicate", "A PDF of this paper was dropped before: its result is shown.", record["id"])
    return Verdict("ok")
