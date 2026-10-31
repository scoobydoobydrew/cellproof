# Literature check: does losing PTEN or RB1 agree with the papers?

Status 2026-10-31. A reading, by the assistant, of what open-access papers report about two of the solver's answers: a first wave of
six papers per gene and a second wave of six more (Amendment 1, below). The quotes are checked by code against the papers
(`python -m cellproof.cli literature`); a person has not yet checked the readings.
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
2. Take the first six papers per gene that meet those conditions. Nothing else decides which papers are read. (Amendment 1 below
   adds six more per gene by the same rule.)
3. For each paper decide whether it reports what loss or inhibition of the **human or mammalian gene** does to the response of cells
   to radiation or DNA damage (apoptosis, cell death, survival, sensitivity). If not, it is `off_topic` and the reason is written
   down; it is **not replaced**, so that the choice of papers cannot depend on what they say.
4. For each on-topic paper keep up to two verbatim sentences (at most 40 words; code checks that they occur in the paper) and
   one verdict: `agrees_in_direction` (without the gene, more apoptosis, more cell death or more radiosensitivity),
   `contradicts` (less apoptosis, more survival, radioresistance) or `mixed`.
5. Report counts and quotes. No percentage and no majority vote.

The two queries were run, the candidate lists stored and the six papers per gene fixed by the rule before any text was read. The titles of the
first hits had been seen by then (a first run only printed them); the rule, not the reader, picks the papers.

## Amendment 1: a second wave of six papers per gene

Written 2026-10-31, **after** the first wave had been read and published (commits `2cd6d51` and `ee579e4`), and committed before any text
of the second wave was downloaded or read.

**Why.** The first wave left too little to say anything: six of its twelve papers were off topic, so RB1 had two on-topic papers and
PTEN four, split two against two. The project owner agreed to read more. This was decided **after seeing the first-wave verdicts**, so
the combined result is less clean than the first wave alone, and both are shown side by side everywhere.

**What.** The same rule with a larger number: ranks 7 to 12 of the qualifying papers (a Creative Commons licence, a PMC id, not a
held-out source) in the candidate lists that were committed in `2cd6d51`. Those lists are Europe PMC's citation order on
2026-10-31 and were fixed before any of these texts were downloaded; the selection does not search again. Steps 1, 3, 4 and 5 are
unchanged: an off-topic paper is recorded with its reason and not replaced. The papers, listed before any of them was read:

| gene | rank | paper | year | cited by | licence | title as listed |
|---|---|---|---|---|---|---|
| PTEN | 7 | PMC6798410 | 2019 | 60 | cc by | Clinical insights gained by refining the 2016 WHO classification of diffuse gliomas with: EGFR amplification, TERT mutations, PTEN deletion and MGMT methylation |
| PTEN | 8 | PMC3315579 | 2012 | 53 | cc by | Loss of PTEN is not associated with poor survival in newly diagnosed glioblastoma patients of the temozolomide era |
| PTEN | 9 | PMC4441389 | 2015 | 48 | cc by | Fractionated Ionizing Radiation Promotes Epithelial-Mesenchymal Transition in Human Esophageal Cancer Cells through PTEN Deficiency-Mediated Akt Activation |
| PTEN | 10 | PMC7145659 | 2020 | 46 | cc by | USP14 is a deubiquitinase for Ku70 and critical determinant of non-homologous end joining repair in autophagy and PTEN-deficient cells |
| PTEN | 11 | PMC6267624 | 2018 | 41 | cc by-nc | LncRNA ANCR promotes proliferation and radiation resistance of nasopharyngeal carcinoma by inhibiting PTEN expression |
| PTEN | 12 | PMC3909012 | 2014 | 38 | cc by | Cell surface area and membrane folding in glioblastoma cell lines differing in PTEN and p53 status |
| RB1 | 7 | PMC9237030 | 2022 | 12 | cc by | Mice with Trp53 and Rb1 deficiency in chondrocytes spontaneously develop chondrosarcoma via overactivation of YAP signaling |
| RB1 | 8 | PMC5465815 | 2017 | 11 | cc by-nc-nd | Analysis of patient outcomes following proton radiation therapy for retinoblastoma |
| RB1 | 9 | PMC5385017 | 2017 | 11 | cc by | Myoepithelial carcinoma with RB1 mutation: remarkable chemosensitivity to carcinoma of unknown origin therapy |
| RB1 | 10 | PMC11049397 | 2024 | 4 | cc by | Probing the Effects of Retinoblastoma Binding Protein 6 (RBBP6) Knockdown on the Sensitivity of Cisplatin in Cervical Cancer Cells |
| RB1 | 11 | PMC4220401 | 2014 | 3 | cc by-nc-sa | Resistant retinoblastoma in a 23-year-old patient |
| RB1 | 12 | PMC11237859 | 2024 | 1 | cc by | P53 and pRB induction improves response to radiation therapy in HPV-positive laryngeal squamous cell carcinoma |

