"""A dropped PDF through the same steps as the open-access corpus, and the result kept on this computer.

  read       the text of the PDF (ingest/pdf.py)
  guard      not an audit source, not read twice (ingest/guard.py)
  mechanism  Muse Spark extracts molecule-on-molecule claims; stimulus: DNA damage on molecule (extract/claims.py, the same prompts)
  ground     names -> genes (HGNC), claims -> links (formalize/)
  check      the exact solver judges every link whose two ends are in the model (formalize/augment.py, the "verified" arm: no model call)

Where things are kept: everything under data/user_papers/ (git-ignored). The PDF, the claims with their quotes, and the model's replies
(a separate cache from cache/, which is committed) stay on this computer. Only the text of the PDF is sent, to the Meta Model API
(Standard, not contributor), to be read. The numbers of the page and of `make verify` never include these papers.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import shutil
import time
from collections.abc import Callable
from pathlib import Path

from cellproof.eval.heldout import load as load_heldout
from cellproof.extract.claims import PaperResult, extract_paper
from cellproof.formalize.augment import run as run_edits
from cellproof.formalize.claims_to_edges import build_edges
from cellproof.formalize.entities import CACHE as HGNC_CACHE
from cellproof.formalize.entities import Grounder, Grounding, Hgnc
from cellproof.ingest.graph import paper_graph
from cellproof.ingest.guard import Verdict, check_paper
from cellproof.ingest.pdf import PdfText, read_pdf
from cellproof.meta_client import DEFAULT_MODEL, cost_usd
from cellproof.network.bnet import load_bnet
from cellproof.verify.checker import load_cases

ROOT = Path(__file__).resolve().parents[3]
USER_ROOT = ROOT / "data" / "user_papers"
MODEL_FILE = ROOT / "data" / "models" / "repaired_min1.bnet"  # what is known so far: the published model plus every edit the solver accepted from the corpus
HELDOUT_FILE = ROOT / "data" / "heldout" / "gupta2023_heldout.json"
MANIFEST_FILE = ROOT / "data" / "corpus" / "manifest.json"
STEPS = ("read", "guard", "mechanism", "stimulus", "ground", "check")

Progress = Callable[[str, str, dict], None]


class Refused(Exception):
    """The guard said no; `verdict` says why (and, for a paper already known, where its result is)."""

    def __init__(self, verdict: Verdict):
        super().__init__(verdict.reason)
        self.verdict = verdict


class SafeGrounder(Grounder):
    """A name that cannot be looked up (no network) stays unmapped instead of stopping the paper; nothing wrong is cached."""

    def _ground(self, name: str) -> Grounding:
        try:
            return super()._ground(name)
        except Exception as error:  # a lookup failure, not a verdict about the name
            return Grounding("unmapped", None, f"lookup failed: {type(error).__name__}")


def _user_hgnc(root: Path) -> Hgnc:
    """The committed HGNC cache is copied once, so that names the corpus used stay offline and new names are not written into a tracked file."""
    path = root / "hgnc_cache.json"
    if not path.exists() and HGNC_CACHE.exists():
        root.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(HGNC_CACHE, path)
    return Hgnc(path=path)


def paper_id(data: bytes) -> str:
    return f"USR-{hashlib.sha256(data).hexdigest()[:10]}"


def list_papers(root: Path = USER_ROOT) -> list[dict]:
    """One summary per paper, newest first; the claims and quotes are in the record, not here."""
    out = []
    for path in sorted((root / "papers").glob("*/record.json")) if (root / "papers").exists() else []:
        record = json.loads(path.read_text(encoding="utf-8"))
        out.append({**{k: record[k] for k in ("id", "title", "filename", "doi", "added", "pages", "chars", "counts", "cost_usd")}, "verdicts": record["graph"]["counts"]})
    return sorted(out, key=lambda r: r["added"], reverse=True)


def _valid(paper: str) -> bool:
    """An id this module made: USR- and ten hexadecimal characters. Anything else (a path, a dot, a slash) never reaches the disk."""
    return paper.startswith("USR-") and paper[4:].isalnum()


def load_paper(paper: str, root: Path = USER_ROOT) -> dict | None:
    path = root / "papers" / paper / "record.json"
    return json.loads(path.read_text(encoding="utf-8")) if _valid(paper) and path.exists() else None


def delete_paper(paper: str, root: Path = USER_ROOT) -> bool:
    """Removes the PDF and the record of one dropped paper. The model's replies in the cache stay (they cost money to make)."""
    folder = root / "papers" / paper
    if not (_valid(paper) and folder.is_dir()):
        return False
    shutil.rmtree(folder)
    return True


def estimate_usd(chars: int) -> float | None:
    """What reading this much text costs, from what the 36 corpus papers cost (both passes): the input alone would undercount, because most
    of the output is the model's reasoning (docs/extraction_notes.md)."""
    try:
        manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))["papers"]
        size = {p["pmcid"]: p.get("chars", 0) for p in manifest}
        spent = total = 0.0
        for folder in ("muse-spark-1.3", "muse-spark-1.3-stimulus"):
            for path in (ROOT / "data" / "extractions" / folder).glob("*.json"):
                record = json.loads(path.read_text(encoding="utf-8"))
                spent += cost_usd(record.get("usage"), record["model"])
                total += size.get(record["pmcid"], 0)
        return round(spent / total * chars, 3) if total else None
    except (OSError, KeyError, ValueError):
        return None


