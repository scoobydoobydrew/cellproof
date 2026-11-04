# Submission text (draft, to paste into the form)

Every number here is one that `results/RESULTS.md` or the README already carries; read it off `make verify` again on the day,
and change nothing that the files do not say. Fill in the two links before submitting.

- Repository: https://github.com/scoobydoobydrew/cellproof (public; open it in a window where you are not signed in before submitting)
- Video: https://youtu.be/D8h-UASmn5M (3 minutes; the first line says what pre-existed and what was built this week). Set to Public before submitting.

## Name and one line

**CellProof.** LLM-proposed rules, solver-verified: repairing a cell-signalling model under formal verification.

## Short description (about 100 words)

Boolean models of how cells respond to DNA damage are powerful but incomplete: they miss mechanisms the papers already know.
CellProof is an agent in which Muse Spark reads 36 open-access papers and proposes mechanistic rules, and an exact solver accepts
or rejects each rule against ten known behaviours, returning a counterexample that Muse Spark uses to repair the rule. The model
proposes; the solver decides. Without the solver the paper-derived edits break 7 of the 10 known behaviours; with it, none.
Everything is reproducible with one command and free from cached outputs, and the limits are stated next to the results.

## Longer description

**The problem.** A published 30-gene Boolean model of the DNA damage response is a compact, checkable object, but it lacks links
that the literature knows. A language model can read papers and turn sentences into rules, but cannot tell whether a rule breaks
the model. An exact solver can tell, but cannot read.

**What the system does.** Muse Spark extracts mechanisms with a verbatim quote from each paper (a quote that is not in the paper
is discarded); names are grounded to the model's genes through HGNC; a fixed template turns each edge into a change of one rule;
the solver checks the edited network against ten wild-type and mutant behaviours and returns a counterexample on failure; Muse Spark
gets the claim, the evidence and the counterexample and proposes another rule, which the solver checks again (a repair that only
makes the new term inert is refused). Muse Wonder is compared with Muse Spark on the repair step for accuracy, cost and latency.

**What it found.** 709 claims from 36 papers, 708 with a quote found word for word. 14 of 30 edits taken from papers contradict a
known behaviour. Applied without the solver, the edits break 7 of 10 known behaviours; with the solver, 0. Muse Spark repaired
6 of 9 rejected edits, which the solver then accepted. The exact solver finds every way of changing one or two genes that leaves only
apoptosis (11 minimal sets) in seconds, and the project counts how the search explodes for larger sets. On held-out outcomes the
augmented networks are **not** better than the published model: the useful result is an automatic audit that shows where a
published model and the literature disagree, and that stops added mechanisms from breaking what the model already gets right.

**Beyond the core (each with its protocol written before its results).** The solver's sets were run in a virtual tissue of 1,663
cells (PhysiBoSS), a second independent engine, which agrees with the solver on 22 of 22 sets. An exact analysis that starts from a
healthy cell found three more sets than the solver, predicted before they were simulated, and the tissue left none of the cells alive
in each. A reading of 24 open-access papers does not support the model's direction for PTEN and RB1. On 9,896 public tumour samples,
the sets stop working when TP53 is lost. Failed checks are reported, including a first validation that failed for 8 of 23
conditions and was amended afterwards, labelled as such.

## How Meta's models are used

Muse Spark (Standard model ids, never the contributor mode) is in the main pipeline twice: structured extraction of mechanisms from
paper text, and repair of rejected rules from solver counterexamples. Muse Wonder is run on the repair step for the model ablation.
Every response is cached on disk by a hash of model, prompt and parameters, so `make verify` is deterministic, free and makes no
API call; only `make extract` spends money.

## What existed before, and what was built this week

Before: the published 30-node model (Gupta et al. 2023, CC BY), the open-access papers, the open-source solvers (clingo, mpbn, AEON,
pyboolnet), the PhysiBoSS simulator with its MaBoSS engine, the ChEMBL database, the cBioPortal API and TCGA data, and the libraries
in `THIRD_PARTY.md`, and the author's own earlier agent of 24 October, in another repository (an LLM proposing gene knockouts on a different published model, Remy et al. 2015, checked by an exact solver; it did not read papers; see the README). Built this week, in this repository only: everything in `src/`, `tests/`, `scripts/` and `docs/`, and the data
files other than the base model's rules.

## Limits, stated plainly

Boolean networks are discrete abstractions: no dose, no time. One base model, so the results depend on it. Ground truth comes from
papers and may be incomplete. The solver catches contradictions with the behaviours we encoded, not every error. Ten scoreable held-out
claims cannot show an improvement either way, and they were written by us and are not yet checked by a person. Extraction accuracy is
TBD until 50 claims are labelled by a person. Everything is a hypothesis for the lab: no patient-facing output, no clinical claim,
no medical advice.

## Reproduce

`make test` (no network), `make verify` (rebuilds every table from cached outputs, no API call), `make extract` (the only target that
spends money). The interactive report is `results/report.html`.