**Rules for this amendment.**
- One extension, of a size fixed now. No further paper is read under this protocol; a later extension would be written here as
  Amendment 2 with its reason.
- Nothing read in the second wave changes a first-wave verdict or quote. If one is changed anyway, the change and its reason are
  listed in this log.
- The titles of every stored candidate, also those beyond rank 12, had been seen when this was written, and some look closer to the
  question than the second wave does. The rule is kept anyway, because choosing by title would let the reader pick the papers.
  RB1 has only 14 qualifying papers in all, so its second wave reaches almost the end of the list.
- This restates step 3 and keeps every first-wave decision as it was: a paper is on topic only if it compares cells or tumours with
  and without the gene, or with it lowered or raised, and reports their response to radiation or DNA damage. A patient survival
  figure with no such contrast is off topic, and the reason is written down.

**Log after reading** (the second wave was downloaded and read after commit `2e8b74a`).
- Eight of the twelve second-wave papers were off topic, three of them on PTEN and five on RB1; the reasons are in the data file.
- After reading the second wave, a `design` field (`changed`, `compared` or `indirect`) and a `wave` field were added to every
  paper of both waves, because two second-wave papers moved PTEN only indirectly and the counts should say so. This was decided
  with the second wave in view. It changes no verdict, quote or note.
- No first-wave verdict, quote or note was changed. `tests/test_literature.py` fixes the first-wave verdicts and the second-wave
  list as they were when each was written down.
- The counts of the second wave moved against the model's direction (see below). The first-wave counts are shown next to the
  combined ones in `results/RESULTS.md` and on the report page.

## What was found

24 papers read in two waves of six per gene; 10 on topic, 14 set aside. The numbers below are in `results/RESULTS.md`, computed from
the evidence file.

| gene | wave | papers read | on topic | agree | contradict | mixed |
|---|---|---|---|---|---|---|
| PTEN | 1 (first six) | 6 | 4 | 2 | 2 | 0 |
| PTEN | 2 (next six) | 6 | 3 | 0 | 2 | 1 |
| PTEN | both | 12 | 7 | 2 | 4 | 1 |
| RB1 | 1 (first six) | 6 | 2 | 2 | 0 | 0 |
| RB1 | 2 (next six) | 6 | 1 | 0 | 1 | 0 |
| RB1 | both | 12 | 3 | 2 | 1 | 0 |

The ten on-topic papers. `design` says how the gene was varied: **changed** (knocked down, knocked out, deleted or raised in the
same cells), **compared** (cell lines, tumours or patients that differ in the gene) or **indirect** (the gene moved as a consequence
of something else that was changed).

| gene | wave | paper | design | verdict | fate reported | what it says |
|---|---|---|---|---|---|---|
| PTEN | 1 | Chun-Zhi Z et al., BMC Cancer 2010 (PMC2914702) | changed | contradicts | apoptosis, more of it when PTEN is raised | Raising PTEN in gastric cancer cells made them more radiosensitive and more apoptotic, so low PTEN goes with less of both. The evidence is by restoring PTEN, not by removing it |
| PTEN | 1 | Chatterjee P et al., PLoS ONE 2013 (PMC3614551) | compared | agrees in direction | senescence | PTEN-null prostate cancer lines lost more clonogenic survival after radiation with a PARP inhibitor, through senescence. Different cell lines, plus a drug |
| PTEN | 1 | Vahabi M et al., J Exp Clin Cancer Res 2019 (PMC6440033) | changed | contradicts | not reported | Silencing PTEN in head and neck cancer cells made them more resistant to radiation |
| PTEN | 1 | Mansour WY et al., Sci Rep 2018 (PMC5834544) | changed | agrees in direction | not reported (repair and G2/M checkpoint) | PTEN depletion made prostate cancer cells more radiosensitive; the paper itself cites an earlier study in which PTEN loss went with radioresistance |
| PTEN | 2 | Brito C et al., BMC Cancer 2019 (PMC6798410) | compared | mixed | not reported (overall survival of patients) | Among glioblastoma patients given radiotherapy alone (74 with a PTEN deletion, 20 without) the paper reports no predictive value of the deletion for the response (p = 0.258). Patients, survival as the measure |
| PTEN | 2 | He E et al., PLoS ONE 2015 (PMC4441389) | indirect | contradicts | not reported (colony survival) | An oesophageal cancer subline made radioresistant by repeated radiation survived radiation better and had less PTEN; PTEN was changed only to study migration, never survival. An association |
| PTEN | 2 | Ma X et al., OncoTargets Ther 2018 (PMC6267624) | indirect | contradicts | not reported (colony survival) | Silencing the non-coding RNA ANCR made nasopharyngeal cancer cells more radiosensitive and raised PTEN; PTEN itself was not changed alone, so the link is the authors' interpretation |
| RB1 | 1 | Robinson TJ et al., PLoS ONE 2013 (PMC3827056) | compared | agrees in direction | not reported (viability) | RB-negative triple-negative breast cancer lines were more sensitive to radiation than RB-positive ones |
| RB1 | 1 | Agerbaek M et al., Br J Cancer 2003 (PMC2394264) | compared | agrees in direction | cited from earlier work: apoptosis | Loss of pRB staining predicted a better response to radiotherapy in bladder cancer patients; an association, not a controlled loss |
| RB1 | 2 | Ding W et al., Clinics 2024 (PMC11237859) | changed | contradicts | apoptosis, less after the knockout | CRISPR knockout of RB1 in HPV-positive laryngeal cancer cells made them radioresistant with less radiation-induced apoptosis, and the same happened to tumours in mice. The only paper in which RB1 itself was knocked out |

