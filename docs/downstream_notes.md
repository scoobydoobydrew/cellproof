# From the solver's answers to a tissue and to chemistry

Status 2026-10-31. Added after the core pipeline (read, propose, verify, repair, audit, search), as a timeboxed extension. It is
not part of the main claim, and nothing in it is a clinical statement: no patient, no efficacy, no safety, no "trial".
Every number below is produced by a script in this repository; `results/RESULTS.md` holds the current values and this file
says where they come from and what they do not mean.

The question behind it: the solver says which genes, switched off or on, leave only apoptosis in the model. Two natural
follow-ups are "does that hold when the cell is one of many?" and "could a drug do it?". Both were tried; the first gives a
useful second check of the solver, the second stops at its first step, and the reason is a finding.

## 1. The tissue what-if (PhysiBoSS)

**What runs.** PhysiBoSS 2.2.3 (BSD 3-Clause; an add-on of PhysiCell that gives each cell a MaBoSS Boolean network), built by
`scripts/physiboss_setup.sh` into `~/cellproof_external` (WSL), outside this repository. Our part is small: the translation of
the network (`src/cellproof/tissue/maboss.py`), a settings file patched from PhysiBoSS's own cell-lines sample
(`project.py`), two overlay files of C++ (`physiboss/custom.cpp`, `custom.h`), a runner (`run.py`), a parser for the output
(`frames.py`, standard library only) and the experiments (`experiments.py`). Run with `python -m cellproof.cli tissue`; `make
verify` only reads the stored results (`results/tissue/*.json`).

**The translation.** Every node keeps its rule word for word and flips at one rate whenever its rule disagrees with its state
(asynchronous updating, the semantics whose fixed points the exact checker finds). A knock-out or a forced gene is the rule
replaced by the constant, exactly as `analysis.attractors.perturb` does. PhysiBoSS can connect one node, not a pattern of
nodes, to a behaviour of the cell, so the four damaged fates are four extra output nodes that only read the network; a test
checks that each is on exactly when `network.phenotypes.classify` names that fate, on every stable state of every
intervention of the search and on thousands of random states. The apoptosis node drives the cell's apoptosis rate, and each
fate node sets a flag in the cell's data, so every snapshot says what each cell has become.

**Conditions.** A disc of 1,663 cells, irradiated at time 0 (DNA damage on, every other gene where a healthy cell has it),
each condition with its own seed: radiation alone; the 11 sets the exact solver found (hits); 11 sets of the same size that the
solver rejects, drawn with a fixed seed (misses); radiation alone with two other apoptosis rates; and the 11 hits run to 240 h.

**Assumptions, all of them choices and none a measurement.**
- Time: one model time unit is one hour (`scaling` = 60 minutes). Every gene flips at rate 1 and the output nodes at rate 20.
  Only the order of events and the final states are meant; the hours are not.
- Apoptosis: while the apoptosis node is on, the cell's apoptosis rate is 10^6 per minute (the cell is committed at the next
  step, as in the PhysiBoSS samples). Two other rates (one per model time unit, and ten times slower) were run on the same
  tissue; see the table for what changes (almost nothing).
- Cells do not divide, move or signal to each other. The network has no input from neighbours. So the tissue is many
  independent cells, and what it adds to the exact analysis is the timing and the count, not new biology.
- An intervention is a gene fixed from the first minute in every cell. No drug, dose, uptake or timing is modelled.
- Equal rates and the healthy start are the only dynamics: other rates could reach other end states.

**Checks that were made, and what each shows.**
1. The rules and the fate nodes equal the network and `classify` (tests in `tests/test_tissue_maboss.py`).
2. An independent plain-Python implementation of the same asynchronous rule (no MaBoSS, no PhysiBoSS, no agents) reaches the same end
   states, in about the same shares, as the stored simulation of the radiation-only tissue (`tests/test_tissue_results.py`). This
   checks the translation and the engine, not the biology.
3. The simulation and the exact solver agree on every set: each of the solver's hits leaves fewer than 1% of the cells alive
   after 72 h, each of the misses at least 1%. That threshold was fixed before the runs (`AGREE_BELOW` in `report/data.py`).
4. The hits that still hold a few cells at 72 h were run to 240 h: all reach zero. They were slow, not stuck. The exact
   solver says where cells end, not how fast, and the simulation shows the speed.
5. The same seed reproduces a run exactly (23 of the 24 conditions that were run twice were identical at every snapshot).
   The exception is a variant with a finite apoptosis rate, which differed by one cell; PhysiCell draws random numbers in
   parallel loops, so a rerun can differ by a cell or two there. The committed results are one realisation each.

**Findings worth saying.**
- Under radiation alone a few cells survive, and every survivor is in senescence. The model has four stable end states
  (arrest, senescence, autophagy, apoptosis), but a healthy cell under equal rates reaches only two of them, here and in the plain
  simulation, and exact reachability from the healthy start (section 4) says the same: only apoptosis and senescence can be reached
  at all. The other two appear only under some interventions among the misses. So "a damaged cell can pause, age, recycle
  itself or die" is true of the model's stable states; it is not true of what happens to most cells.
