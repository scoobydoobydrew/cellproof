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
