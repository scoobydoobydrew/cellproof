"""A PDF the user holds -> the plain text that the extraction reads.

The text is cleaned the way a person would read it: ligatures and soft hyphens folded, words split at the end of a line
joined again, page headers and footers that repeat on most pages dropped, and the reference list cut off (a paper's
mechanisms are in its own text, and a reference list would only add names). Nothing is interpreted. A PDF without a text
layer (a scan) or with a password is refused with the reason, not guessed at.
"""
from __future__ import annotations

import io
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from pypdf import PdfReader

MAX_PAGES = 100  # a reasonable size for one paper; longer files are read to this page and say so
MIN_CHARS = 2000  # shorter than this is a cover page or a scan, not a paper

DOI = re.compile(r"\b(10\.\d{4,9}/[^\s\"<>\[\]{}|\\^`]+)", re.IGNORECASE)
REFERENCES = re.compile(r"^\s*(references|reference list|bibliography|literature cited|works cited)\s*:?\s*$", re.IGNORECASE)
PAGE_NUMBER = re.compile(r"^\s*(page\s+)?\d{1,4}(\s+(of|/)\s+\d{1,4})?\s*$", re.IGNORECASE)
GENERIC_TITLES = ("untitled", "microsoft word", "pdf", "document", "manuscript", "layout", "proof")


class PdfError(ValueError):
    """The file cannot be turned into text; the message says why, for the person who dropped it."""


@dataclass(frozen=True)
class PdfText:
    text: str
    pages: int
    chars: int
    words: int
    doi: str | None
    title: str
    warnings: list[str] = field(default_factory=list)


def _fold(page: str) -> str:
    page = unicodedata.normalize("NFKC", page).replace("\xad", "").replace(" ", " ")
    return "".join(ch for ch in page if ch == "\n" or ch == "\t" or unicodedata.category(ch)[0] != "C")


def _repeated(pages: list[list[str]]) -> set[str]:
    """Lines that open or close most pages (a journal name, an author line, a copyright line): not part of the paper."""
    if len(pages) < 3:
        return set()
    seen: Counter = Counter()
    for lines in pages:
        edge = {line.strip() for line in lines[:3] + lines[-3:] if 3 < len(line.strip()) <= 140}
        seen.update(edge)
    need = max(3, int(0.5 * len(pages)))
    return {line for line, n in seen.items() if n >= need}


def clean(pages: list[str]) -> tuple[str, list[str]]:
    """The text of the pages as one reading text, and what was done to it that the reader should know."""
    notes: list[str] = []
    folded = [_fold(p) for p in pages]
    lines_by_page = [p.split("\n") for p in folded]
    repeated = _repeated(lines_by_page)
    if repeated:
        notes.append(f"{len(repeated)} repeated header or footer lines dropped")
    kept_pages = []
    for lines in lines_by_page:
        kept = [line for line in lines if line.strip() not in repeated and not PAGE_NUMBER.match(line)]
        kept_pages.append("\n".join(kept))
    text = "\n\n".join(kept_pages)
    text = re.sub(r"(?<=[a-z])-\n(?=[a-z])", "", text)  # "phos-\nphorylation": one word that was split at the end of a line
    text = re.sub(r"-\n(?=\S)", "-", text)  # "p53-\nMDM2": a real hyphen, only the line break goes
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    lines = text.split("\n")
    marks = [i for i, line in enumerate(lines) if REFERENCES.match(line)]
    cut = next((i for i in reversed(marks) if sum(len(x) for x in lines[:i]) > 0.45 * len(text)), None)
    if cut is not None:
        text = "\n".join(lines[:cut]).strip()
        notes.append("the reference list was cut off")
    return text, notes


def _doi_of(head: str, meta_values: list[str]) -> str | None:
    for source in (*meta_values, head):
        match = DOI.search(source or "")
        if match:
            return match.group(1).rstrip(".,;:)").lower()
    return None


def _title_of(meta_title: str | None, head: str, filename: str) -> str:
    title = " ".join((meta_title or "").split())
    if len(title) >= 15 and not any(g in title.lower() for g in GENERIC_TITLES):
        return title[:220]
    for line in head.split("\n")[:30]:
        line = " ".join(line.split())
        if 30 <= len(line) <= 220 and sum(c.isdigit() for c in line) < 6 and not line.isupper() and "http" not in line.lower():
            return line
    return Path(filename).stem[:120] or "untitled"


def read_pdf(data: bytes, filename: str = "paper.pdf") -> PdfText:
    if not data.startswith(b"%PDF-"):
        raise PdfError("this is not a PDF file")
    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        if reader.is_encrypted and not reader.decrypt(""):
            raise PdfError("the PDF is password-protected: open it, save it as a new PDF, and drop that")
        total = len(reader.pages)
    except PdfError:
        raise
    except Exception as error:  # pypdf raises many kinds; a person needs one sentence
        name = type(error).__name__
        if "Dependency" in name:
            raise PdfError("the PDF is encrypted in a way that needs an extra library: open it, print it to a new PDF, and drop that") from error
        raise PdfError(f"the PDF cannot be read ({name})") from error
    notes: list[str] = []
    pages: list[str] = []
    for number, page in enumerate(reader.pages[:MAX_PAGES], start=1):
        try:
            pages.append(page.extract_text() or "")
        except Exception:  # one broken page should not lose the paper
            pages.append("")
            notes.append(f"page {number} could not be read")
    if total > MAX_PAGES:
        notes.append(f"only the first {MAX_PAGES} of {total} pages were read")
    text, cleaned = clean(pages)
    notes += cleaned
    if len(text) < MIN_CHARS:
        raise PdfError("the PDF has almost no text (a scan?): only PDFs with a text layer can be read")
    meta = reader.metadata
    meta_values = [str(getattr(meta, key, "") or "") for key in ("subject", "title")] if meta else []
    head = text[:6000]
    return PdfText(
        text=text, pages=min(total, MAX_PAGES), chars=len(text), words=len(text.split()),
        doi=_doi_of(head, meta_values), title=_title_of(getattr(meta, "title", None) if meta else None, head, filename), warnings=notes,
    )
