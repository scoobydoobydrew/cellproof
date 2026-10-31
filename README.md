# CellProof

**LLM-proposed rules, solver-verified: repairing a cell-signalling model under formal verification.**

Meta Global AI Developer Hackathon, Indie track, "Push the Frontier". A research prototype. It prioritises hypotheses for lab
testing and gives no medical advice.

> **What pre-existed and what was built this week.** Pre-existing: the published 30-node Boolean model of the DNA damage
> response (Gupta et al. 2023, CC BY), the open-access papers, the open-source solvers (clingo, mpbn, AEON, pyboolnet), the
> PhysiBoSS simulator with its MaBoSS engine, the open ChEMBL database, and the libraries listed in `THIRD_PARTY.md`. Built
> during the hackathon, in this repository only: everything in `src/`, `tests/`,
> `data/` (except the base model's rules, generated from its supplement by `src/cellproof/network/gupta2023.py`), `scripts/`
> and `docs/`.

## The idea

Boolean network models of cell signalling are powerful but incomplete: they miss mechanisms the literature already knows. A
language model can read papers and turn sentences into rules, but it cannot tell whether a rule breaks the model. An exact
solver can tell, but cannot read. CellProof joins them:

1. **Read.** Muse Spark reads each paper and returns mechanisms (`A activates / inhibits / is required by B`) with a quote.
   A quote that is not found verbatim in the paper is discarded.
2. **Ground.** Names are mapped to nodes through HGNC symbols and aliases. New nodes are added only if the evidence connects them
   to the network in both directions.
3. **Propose.** A fixed template turns each edge into a change of one rule.
4. **Verify.** An exact solver (complete fixed-point enumeration, attractor analysis) checks the edited network against ten
   known wild-type and mutant behaviours. A change that contradicts one comes back with a **counterexample**.
5. **Repair.** Muse Spark gets the claim, the evidence and the counterexample and proposes another rule. The solver checks it again;
   a repair that only restores the cases by making the new term inert is refused.
6. **Evaluate.** The augmented network is compared with the base network on held-out outcomes it never saw.

The model proposes; the solver decides. Every accepted or rejected rule is traceable to papers, quotes and a solver verdict:
`python -m cellproof.cli explain "CHK1|inhibits|Cdc25"`.

## Results

All numbers are produced by `make verify` and written to [`results/RESULTS.md`](results/RESULTS.md). Read the limits first:
[`docs/limitations.md`](docs/limitations.md).

**The interactive report is [`results/report.html`](results/report.html)** (open it in a browser; `python -m cellproof.cli report`
rebuilds it). The top of the page is a story of about 50 seconds (long enough to read, and it stands still while the mouse pointer is over its words or pictures) told over a close-up of DNA, in six beats: radiation breaks DNA; a
damaged cell can pause, age, recycle itself or die, so not every one dies; the goal, a combination of genes to switch off, or on,
that leaves only death; new rules keep coming and each can change which combinations work (a small network of genes: papers
bring links one after another, and the combinations of the published list stop working as the pipeline's own edits are
replayed one by one, unchecked; then each rule is checked first and the same combinations stay, next to the number of known
experiments each model breaks); the search for it explodes with the number of genes changed at once (controlling a Boolean network is
NP-hard in general, Akutsu et al. 2007); the AI alone, the solver alone and the two together, ending with the exact solver's
shortlist (every count, time and verdict is computed when the page is built, not typed in; times for larger sets are projections
and say so). Below it is a test bench in five clickable steps (the
cells, a patch from the literature, ten known experiments, the AI's repair, a check against held-out outcomes) and a sixth, a
game: find every way to leave only death. The stage shows a dish of cells that react to radiation, and the same network drawn
as a pathway poster (a cell whose membrane takes the radiation, named gene pills, golden arrows that switch on, teal bars that
switch off); there is a 60-second automatic walk-through and the texts are in English and Greek. Below it is the lab notebook
with every number and case file. Every lamp, every fate a cell takes in the dish and every pill that is lit is the exact solver's
answer; the pictures themselves are illustration (see `docs/limitations.md`). The headline numbers, each also in `results/RESULTS.md`:

| | |
|---|---|
| Papers read by Muse Spark | 36 open-access papers, each read twice (molecule on molecule; DNA damage on molecule) |
| Claims extracted | 709, of which 708 have a quote found word for word in the paper |
| New genes found by a mechanical rule | ATR, CHK1, CHK2, DNA-PK |
| Rule edits from papers that contradict a known behaviour | 14 of 30 (47%), every edge with at least one paper |
| Known behaviours broken when edits are applied without the solver | 7 of 10 (every edge) and 8 of 10 (at least two papers); with the solver, 0 |
| Rejected edits repaired by Muse Spark and accepted by the solver | 6 of 9 (every edge), 3 of 4 (≥2 papers); Muse Wonder: 6 of 9 and 2 of 4 |
| One repair call, Spark vs Wonder | 39.7 s and $0.04 against 102.6 s and $0.19 (median of 3) |
| The search for gene sets that leave only death, solver alone | all 1,058 sets of up to two changes tried exactly in seconds, 11 minimal sets; sets of up to 5 changes would be 1,233,674 (projected time in the report) |
| The same search, AI alone (Muse Spark, no tools, minimal reasoning, 3 requests) | 13 of 17 distinct guesses leave only death (a random candidate: 21%), 4 of the 11 minimal sets found, none checked; see `docs/limitations.md` |
| Held-out audit: 23 claims, 10 scoreable | published model 3 correct, 5 wrong, 2 not expressible; augmented networks 4 correct, 6 wrong; a rule that ignores the perturbation 5 correct |
| Exact checker on 400-node chains | stable states in milliseconds, 13 s in all; random networks time out from 50 nodes |
| Tissue what-if: 1,663 irradiated cells in PhysiBoSS, 72 h (extension) | the simulation agrees with the exact solver on 22 of 22 sets: the 11 solver sets leave at most 12 cells alive (none in 7 of them) and reach 0 by 240 h, the 11 rejected sets of the same size leave at least 34; radiation alone leaves 107 cells, all senescent |
| Literature check of PTEN and RB loss (extension) | 24 open-access papers read in two waves under a rule fixed before reading (six per gene, then six more by the same rule, decided after the first results), 10 on topic, quotes checked by code: 4 agree with the model's direction, 5 contradict it and 1 shows no difference; where the gene itself was changed in the same cells, 1 agrees and 3 contradict (the one RB1 knockout gave radioresistance and less apoptosis); none reports apoptosis as the only fate |
| Start-aware and sequential analysis (extension) | exact reachability from a healthy irradiated cell: 2 of the 4 stable states can be reached (the tissue run reached the same 2); 3 more minimal sets than the solver finds (AMPK_MAPK KO + CHK1 KO, Cdc25 on, Sirt1 on), predicted before and leaving no cell alive in the tissue (3 of 3); no pair, no order of the five kinases of the brief (1,081) and no set of three knock-outs (14,586 orders) works only in a particular order, and one pair works only at once; the first validation against the tissue failed for 8 of 23 conditions, an amended one, added after seeing that, holds for 23 of 23 |
| Tumour genotypes as constraints on the model (extension) | 9,896 TCGA tumour samples from 32 studies (counts only): TP53 is lost in 14.2% (narrow rule) to 38.6% (broad rule) of them, and for none does any of the 11 sets leave only apoptosis; with TP53 intact each set works in 95% to 96.5% of the samples (80.4% for one); a model statement about genotype, not about any person |
| Solver targets and ChEMBL chemistry (extension) | 3 of the 11 sets are knock-outs (PTEN, RB, TUG1); PTEN has 5 activity records and none at 1 micromolar, and the 6 strong records of RB1 all read out its phosphorylation in cells; the 5 kinases named in the brief have 566 to 2,299 compounds at 1 micromolar, but knocking out any of them alone leaves all four end states |
| Extraction accuracy (M4) | TBD: needs 50 claims labelled by a person |

**What the audit says.** The augmented networks do not predict the held-out outcomes better than the published model: none of
its 8 verdicts changed, and a rule that ignores the perturbation scores higher than any network. In 4 of the 8 claims the
published model can address (p53 knocked out, and WEE1 inhibited in a p53-null line) it has no stable state at all: the
network oscillates, nothing is "present" under the frozen scoring rule, and those verdicts, marked `*` in
`results/m1_heldout.md`, are artifacts and not predictions. On the other 4 it gets 2 right, the same as ignoring the
perturbation. The annotation was added after the first scoring run and changes no verdict. So the useful result is the audit
itself, an automatic comparison of a published model with the literature that also shows where the model gives no answer,
and the solver loop that keeps added mechanisms from breaking what the model already gets right. Ten scoreable claims
cannot show an improvement either way.

**Taking the answers downstream (extension, `docs/downstream_notes.md`).** The solver's sets were run in a virtual tissue (PhysiBoSS,
an existing simulator of many cells) and turned into a list of targets with measured chemistry from ChEMBL. The tissue is a
second, independent check of the solver, not a prediction about any patient: no signals between cells, no drug, no dose, no
division, rates that are choices. The chemistry step ends where it does for a reason that is itself a result: where the solver
points there is no chemistry (PTEN, RB1), and where the chemistry is (ATR, CHK1, WEE1, DNA-PK) this model points only through one pair found later by the start-aware analysis (CHK1 knocked out with AMPK_MAPK, a node that merges two entities). No
drug-affinity model was run: MSF-DTA has no public code that could be found, and its inputs would be missing for these targets.
Every answer also depends on p53: with p53 knocked out, none of the 11 sets leaves only apoptosis (`results/RESULTS.md`), and on 9,896 public tumour samples none of those with TP53 lost has a set that works. Two later studies took ideas from papers the project owner supplied: an exact start-aware and sequential analysis (`docs/sequential_protocol.md`, after Mandon et al. 2019), which finds three more sets that the tissue run confirmed and no sequence-only set, and the genotype study (`docs/genotype_protocol.md`, after Montagud et al. 2022).

## Reproduce

```bash
python -m venv .venv && .venv/bin/pip install -e .[dev]      # Python 3.11+
make test      # unit tests, no network
make verify    # rebuilds every table from cached model outputs; no API call, no cost; a cache miss is an error
make extract   # the only target that spends money: calls the Meta Model API for requests not yet in cache/
make label     # local page for the two reading tasks only a person can do (M4 labels, D4 quote checks)
make sequences # exact start-aware and sequence search (tens of minutes on several cores, no network); `make verify` only reads its result
```

The tissue what-if needs PhysiBoSS, which `make verify` does not: `bash scripts/physiboss_setup.sh` builds it once (WSL or Linux,
g++ and make only), `python -m cellproof.cli tissue` re-runs the conditions, `python -m cellproof.cli compounds` asks ChEMBL again,
`python -m cellproof.cli genotypes --fetch` reads the TCGA tumour alterations from cBioPortal again (without `--fetch` it only recomputes from the committed counts).

`.env` holds `MODEL_API_KEY` (never committed; see `.env.example`). Standard model IDs only, never `-contributor`.

## Layout

```
src/cellproof/
  meta_client.py     Meta Model API (Responses API) with an on-disk cache keyed by model, prompt and parameters
  corpus/            Europe PMC selection and download (open access, Creative Commons only)
  extract/           Muse Spark structured extraction, quote check, outcome filter
  formalize/         grounding (HGNC), edges, template edits, augmentation driver
  verify/            exact checker, acceptance rules, Muse Spark repair
  network/           bnet reader, base network from its supplement, phenotype definitions, Boolean logic
  analysis/          fixed points and attractors, scaling measurements, start-aware and sequential analysis (exact reachability with AEON)
  eval/              held-out set, scoring, report, the click page for M4 and D4
  tissue/            PhysiBoSS tissue what-if: network translation, settings, WSL runner, output parser, experiments
  targets/           the solver's sets as targets (HGNC) and ChEMBL measured chemistry
  genotype/          tumour genotypes (TCGA through cBioPortal) as constraints on the model: counts of signatures, what the model says for each
data/                base network, verification cases, held-out set (frozen), extractions, models, HGNC cache
docs/                protocol of the held-out set, limitations, notes on the Meta API and the extraction
```

## Honesty notes

- The held-out set (23 claims, 10 scoreable) was frozen before any network was scored; its history is in
  `docs/heldout_protocol.md`. A human has not yet checked that each quote supports its claim, so M1 is provisional.
- Extraction accuracy (M4) needs 50 claims labelled by a person (`data/labels/m4_sample.csv`) and is TBD until then. `make label`
  opens a page where each click is saved; nothing in it is pre-filled and no model is called.
- The tissue and chemistry steps are an extension and a second check of the solver. They say nothing about drugs, patients,
  efficacy, safety or secondary cancers (`docs/downstream_notes.md`), and a Boolean model of one published network decides
  every set they start from.
- The sequence and genotype studies each have a protocol committed before their results (`docs/sequential_protocol.md`, `docs/genotype_protocol.md`). The
  first validation of the sequence analysis against the tissue failed for 8 of 23 conditions; an amended one, written after seeing that and labelled so,
  holds, and is tested out of sample. Both are reported. The genotype study is about how the model's answers depend on genotype, counted on public tumour
  data with a crude rule; it says nothing about any person.
- Third-party code and data are declared in `THIRD_PARTY.md`; paper texts are downloaded, not redistributed.
