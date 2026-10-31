# Literature check: does losing PTEN or RB1 agree with the papers?

Status 2026-10-31. A first reading, by the assistant, of what open-access papers report about two of the solver's answers. The
quotes are checked by code against the papers (`python -m cellproof.cli literature`); a person has not yet checked the readings.
The evidence is in `data/literature/pten_rb_evidence.json`, the candidate lists in `data/literature/pten_rb_candidates.json`
and the counts in `results/RESULTS.md`.

## The question

The model says that after DNA damage a cell without PTEN (set `hit_03`) or without RB1 (`hit_04`) has apoptosis as its only
stable end state (`results/targets.json`). Papers rarely speak in end states; they report apoptosis, cell death, survival or
radiosensitivity. So only the **direction** can be compared: this check can contradict the model, and it can never confirm its
finer claim ("only apoptosis").

## The protocol, fixed before any paper was read

1. Search Europe PMC for open-access papers with a Creative Commons licence that are not reviews, not retracted and not one of the
   held-out source papers, in Europe PMC's citation order. PTEN: the gene in the title, and in the abstract radiation or
   radiosensitivity together with loss, deficiency, knockdown, silencing, mutation, inhibition, deletion or knockout. RB1: the same
   with RB1, retinoblastoma or pRB in the title (the exact queries are in `src/cellproof/eval/literature.py`).
2. Take the first six papers per gene that meet those conditions. Nothing else decides which papers are read.
3. For each paper decide whether it reports what loss or inhibition of the **human or mammalian gene** does to the response of cells
   to radiation or DNA damage (apoptosis, cell death, survival, sensitivity). If not, it is `off_topic` and the reason is written
   down; it is **not replaced**, so that the choice of papers cannot depend on what they say.
4. For each on-topic paper keep up to two verbatim sentences (at most 40 words; code checks that they occur in the paper) and
   one verdict: `agrees_in_direction` (without the gene, more apoptosis, more cell death or more radiosensitivity),
   `contradicts` (less apoptosis, more survival, radioresistance) or `mixed`.
5. Report counts and quotes. No percentage and no majority vote.

The two queries were run, the candidate lists stored and the six papers per gene fixed by the rule before any text was read. The titles of the
first hits had been seen by then (a first run only printed them); the rule, not the reader, picks the papers.

## What was found

12 papers read; 6 on topic, 6 set aside.

| gene | paper | verdict | fate reported | what it says |
|---|---|---|---|---|
| PTEN | Chun-Zhi Z et al., BMC Cancer 2010 (PMC2914702) | contradicts | apoptosis, more of it when PTEN is raised | Raising PTEN in gastric cancer cells made them more radiosensitive and more apoptotic, so low PTEN goes with less of both. The evidence is by restoring PTEN, not by removing it |
| PTEN | Chatterjee P et al., PLoS ONE 2013 (PMC3614551) | agrees in direction | senescence | PTEN-null prostate cancer lines lost more clonogenic survival after radiation with a PARP inhibitor, through senescence. Different cell lines, plus a drug |
| PTEN | Vahabi M et al., J Exp Clin Cancer Res 2019 (PMC6440033) | contradicts | not reported | Silencing PTEN in head and neck cancer cells made them more resistant to radiation |
| PTEN | Mansour WY et al., Sci Rep 2018 (PMC5834544) | agrees in direction | not reported (repair and G2/M checkpoint) | PTEN depletion made prostate cancer cells more radiosensitive; the paper itself cites an earlier study in which PTEN loss went with radioresistance |
| RB1 | Robinson TJ et al., PLoS ONE 2013 (PMC3827056) | agrees in direction | not reported (viability) | RB-negative triple-negative breast cancer lines were more sensitive to radiation than RB-positive ones |
| RB1 | Agerbaek M et al., Br J Cancer 2003 (PMC2394264) | agrees in direction | cited from earlier work: apoptosis | Loss of pRB staining predicted a better response to radiotherapy in bladder cancer patients; an association, not a controlled loss |

Set aside as off topic (the reason of each is in the data file): PMC5627969 (photodynamic therapy), PMC3722247 (chemo-resistant
colon cancer cells and a curcumin analogue), PMC5412766 (the plant homologue RBR1), PMC2247029 (a 1989 report of gene
alterations in tumours), PMC3909110 (photodynamic therapy of retinoblastoma cell lines) and PMC4237942 (susceptibility to
radiation-induced osteosarcoma in mice with a low-activity Rb1 promoter variant: tumour induction, not the fate of irradiated
cells).

## What it says about the model

- **RB1.** Both papers that are on topic point the way the model does: without RB, more sensitivity to radiation. Two papers are
  thin evidence, one of them an association in patients' tumours, and neither measures apoptosis as the end state.
- **PTEN.** The literature read here is split two against two. Two papers point the way the model does, but through
  senescence and impaired repair, not apoptosis; one of them reports senescence in PTEN-deficient cells, a state the model says
  a damaged cell without PTEN cannot reach. Two papers report the opposite direction. One of the agreeing papers cites an earlier
  study with radioresistance. So "PTEN loss leaves only apoptosis" is not supported by this reading, and the direction itself is
  contested.
- **Neither.** No paper reports apoptosis as the only fate, which none could be expected to.

## Limits

- Six papers per gene, picked by a fixed rule, is small. Six of the twelve were off topic, which is what the rule does by design
  (it does not replace them). A different query or a different number would give a different set; the candidate lists
  (`data/literature/pten_rb_candidates.json`) include papers beyond the first six that bear on the question and were not read.
- The papers are about cancer cell lines and one set of patients' tumours, and about different stresses (radiation alone, radiation
  with a drug). Cell types and the way the gene was lost (knockdown, null line, raised expression) differ and are noted per paper.
- The papers were read by the assistant, from the abstract and the passages that name the gene together with radiation or an
  outcome. The verdicts are judgements. The quotes can be checked in a minute each.
- Open-access papers with a Creative Commons licence only; the closed literature is not read.
- Nothing here says that either gene is a target worth acting on. It says whether the model's direction is contradicted.