- The fate mix hardly depends on the apoptosis rate over three orders of magnitude.
- Misses behave as the solver says they would: some leave about as many cells as radiation alone, some leave most or all.
  Knocking out ATM stops the damage response from starting at all.

**Not shown.** No signalling between cells (PhysiBoSS can model it; this network does not use it), no diffusing drug, no
division, no mutations (so nothing at all about secondary cancers, and no healthy-versus-tumour comparison), no dose. The
earlier idea of "proving that a therapy kills a tumour and spares healthy tissue" cannot be supported by this model and is not
claimed anywhere.

## 2. From a target to measured chemistry (ChEMBL)

`python -m cellproof.cli targets` turns the 11 sets into a list of targets (`results/targets.json`): for each literal, whether
the gene must be switched off or on, what the node is (decided by the base model's own annotation; HGNC's classification is
written next to it when it differs, as it does for TUG1), its HGNC id and UniProt accession, and whether the set leaves only
apoptosis in the published, the unchecked and the checked model. `python -m cellproof.cli compounds` then asks ChEMBL, for
each protein the solver would have to inhibit and for the DNA damage response kinases the project brief names (ATR, CHK1, CHK2,
WEE1, DNA-PK), how many measured activity records there are at 10, 1 and 0.1 micromolar and which records are the most potent.
Nothing is predicted. `results/compounds.json` is the snapshot (it needs the network to be made, not to be read).

**What it found.**
- Only three of the 11 sets are knock-outs (PTEN, RB, TUG1); the other eight need a gene switched on, which inhibitor data
  cannot say anything about. Allowing up to three knock-outs at once adds no further set (`tests/test_targets.py`).
- Every set depends on p53. With p53 knocked out, a damaged cell has no stable state at all in this model (the network oscillates), and
  none of the 11 sets leaves only apoptosis: some have no stable state, the others one that matches none of the four fates
  (`with_p53_lost` in `results/targets.json`, counted in `results/RESULTS.md`). The answers are statements about cells that have p53;
  the exact analysis says nothing about cells that lack it, and the held-out set contains p53-null lines.
- TUG1 is a non-coding RNA in the model (HGNC now also lists a protein-coding gene of that name): the node stands for the RNA, not
  for a protein a compound could bind. That leaves two proteins, PTEN and RB1.