By design, over both genes: changed 4 papers (1 agrees, 3 contradict), compared 4 (3 agree, 1 mixed), indirect 2 (both contradict).

Set aside as off topic (the reason of each is in the data file). First wave: PMC5627969 (photodynamic therapy), PMC3722247
(chemo-resistant colon cancer cells and a curcumin analogue), PMC5412766 (the plant homologue RBR1), PMC2247029 (a 1989 report of
gene alterations in tumours), PMC3909110 (photodynamic therapy of retinoblastoma cell lines) and PMC4237942 (susceptibility to
radiation-induced osteosarcoma in mice with a low-activity Rb1 promoter variant: tumour induction, not the fate of irradiated
cells). Second wave: PMC3315579 (patients' survival by PTEN status, a prognosis and not a response to radiation), PMC7145659 (repair
signalling in PTEN-deficient cells, with no survival or sensitivity measured), PMC3909012 (membrane area of glioblastoma lines),
PMC9237030 (a mouse model of chondrosarcoma from deleting Trp53 and Rb1), PMC5465815 (outcomes of proton therapy for the disease
retinoblastoma), PMC5385017 (one case report of a tumour with an RB1 mutation that responded to chemotherapy), PMC11049397 (RBBP6,
a different gene) and PMC4220401 (a case report of the disease in an adult).

## What it says about the model

- **RB1.** Three of the twelve papers are on topic. Two (first wave) compared RB-negative lines or tumours with RB-positive ones and
  found more sensitivity to radiation without RB, the model's direction. One (second wave) knocked RB1 out in the same cells, in
  culture and in mice, and found radioresistance and less apoptosis, the opposite direction, in the only paper where RB1 itself was
  changed. So for RB1 the direction is also contested, and the best-designed test of the three points against the model.
- **PTEN.** Seven of the twelve are on topic: two agree (through senescence, and through impaired repair, not apoptosis; one reports
  senescence in PTEN-deficient cells, a state the model says a damaged cell without PTEN cannot reach), four contradict and one
  finds no difference. The first wave alone was two against two; the second wave added two contradicting papers, both indirect, and
  one without a difference. Where PTEN itself was changed in the same cells, one paper agrees and two contradict. One of the agreeing
  papers cites an earlier study with radioresistance.
- **Neither.** No paper reports apoptosis as the only fate, which none could be expected to. So the finer claim of the model, that
  these losses leave only apoptosis, is not supported by anything read, and the direction it implies is supported by four of the ten
  on-topic papers and contradicted by five. These are counts, not a vote: the cells, the stresses and the way the gene was changed
  differ.
- **What the second wave did.** It moved the picture against the model's direction, mostly through papers with a weak design
  (indirect or patient survival) and one with the strongest (RB1 knocked out). Because it was decided after seeing the first
  wave, the first-wave counts are shown next to the combined ones everywhere.

## Limits

- Twelve papers per gene, picked by a fixed rule, is small, and 14 of the 24 were off topic, which is what the rule does by design
  (it does not replace them). RB1 has only 14 qualifying papers in all, so its second wave reaches nearly the end of the list. For
  PTEN the stored list holds the first 40 hits of the search; many papers beyond rank 12 have titles that look closer to the question
  and were not read. A different query or a different number would give a different set.
- The second wave was decided after the first-wave verdicts were seen. The rule fixed which papers were read, and what was
  decided is listed in Amendment 1, but the decision to read more was not blind to the first results. The `design` field was added
  after the second wave was read, because two of its papers moved the gene only indirectly; it changes no verdict.
- The papers are about cancer cell lines, tumours and one clinical cohort, and about different stresses (radiation alone, radiation
  with a drug). Cell types and the way the gene was changed (knockdown, null line, raised expression, selected subline) differ and are
  noted per paper.
- The papers were read by the assistant, from the abstract and the passages that name the gene together with radiation or an
  outcome. The verdicts are judgements. The 18 quotes can be checked in a minute each, and code has checked that each one occurs in
  its paper; a person has not read the papers.
- Open-access papers with a Creative Commons licence only; the closed literature is not read.
- Nothing here says that either gene is a target worth acting on. It says whether the model's direction is contradicted.
