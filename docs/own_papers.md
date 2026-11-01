# Your own papers: a PDF the AI could not find

The report page has two parts for papers. The first is what the AI found and read on its own: the 36 open-access papers of the corpus
(`data/corpus/manifest.json`), each drawn as a graph. The second is for a paper the AI cannot reach (not open access, or behind a login that a
person has): the person drops the PDF, it is read the same way, and its graph appears next to the others.

## What a graph is

Every gene or molecule a paper names is a dot. Every claim ("A activates B") is a line. The colour of a line is what the exact solver said,
by `src/cellproof/ingest/graph.py`:

| colour | meaning |
|---|---|
| green, ✓ | a new link; the model with it still gives all ten known experiments (`formalize/augment.py`, the verified arm) |
| red, ✕ | a new link that breaks a known experiment; the counterexample is kept and shown |
| blue | the model already has the link |
| lilac | the model already has a longer route with the same sign |
| orange, ≠ | the published model has the opposite sign |
| grey, dashed | an end of the link is not a node of the model: kept as knowledge, not tested, never called wrong |

Most of what the AI reads is grey: 489 of the 679 links drawn for the corpus are about genes that the 34-node model does not have (`results/RESULTS.md`). The page says so
instead of hiding it. The verdicts of the first part are the ones the augmentation logged (`results/augment_repaired_min1.json`); the
second part judges each link against the model that holds everything the corpus taught it (`data/models/repaired_min1.bnet`).

## How to use it

```bash
python -m cellproof.cli serve              # the report from this computer, with a drop zone; opens the browser
python -m cellproof.cli ingest paper.pdf   # the same from the command line; --dry-run only reads the PDF and prints the cost
```

`serve` needs `MODEL_API_KEY` in `.env`. Without the server the report is a static file and the second part explains itself: a page has no key
and no solver. The published page (the artifact) is always static.

A drop first shows a plan: the title, the pages, the DOI, what the guard says and about what reading it costs. Nothing is sent until the
person presses *Read it*. Then six steps run, and the page shows them as they finish: the PDF is read, the guard checks it, Muse Spark reads the
mechanisms, Muse Spark reads what DNA damage does, the names become genes, the solver judges each link. One paper is read at a time.

## What stays on this computer

Everything under `data/user_papers/` is git-ignored: the PDF, the claims with their quotes, the model's replies (their own cache, not the
committed `cache/`) and a copy of the HGNC cache (new names are written there, never into the tracked file). Only the text of the PDF is
sent, to the Meta Model API (Standard, not contributor), to be read. The numbers of the page and of `make verify` never include these papers,
and `tests/test_report_papers.py` checks that the page is built from the committed corpus only.

**Whoever drops a paper is responsible for being allowed to process it.** The terms of an institutional licence may forbid sending a paper's text
to a third-party service; the page says so under the drop zone.

## The guard

The audit's own source papers must never be read by the loop (`Claude.md` section 5): a paper whose outcomes are scored cannot also be a
paper the model learns mechanisms from. A dropped PDF is compared with the audit's sources by DOI, by PubMed Central id, and by author, year
and journal in its first page, and is refused if it matches. A paper that is already in the corpus, or was dropped before, is not read twice:
its existing result is shown. The extraction prompts are the corpus ones (mechanisms only, never outcomes), and a claim that names an outcome
anyway is set aside and counted.

## Limits

- Only PDFs with a text layer. A scan has no text and is refused with the reason. A password-protected or AES-encrypted PDF is refused; open it,
  print it to a new PDF and drop that.
- The text is what `pypdf` makes of the page: columns, tables and figure captions can come out in a different order, and a figure's content is not
  read at all. Words split at the end of a line are joined, repeated headers and footers are dropped and the reference list is cut off, and the
  page says which of these happened. The quote of every claim must be found word for word in that text, or the claim is "ungrounded" and not drawn.
- Only the first 100 pages are read.
- "Grounded" means the quote was copied faithfully, not that the claim was read correctly. Extraction accuracy (M4) is a human's job and has not
  been measured on these papers.
- A name that HGNC does not know uniquely stays as the paper wrote it, so two spellings of one unknown gene can still be two dots; with no network a
  name that was never looked up stays unmapped.
- The solver judges links between genes of the model only (34 nodes). A paper about other genes gives a mostly grey graph.
- A dropped paper does not change the model, the augmentation or any number of the report. Adding its accepted links to a model is a separate
  step that does not exist yet, because it would change the numbers of the report and has to go through the evaluation protocol.
- Cost: the plan's estimate is measured on the 36 corpus papers (both passes) and scaled by the number of characters; a few cents a paper.