- For those two, ChEMBL holds almost nothing a drug-affinity model could learn from (counts in `results/RESULTS.md`), and for
  RB1 the records are not about binding at all: their assay descriptions say that phosphorylation of RB1 was inhibited in cells,
  which is a readout filed under the readout protein (and ChEMBL's own assay type for all six is B, binding). A model trained on
  such records would label kinase inhibitors as binders of RB1. The code counts these records and flags them; it does not
  filter them out silently.
- The kinases the brief names have thousands of records each, and the model does not say that knocking any of them out alone
  leaves only apoptosis (the table in `results/RESULTS.md` gives what it does say). So where the solver points there is no
  chemistry, and where the chemistry is the solver does not point, with one exception that appeared later (section 4): the start-aware
  analysis finds CHK1 knocked out together with AMPK_MAPK, a node that merges two entities and has no single protein to inhibit.

**Why no drug-affinity model (MSF-DTA or another) was run.** (a) The MSF-DTA paper (Ma et al., IEEE JBHI 2023) has no public
code or weights that could be found, and a reimplementation from an abstract would not be MSF-DTA. (b) A model of drug-target
affinity needs a target with measured binders; the solver's own targets have none, so any score would be an extrapolation
with nothing to check it against. (c) Affinity is not efficacy or safety. (d) DrugBank, the database the idea suggested,
needs an application and may not be redistributed. The interface is plain, though: `results/targets.json` carries UniProt
accessions, so a model that takes a protein sequence or accession can be attached when there is a target worth giving it.

## 3. What this changes in how the project is described

The honest summary is that the solver's answers survive a second, independent engine, and that they do not lead to a drug.
That is a result about this one published model, not about biology: the sets are statements about a Boolean abstraction, and
whether any is real is for the lab. PTEN and RB are named in the model as genes whose loss leaves only apoptosis after
damage. A reading of the literature under a fixed protocol (`docs/literature_check.md`: 24 open-access papers in two waves of six per
gene, the second wave decided after the first results; 10 on topic) found that no paper reports apoptosis as the only fate, and that
the direction itself is contested: four of the ten agree with the model's direction, five contradict it and one shows no difference.
For RB1 the two papers that agree compared lines or tumours, while the only paper in which RB1 itself was knocked out found
radioresistance and less apoptosis; for PTEN two papers agree (through senescence and impaired repair, not apoptosis) and four
contradict. The first wave alone had been two against two for PTEN and two for the model's direction for RB1; the second moved the
picture, and the first-wave counts are kept next to the combined ones. So the finer claim of the model is not supported, and nothing
about either gene as a target should be said outside this repository beyond that.

## 4. Does the order of the changes matter? (`docs/sequential_protocol.md`)

The idea is Mandon et al. (IEEE/ACM TCBB 2019): waiting between perturbations lets the dynamics prepare the ground. The protocol was
written before any result and committed; Amendment 1, written after the first results, is in the same file. The code is
`src/cellproof/analysis/sequential.py` (exact forward reachability and attractors with AEON; a special case of their framework, not
their tool) and `sequence_search.py`; `python -m cellproof.cli sequences` writes `results/sequences.json`.

**Findings.**
- From a healthy cell at the moment of irradiation only two of the four stable states can be reached (apoptosis, senescence), and a
  cell can survive in one (senescence). That is the tissue run's finding, now exact. The solver's question (all attractors, from any
  start) is stricter; its 11 minimal sets are reproduced exactly by the all-attractor reading.
- The start-aware reading finds three more minimal sets: AMPK_MAPK KO with CHK1 KO, Cdc25 forced on, Sirt1 forced on. This was
  predicted before they were simulated, and in the tissue none of 1,663 cells was alive after 72 h in each (V3). Both engines run the
  same Boolean rules, so this checks the translation and the two analyses against each other, not the biology.
- **Sequences find nothing new.** Of 1,012 pairs of changes none works only in a particular order: every pair that works in some
  order but not at once contains a change that works alone (the first stage already left no cell alive). None of the 1,081 orders
  and groupings of the five kinases named in the brief (ATR, CHK1, CHK2, WEE1, DNA-PK knocked out) leaves only apoptosis; they end
  in no response at all (an unclassified stable state) or in senescence. Of the 1,771 sets of three knock-outs on three nodes, 1,122 contain no smaller set that already works; all 14,586 ways of applying them (at once, or in any order and grouping into stages) were searched under the meaning the simulation implements, and none leaves only apoptosis.
- **Ordering can also hurt.** One pair works only when both changes are made at once (AMPK_MAPK KO with CHK1 KO): in either order the first change leaves cells that settle in senescence, a stable state, and the second no longer moves them. In this model a later change cannot reach a cell that has already settled in senescence, so the only sequences that could matter act before the cells commit.
- **The first validation failed.** V1, written before any result, held for 15 of 23 tissue conditions, because the simulation commits
  a cell to death the first time it touches an apoptosis state while the protocol asked for a settled apoptosis state. V2, with the
  simulation's meaning, was added after seeing that and holds for 23 of 23; V3 is its out-of-sample test. Both are reported.

**Limits.** Permanent changes made one after the other with the cell left to settle in between; no changes that are released again,
no fixed delays, no kinetics, and nobody can watch a cell settle. A negative result here is about that restricted kind of sequence
in this model.

## 5. Tumour genotypes as constraints on the model (`docs/genotype_protocol.md`)

The idea is Montagud et al. (eLife 2022): force the nodes of altered genes to tailor a Boolean model to a sample. Only the discrete
part is done, by a rule fixed before any outcome (deleted or truncated: off; high-level amplification: on; everything else ignored;
R2 also counts every protein-changing TP53 mutation as a loss, as a bound), on 9,896 TCGA PanCancer Atlas tumour samples from the
cBioPortal API. Only counts of signatures are stored. `python -m cellproof.cli genotypes [--fetch]` writes `results/genotypes.json`.

**Findings.** TP53 is lost in 14.2% (R1) to 38.6% (R2) of the samples, and for none of them does any of the 11 sets leave only
apoptosis; for the 20 most frequent genotypes of each rule no set of up to two changes does either where TP53 is lost. With TP53
intact each set works in about 95% to 96.5% of the samples (one in 80.4%). In 17.6% of the samples (R1) the genotype alone already
leaves only apoptosis in the model (PTEN lost, RB1 lost, MYC or E2F1 amplified): the model's answer for exactly the two genes the
literature check does not support. For PPM1D amplified none of the 11 sets works and one other set does (Cdc25 on with Sirt1 off).

**Limits.** 22 of the 34 nodes can carry a genotype; missense effects and expression are ignored; the model is one DNA damage
network, not a model of any of the 32 cancer types; a bulk sample is a mixture of cells. It is a statement about how the model's
answers depend on genotype, never about a person.

## 6. Reproduce

```bash
bash scripts/physiboss_setup.sh          # once, in WSL or Linux: clones and builds PhysiBoSS v2.2.3 (outside the repository)
python -m cellproof.cli tissue           # runs the conditions (about 30 minutes on 22 cores), writes results/tissue/
python -m cellproof.cli targets          # results/targets.json (HGNC, cached)
python -m cellproof.cli compounds        # results/compounds.json (ChEMBL; needs the network)
python -m cellproof.cli sequences        # results/sequences.json (exact, tens of minutes on several cores; no network)
python -m cellproof.cli genotypes --fetch   # data/genotypes (cBioPortal, needs the network) and results/genotypes.json; without --fetch only the second
python -m cellproof.cli verify           # rebuilds every table, including these, from the stored files
```
