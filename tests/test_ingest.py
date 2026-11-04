"""The papers a person drops in: the PDF text, the guard, the graph and the whole path with a stand-in for the model (no API call, nothing
spent). The claims in these tests are synthetic: they say what the code must do with a claim of that kind, not what is true in biology."""
import json

import pytest

from cellproof.extract.claims import LLMResult
from cellproof.formalize.entities import Grounder, Hgnc
from cellproof.ingest import pipeline
from cellproof.ingest.graph import VERDICTS, paper_graph
from cellproof.ingest.guard import check_paper
from cellproof.ingest.pdf import MIN_CHARS, PdfError, PdfText, clean, read_pdf
from cellproof.network.bnet import load_bnet

HELDOUT = {
    "arya2010": {"cite": "Arya AK et al. Br J Cancer 2010;103(2):186-195", "doi": "10.1038/sj.bjc.6605739", "pmcid": "PMC2906734"},
    "middleton2018": {"cite": "Middleton FK, Pollard JR, Curtin NJ. Cancers 2018;10(8):275", "doi": "10.3390/cancers10080275", "pmcid": "PMC6116113"},
}
CORPUS = [{"pmcid": "PMC2243162", "doi": "10.1038/sj.bjc.6604208", "title": "G2 checkpoint abrogation and checkpoint kinase-1 targeting in the treatment of cancer"}]