def plan(data: bytes, filename: str, *, root: Path = USER_ROOT) -> dict:
    """What would happen, without a model call: the text, the guard's verdict and the cost. Raises PdfError for a file that cannot be read."""
    pdf = read_pdf(data, filename)
    verdict = _guard(pdf, filename, root)
    return {
        "id": paper_id(data), "title": pdf.title, "doi": pdf.doi, "pages": pdf.pages, "chars": pdf.chars, "words": pdf.words, "warnings": pdf.warnings,
        "guard": {"kind": verdict.kind, "reason": verdict.reason, "paper": verdict.paper}, "estimate_usd": estimate_usd(pdf.chars),
    }


def _guard(pdf: PdfText, filename: str, root: Path) -> Verdict:
    sources = load_heldout(HELDOUT_FILE)["sources"] if HELDOUT_FILE.exists() else {}
    corpus = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))["papers"] if MANIFEST_FILE.exists() else []
    return check_paper(pdf, filename, heldout_sources=sources, corpus=corpus, existing=list_papers(root))


def _record_of(paper: str, title: str, result: PaperResult, model: str, kind: str) -> dict:
    return {
        "pmcid": paper, "title": title, "model": model, "kind": kind, "counts": result.counts,
        "grounded": [c.model_dump() for c in result.grounded], "ungrounded": [c.model_dump() for c in result.ungrounded],
        "outcome_level": [c.model_dump() for c in result.outcome_level],
    }


def ingest(
    data: bytes, filename: str, *, root: Path = USER_ROOT, model: str = DEFAULT_MODEL, progress: Progress | None = None, client=None,
) -> dict:
    """Reads, checks and keeps one PDF; returns its record (with the graph). The same bytes dropped twice give the same record without another call."""
    notify = progress or (lambda step, state, detail: None)
    paper = paper_id(data)
    done = load_paper(paper, root)
    if done:
        return done
    notify("read", "start", {})
    pdf = read_pdf(data, filename)
    notify("read", "done", {"pages": pdf.pages, "chars": pdf.chars, "title": pdf.title, "doi": pdf.doi, "warnings": pdf.warnings})
    notify("guard", "start", {})
    verdict = _guard(pdf, filename, root)
    if not verdict.ok:
        notify("guard", "error", {"kind": verdict.kind, "reason": verdict.reason, "paper": verdict.paper})
        raise Refused(verdict)
    notify("guard", "done", {})

    results: dict[str, PaperResult] = {}
    usage: dict[str, dict] = {}
    for kind in ("mechanism", "stimulus"):
        notify(kind, "start", {})
        started = time.monotonic()
        results[kind] = extract_paper(paper, pdf.text, model=model, kind=kind, cache_dir=root / "cache", client=client)
        llm = results[kind].llm
        usage[kind] = {"from_cache": llm.from_cache, "usd": 0.0 if llm.from_cache else round(cost_usd(llm.usage, model), 4), "usage": llm.usage}
        notify(kind, "done", {"counts": results[kind].counts, "seconds": round(time.monotonic() - started, 1), "usd": usage[kind]["usd"], "from_cache": llm.from_cache})

    notify("ground", "start", {})
    sets = {kind: [_record_of(paper, pdf.title, result, model, kind)] for kind, result in results.items()}
    hgnc = _user_hgnc(root)
    grounder = SafeGrounder(hgnc)
    edges, dropped, _names = build_edges(sets, grounder)
    claims = [{**c, "pass": kind} for kind, records in sets.items() for r in records for c in r["grounded"]]
    hgnc.save()
    notify("ground", "done", {"claims": len(claims), "links": len(edges), "dropped": dict(dropped)})

    notify("check", "start", {})
    rules = load_bnet(MODEL_FILE)
    in_model = {eid: e for eid, e in edges.items() if e.source in rules and e.target in rules}
    _final, logged = run_edits(rules, in_model, [], arm="verified", cases=load_cases(), min_papers=1)
    graph = paper_graph(claims, grounder, rules, {r["edge"]: r for r in logged})
    notify("check", "done", {"in_model": len(in_model), "counts": graph["counts"]})

    counts = {k: sum(r["counts"][k] for r in (s[0] for s in sets.values())) for k in ("proposed", "grounded", "ungrounded", "outcome_level")}
    record = {
        "id": paper, "filename": filename, "sha256": hashlib.sha256(data).hexdigest(), "title": pdf.title, "doi": pdf.doi, "pages": pdf.pages,
        "chars": pdf.chars, "warnings": pdf.warnings, "added": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "model": model, "model_file": MODEL_FILE.relative_to(ROOT).as_posix(), "model_sha256": hashlib.sha256(MODEL_FILE.read_bytes()).hexdigest(),
        "usage": usage, "cost_usd": round(sum(u["usd"] for u in usage.values()), 4),
        "counts": {**counts, "links": len(edges), "in_model": len(in_model), "dropped": dict(dropped)},
        "extraction": sets, "graph": graph,
    }
    folder = root / "papers" / paper
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "paper.pdf").write_bytes(data)
    (folder / "record.json").write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return record
