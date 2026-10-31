# Sequences of interventions: protocol, fixed before any result was computed

Written 2026-10-31, before any code for it was run. The idea comes from Mandon et al. (IEEE/ACM TCBB 2019, "Algorithms for the
Sequential Reprogramming of Boolean Networks", which the project owner supplied): waiting between perturbations lets the
dynamics prepare the ground, so that some outcomes need fewer perturbations, or become reachable at all. This protocol tests that
claim on our one model, with the tools we already have. It is a special case of their framework, not a reimplementation.

Nothing here is a treatment, a schedule or a dose. A hit is a statement about a Boolean model, a hypothesis for the lab.

## The question

The solver's 11 minimal sets say which genes, held on or off, leave apoptosis as the only stable end state of a damaged cell,
whatever state the cell starts in. Two things that analysis ignores:

1. **Where the cell starts.** A real irradiated cell starts healthy. The tissue run showed that from a healthy start only two of
   the four end states are ever reached. An exact, start-aware analysis is therefore a different, weaker condition than "all stable
   states".
2. **When the genes are changed.** If the second change comes after the cell has settled, the cell starts its second journey from
   another place.

Does letting the cell settle between interventions find ways to leave only apoptosis that changing the same genes at once does not?

## Definitions

- **Model:** `data/models/repaired_min2.bnet` (34 nodes), asynchronous updating (one node at a time, every order), the semantics
  of the rest of the project. Everything is computed exactly and symbolically with AEON (forward reachability and attractors), no
  sampling.
- **Literals:** a node held at 0 (knock-out) or at 1 (forced on), for the 23 nodes that are not readouts, the same offer as
  `analysis.interventions.minimal_sets`. DNA damage is on from the start.
- **Start:** the one stable state of the undamaged network, with DNA damage switched on and the first stage's literals set, as in the
  tissue runs (`tissue.maboss.start_state`).
- **Stage:** a set of literals applied together. **Settling:** after a stage, a cell is in an attractor that can be reached from where
  it was; every reachable attractor counts, so cells may end in different ones.
- **Next stage:** the nodes of the new literals are set to their values in every state of the attractors the cells settled in
  (instantly), their rules are replaced by the constants, earlier literals stay, and the cell evolves again.
- **Apoptosis is an end.** A cell that has settled in an apoptosis fixed point (the model's `classify`) is dead and receives no
  later stage, as in the tissue runs where apoptosis commits the cell. Cyclic attractors never count as apoptosis.
- **Hit:** after the last stage, every attractor that a cell can still reach is an apoptosis fixed point, so no cell can survive
  in any fate along any order of updates ("inevitable" in Mandon's word).

Three conditions are computed on the same sets of literals and compared:

| name | condition |
|---|---|
| **H0** | every attractor of the perturbed network, from any start, is an apoptosis fixed point (the solver's meaning, but over all attractors, cycles included) |
| **H1** | one stage, from the healthy start: every reachable attractor is an apoptosis fixed point |
| **H2** | an ordered list of stages, settling in between |

By construction H0 implies H1, and a one-stage H2 is H1; tests check both.

## Searches

- **V, validation against the tissue.** For radiation alone and the 22 sets of `results/tissue`: the end fates the simulation reached
  must be a subset of the fates the exact analysis calls reachable, and where the exact analysis says only apoptosis is reachable,
  fewer than 1% of the cells may be alive at the end of the stored run (the same threshold, fixed before, as the 22-of-22 check).
  A failure is reported as a failure and means the translation, the simulation or this code is wrong.
- **S1, all literals, two literals in all.** Every set of two literals on two different nodes, as one stage (H1) and in both
  orders (H2), and every single literal. A set is *minimal* if no proper subset is a hit under any of the three conditions.
  Reported: the minimal sets under H0, under H1, and the **sequence-only** sets (minimal, not a hit as one stage, a hit in at least
  one order). The H0 sets are compared with the 11 sets of `analysis.interventions.minimal_sets`; any difference is reported.
- **S3, the five kinases named in the project brief** (ATR, CHK1, CHK2, WEE1, DNA-PK), knock-outs only: every subset, every ordered
  list of stages. Reported: whether any is a hit, and if none, what survives in the best case.
- **S2, all nodes, knock-outs only, three literals in all,** only if S1 and S3 are done and the time allows, with the same
  reporting.

## What will be said, whatever the outcome

- Counts, the lists of sets, and for each sequence-only set the fates the cells settled in after each stage.
- If there is no sequence-only set, that is the result: in this model, settling in between adds nothing to what H1 finds.
- If there are, they are hypotheses about this model. They inherit every limit of it: one published network, no dose, no
  kinetics, a healthy start, equal chances for every update, and the findings that every solver set depends on p53 and that the
  literature check does not support the model's direction for PTEN and RB1.
- Not modelled: temporary pulses that are released again, fixed delays, drug kinetics, and the fact that nobody can watch a cell settle.
  "Wait until settled" is an idealisation.
- Nothing is called a schedule, a therapy, a treatment or a proof.

## Amendment 1: a second meaning of "dead", written after the first results were seen

The protocol above was run once as written (the `settled` meaning of dead). Recorded here before anything is changed:

- Radiation alone: all four attractors exist, and from the healthy start exactly two (apoptosis and senescence) can be reached, the
  same two the tissue run reached.
- H0 gives the 11 minimal sets of the solver exactly (the all-attractor reading reproduces the fixed-point search).
- H1 gives 10 minimal sets: nine single literals (the seven of H0 plus Cdc25 forced on and Sirt1 forced on) and one pair
  (AMPK_MAPK KO with CHK1 KO) that H0 does not find. The other four pairs of H0 contain one of the new single literals.
- Sequence-only pairs: none. Of 1,012 pairs, 285 are hits as one stage and 360 in some order, and every pair that is a hit only in
  some order contains a literal that is a hit alone (the first stage already killed every cell). For the five kinases of the brief
  there are 1,081 sequences (every subset, every ordering and splitting into stages) and none is a hit.
- **V1 failed.** Its second criterion held for 23 of 23 conditions, its first (the simulated fates must be attractor fates the exact
  analysis can reach) for 15 of 23. The eight: PTEN KO, TUG1 KO, WWP1 forced on and miR221 forced on show a few senescent cells
  (0.4% to 0.7% alive) at the end of the 72 h run although the only reachable attractor is apoptosis (the earlier 240 h runs of these
  four reach zero, so those cells were still on their way); AKT KO with ATM KO and ATM KO with PTEN forced on have a cycle as their only
  attractor, whose states light the simulation's fate readouts while it turns; BCL2 forced on with TUG1 KO has one unclassified fixed
  point and the simulation shows senescent cells; AKT KO with miR221 KO ends in arrest or autophagy by the exact analysis while the
  simulation also shows dead cells.

The reading of the failure: the simulation reports what a cell passes through, V1 compared it with where cells end, and the two
engines also mean different things by "dead". The simulation commits a cell to death the first time its apoptosis node switches on,
even if the cell would later have left that state; the protocol asked for an apoptosis fixed point. This is a mismatch of
definitions, not a proof that either engine is wrong, but it is also not a pass, and V1 stays reported as it came out.

What is added now, decided with these results in view (so labelled as such):

1. A second meaning, **`visit`**: a cell is dead as soon as it enters any state that `classify` calls apoptosis, and it survives if it
   can reach an attractor with no apoptosis state without touching one. This is what the simulation implements. Every search
   (S1, S3 and V) is run under both meanings and both are reported; the `settled` results are not replaced.
2. **V2**, with the `visit` meaning: the exact analysis says a cell can survive exactly when the share alive at the end of the stored
   run is 1% or more (two-sided, the check of the earlier 22-of-22 comparison), and every fate the simulation shows must be the
   phenotype of some state that is reachable from the start at all (transient states included).
3. **V3**, an out-of-sample test of the exact analysis by the simulation: every set that H1 finds under either meaning and the solver
   does not find (the H1-only sets) is run in the tissue with the settings of the 22 runs. The prediction is the exact one under
   `visit`: no survivor means fewer than 1% alive at 72 h, survivors means 1% or more. It is written down here before the runs.
   Sequences cannot be run in the tissue (the network is fixed for a whole run in this setup); that is a limit, said plainly.

## Results (2026-10-31)

`python -m cellproof.cli sequences` writes `results/sequences.json`; every number below is in `results/RESULTS.md`, computed from it.
Each search was run under both meanings of dead, except S2, which was run under `visit`, the meaning the simulation implements.

- **The start-aware analysis.** Radiation alone has four attractors; from the healthy start only apoptosis and senescence can be
  reached, and a cell can survive in one of them, senescence. Under both meanings H0 reproduces the solver's 11 minimal sets
  exactly. H1 finds 10 minimal sets: nine single literals, the solver's seven plus Cdc25 forced on and Sirt1 forced on, and one pair,
  AMPK_MAPK KO with CHK1 KO. The other four pairs of H0 contain one of the two new single literals.
- **V3 held 3 of 3.** The three sets that H1 finds and the solver does not were run in the tissue (`novel_01` to `novel_03`); the
  prediction, written before, was fewer than 1% alive after 72 h, and none of the 1,663 cells was alive in any of them. Both
  engines run the same Boolean rules, so this checks the translation and the two analyses against each other, not the biology.
- **V1 and V2.** V1 (first criterion, before any result): 15 of 23, failed for the eight conditions listed in Amendment 1; its second
  criterion held for 23 of 23. V2 (added after V1 failed): survival matches the 1% threshold on 23 of 23 and every simulated fate is
  the phenotype of a reachable state on 23 of 23.
- **S1, pairs.** Of the 1,012 pairs of literals on two nodes, 285 are hits as one stage under `settled` and 292 under `visit`; 360 are
  hits in some order under both. 76 (`settled`) and 69 (`visit`) are hits in some order but not as one stage, and every one of them
  contains a literal that is a hit alone. **There is no sequence-only pair under either meaning.** One pair works only at once:
  AMPK_MAPK KO with CHK1 KO, which in either order leaves senescent survivors after its first stage, and the second change does not
  move them (the reverse of the effect Mandon et al. describe).
- **S3, the five kinases of the brief.** 1,081 ordered lists of stages over every subset of ATR, CHK1, CHK2, WEE1 and DNA-PK knocked
  out; none is a hit. They end in no response at all (an unclassified stable state, 808 lists under both meanings), in senescence
  (250 under `settled`, 273 under `visit`) or, under `settled`, in apoptosis or senescence (23).
- **S2, three knock-outs.** 1,122 of the 1,771 sets of three knock-outs on three nodes contain no smaller hit and were searched in
  all 14,586 ordered lists of stages under `visit`: none is a hit, as one stage or in any order.

**What it means.** The solver's question is stricter than the question a healthy irradiated cell poses, and the exact start-aware
analysis finds three more minimal sets that an independent simulation then confirms. In this model, letting the cell settle between
changes adds nothing for pairs, for the five kinases of the brief or for triples of knock-outs, and one pair is hurt by it. That does
not contradict Mandon et al., whose examples are other networks, with temporary perturbations and timing that depends on the state,
which are not modelled here. Nothing here is a schedule, a therapy or a proof; every set is a hypothesis about one model, and the
findings that every set depends on p53 and that the literature check does not support the model's direction for PTEN and RB1 stand.