def pdf_bytes(pages: list[list[str]]) -> bytes:
    """A small valid PDF (Helvetica, one line per entry) so that the reader is tested on a real file."""
    def esc(line: str) -> str:
        return line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    out = bytearray(b"%PDF-1.4\n")
    offsets: dict[int, int] = {}

    def obj(number: int, body: bytes) -> None:
        offsets[number] = len(out)
        out.extend(f"{number} 0 obj\n".encode() + body + b"\nendobj\n")

    obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    obj(2, f"<< /Type /Pages /Kids [{' '.join(f'{5 + 2 * i} 0 R' for i in range(len(pages)))}] /Count {len(pages)} >>".encode())
    obj(3, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for i, lines in enumerate(pages):
        stream = "BT /F1 10 Tf 12 TL 40 760 Td " + " ".join(f"({esc(line)}) Tj T*" for line in lines) + " ET"
        obj(4 + 2 * i, f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream".encode())
        obj(5 + 2 * i, f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {4 + 2 * i} 0 R /Resources << /Font << /F1 3 0 R >> >> >>".encode())
    count = 4 + 2 * len(pages)
    start = len(out)
    out.extend(f"xref\n0 {count}\n".encode() + b"0000000000 65535 f \n")
    for number in range(1, count):
        out.extend(f"{offsets[number]:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {count} /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n".encode())
    return bytes(out)


def filler(page: int, lines: int = 14) -> list[str]:
    return [f"Series {page}.{i}: the samples of this series were handled as described in the methods and measured twice by two people." for i in range(lines)]


SENTENCES = [
    "WEE1 inhibits CDC25C in the model system that this paper describes.",
    "WEE1 activates PPM1D in the model system that this paper describes.",
    "WEE1 activates TERT in the model system that this paper describes.",
    "WEE1 activates ATM in the model system that this paper describes.",
    "WEE1 activates CDC25C in the model system that this paper describes.",
    "Ionizing radiation activates ATM in the cells of this paper.",
    "Protein 53BP1 activates ATM in the cells of this paper.",
]


def paper_pdf() -> bytes:
    pages = [["Journal of Tests 2026", "A synthetic paper about checkpoint kinases", "doi:10.9999/synthetic.2026.1", *SENTENCES, *filler(1)]]
    pages += [["Journal of Tests 2026", *filler(n), str(n)] for n in range(2, 5)]
    return pdf_bytes(pages)


def claim(source, target, effect, quote, **extra):
    return {"source": source, "target": target, "effect": effect, "context": "synthetic", "evidence_quote": quote, "location": "Results", **extra}


MECHANISM = [
    claim("WEE1", "CDC25C", "inhibits", SENTENCES[0]), claim("WEE1", "WIP1", "activates", SENTENCES[1]), claim("WEE1", "TERT", "activates", SENTENCES[2]),
    claim("WEE1", "ATM", "activates", SENTENCES[3]), claim("WEE1", "CDC25C", "activates", SENTENCES[4]), claim("53BP1", "ATM", "activates", SENTENCES[6]),
    claim("WEE1", "TERT", "activates", "this sentence is not in the paper at all, so it is not grounded"),
]
STIMULUS = [claim("ionizing radiation", "ATM", "activates", SENTENCES[5])]


@pytest.fixture
def stand_in(monkeypatch, tmp_path):
    """The model answers from a fixed list; every call is recorded, with the cache folder it was given."""
    calls = []

    def fake(prompt, *, model, client=None, cache_dir=None, **params):
        kind = "stimulus" if "stimulus is" in prompt else "mechanism"
        calls.append((kind, cache_dir))
        return LLMResult(json.dumps({"claims": MECHANISM if kind == "mechanism" else STIMULUS}), False, model, {"input_tokens": 12_000, "output_tokens": 3_000})

    monkeypatch.setattr("cellproof.extract.claims.complete", fake)
    monkeypatch.setenv("CELLPROOF_OFFLINE", "1")  # a name HGNC has not been asked about stays unmapped; no network in a test
    return calls


# ---------------------------------------------------------------- the text of a PDF

def test_clean_folds_ligatures_and_joins_words_split_at_the_end_of_a_line():
    text, _ = clean(["The ﬁrst phos-\nphorylation of p53-\nMDM2 ­complexes."])
    assert "first phosphorylation" in text and "p53-MDM2" in text and "­" not in text


def test_clean_drops_what_repeats_on_most_pages_and_cuts_the_reference_list():
    pages = [f"Journal of Tests 2026\nBody of page {n} " + "word " * 120 + f"\n{n}" for n in range(1, 6)]
    pages[-1] += "\nReferences\n1. A cited paper that names MDM2.\n2. Another cited paper."
    text, notes = clean(pages)
    assert "Journal of Tests" not in text and "cited paper" not in text and "References" not in text
    assert any("repeated" in n for n in notes) and any("reference list" in n for n in notes)
    assert text.count("Body of page") == 5


def test_a_reference_heading_near_the_start_is_not_taken_for_the_list():
    text, notes = clean(["References\n" + "intro words " * 200 + "\nResults\n" + "more words " * 200])
    assert "more words" in text and not any("reference list" in n for n in notes)


def test_read_pdf_returns_the_pages_text_title_and_doi():
    pdf = read_pdf(paper_pdf(), "synthetic.pdf")
    assert pdf.pages == 4 and pdf.doi == "10.9999/synthetic.2026.1" and "Journal of Tests" not in pdf.text
    assert all(sentence in pdf.text for sentence in SENTENCES) and pdf.title.startswith("A synthetic paper")
    assert pdf.chars == len(pdf.text) >= MIN_CHARS


@pytest.mark.parametrize("data, why", [(b"hello", "not a PDF"), (pdf_bytes([["too short to be a paper"]]), "almost no text")])
def test_read_pdf_refuses_what_is_not_a_paper_and_says_why(data, why):
    with pytest.raises(PdfError, match=why):
        read_pdf(data)


# ---------------------------------------------------------------- the guard

def pdf_with(text, doi=None, title="A synthetic paper about checkpoint kinases"):
    return PdfText(text=text, pages=1, chars=len(text), words=len(text.split()), doi=doi, title=title)


def verdict(pdf, existing=(), filename="paper.pdf"):
    return check_paper(pdf, filename, heldout_sources=HELDOUT, corpus=CORPUS, existing=list(existing))


def test_an_audit_source_is_refused_by_doi_by_pubmed_central_id_and_by_author_year_and_journal():
    by_doi = verdict(pdf_with("some text " * 300, doi="10.1038/sj.bjc.6605739"))
    by_pmc = verdict(pdf_with("Available in PMC6116113. " + "some text " * 300))
    by_cite = verdict(pdf_with("Arya AK, Smith B. British Journal of Cancer (2010) 103, 186. " + "some text " * 300))
    for found, key in ((by_doi, "arya2010"), (by_pmc, "middleton2018"), (by_cite, "arya2010")):
        assert found.kind == "heldout" and found.paper == key and "audit" in found.reason and not found.ok


def test_a_shared_surname_or_year_alone_is_not_enough_to_refuse():
    assert verdict(pdf_with("Dr Arya wrote this in 2010. " + "some text " * 300)).ok


def test_a_paper_the_ai_already_read_is_not_read_twice_and_a_dropped_one_shows_its_result():
    assert verdict(pdf_with("x " * 400, doi="10.1038/sj.bjc.6604208")).kind == "corpus"
    assert verdict(pdf_with("G2 checkpoint abrogation and checkpoint kinase-1 targeting in the treatment of cancer. " + "x " * 400)).paper == "PMC2243162"
    again = verdict(pdf_with("x " * 400, doi="10.9999/own.1"), existing=[{"id": "USR-1", "doi": "10.9999/own.1", "title": "Another"}])
    assert again.kind == "duplicate" and again.paper == "USR-1"
    assert verdict(pdf_with("x " * 400, doi="10.9999/new.1")).ok


# ---------------------------------------------------------------- the graph

def test_the_graph_names_every_claim_and_only_judges_what_the_model_can(tmp_path, monkeypatch):
    monkeypatch.setenv("CELLPROOF_OFFLINE", "1")
    rules = load_bnet(pipeline.MODEL_FILE)
    grounder = Grounder(Hgnc())
    claims = [claim("WEE1", "CDC25C", "inhibits", "q1"), claim("wee1", "cdc25c", "inhibits", "q2"), claim("WEE1", "NOTAGENE", "activates", "q3"), claim("WEE1", "WEE1", "activates", "q4")]
    records = {"Wee1|inhibits|Cdc25": {"edge": "Wee1|inhibits|Cdc25", "status": "skipped_present", "detail": "Wee1 already acts on Cdc25 with sign -"}}
    graph = paper_graph(claims, grounder, rules, records)
    by_id = {e["id"]: e for e in graph["edges"]}
    assert set(by_id) == {"Wee1|inhibits|Cdc25", "Wee1|activates|?notagene"}  # a self-loop is not an edge; two spellings of one claim are one edge
    assert by_id["Wee1|inhibits|Cdc25"]["verdict"] == "present" and by_id["Wee1|inhibits|Cdc25"]["n"] == 2
    outside = by_id["Wee1|activates|?notagene"]
    assert outside["verdict"] == "outside" and "NOTAGENE" in outside["why"] and "not in the model" in outside["why"]
    nodes = {n["id"]: n for n in graph["nodes"]}
    assert nodes["Wee1"]["model"] and not nodes["?notagene"]["model"] and nodes["?notagene"]["name"] == "NOTAGENE"
    assert graph["counts"] == {**{v: 0 for v in VERDICTS}, "present": 1, "outside": 1}


# ---------------------------------------------------------------- the whole path

def test_a_dropped_pdf_goes_through_every_step_and_the_solver_judges_each_link(stand_in, tmp_path):
    steps = []
    record = pipeline.ingest(paper_pdf(), "synthetic.pdf", root=tmp_path, progress=lambda step, state, detail: steps.append((step, state)))
    assert [s for s, state in steps if state == "done"] == list(pipeline.STEPS)
    assert [kind for kind, _ in stand_in] == ["mechanism", "stimulus"] and all(folder == tmp_path / "cache" for _, folder in stand_in)  # not the committed cache
    counts = record["counts"]
    assert (counts["proposed"], counts["grounded"], counts["ungrounded"]) == (8, 7, 1)  # the invented quote is set aside, counted, not used
    assert record["graph"]["counts"] == {"accepted": 1, "rejected": 1, "present": 2, "implied": 1, "conflict": 1, "outside": 1}
    verdicts = {e["id"]: e["verdict"] for e in record["graph"]["edges"]}
    assert verdicts["Wee1|activates|hTERT"] == "accepted" and verdicts["Wee1|activates|Wip1"] == "rejected" and verdicts["Wee1|activates|Cdc25"] == "conflict"
    assert verdicts["DNA_damage|activates|ATM_pH2AX"] == "present" and verdicts["Wee1|activates|ATM_pH2AX"] == "implied"
    rejected = next(e for e in record["graph"]["edges"] if e["verdict"] == "rejected")
    assert rejected["why"].startswith("breaks V") and rejected["support"][0]["quote"] == SENTENCES[1]
    assert record["cost_usd"] > 0 and record["usage"]["mechanism"]["usd"] > 0 and record["doi"] == "10.9999/synthetic.2026.1"
    kept = tmp_path / "papers" / record["id"]
    assert (kept / "paper.pdf").read_bytes() == paper_pdf() and json.loads((kept / "record.json").read_text(encoding="utf-8"))["id"] == record["id"]
    assert (tmp_path / "hgnc_cache.json").exists()  # a copy: new names are never written into the tracked cache


def test_the_same_pdf_dropped_twice_is_not_read_twice(stand_in, tmp_path):
    first = pipeline.ingest(paper_pdf(), "synthetic.pdf", root=tmp_path)
    calls = len(stand_in)
    second = pipeline.ingest(paper_pdf(), "renamed.pdf", root=tmp_path)
    assert second["id"] == first["id"] and len(stand_in) == calls
    assert [p["id"] for p in pipeline.list_papers(tmp_path)] == [first["id"]]


def test_an_audit_source_is_refused_before_any_call_to_the_model(stand_in, tmp_path):
    text = [["Journal of Tests 2026", "doi:10.1038/sj.bjc.6605739", *SENTENCES, *filler(1)]] + [["Journal of Tests 2026", *filler(n), str(n)] for n in range(2, 5)]
    with pytest.raises(pipeline.Refused) as refused:
        pipeline.ingest(pdf_bytes(text), "arya.pdf", root=tmp_path)
    assert refused.value.verdict.kind == "heldout" and stand_in == [] and not (tmp_path / "papers").exists()


def test_the_plan_reads_and_checks_without_calling_the_model(stand_in, tmp_path):
    info = pipeline.plan(paper_pdf(), "synthetic.pdf", root=tmp_path)
    assert info["guard"]["kind"] == "ok" and info["pages"] == 4 and info["doi"] == "10.9999/synthetic.2026.1" and stand_in == []
    assert info["estimate_usd"] is None or info["estimate_usd"] > 0


def test_papers_are_listed_loaded_and_deleted_by_id_only(stand_in, tmp_path):
    record = pipeline.ingest(paper_pdf(), "synthetic.pdf", root=tmp_path)
    assert pipeline.load_paper(record["id"], tmp_path)["title"] == record["title"]
    for hostile in ("../papers", "USR-x/../../x", "..\\x", "", "PMC123"):
        assert pipeline.load_paper(hostile, tmp_path) is None and not pipeline.delete_paper(hostile, tmp_path)
    assert pipeline.delete_paper(record["id"], tmp_path) and pipeline.list_papers(tmp_path) == []


def test_the_cost_estimate_for_the_corpus_text_equals_what_the_corpus_cost_for_both_passes():
    """A paper's size must count once, not once per pass: counting it twice halved the estimate shown before a person confirmed a read
    (the first real PDF read cost $0.077 against an estimate of $0.035)."""
    from pathlib import Path

    from cellproof.meta_client import cost_usd

    root = pipeline.ROOT
    manifest = json.loads(pipeline.MANIFEST_FILE.read_text(encoding="utf-8"))["papers"]
    size = {p["pmcid"]: p.get("chars", 0) for p in manifest}
    spent, papers = 0.0, set()
    for folder in ("muse-spark-1.3", "muse-spark-1.3-stimulus"):
        for path in Path(root, "data", "extractions", folder).glob("*.json"):
            record = json.loads(path.read_text(encoding="utf-8"))
            spent += cost_usd(record.get("usage"), record["model"])
            papers.add(record["pmcid"])
    assert pipeline.estimate_usd(sum(size.get(p, 0) for p in papers)) == pytest.approx(spent, abs=0.0015)
