# Limitations, stated plainly

This is a research prototype that ranks hypotheses for lab testing. It makes no clinical claim and gives no medical advice.

**The model**
- A Boolean network is a discrete abstraction of continuous, stochastic biology. It has no dose, no time course and no
  frequencies: a phenotype is present or absent. Claims that a cell line was "reduced by 24%" cannot be tested and are not scored.
- There is one base model (Gupta et al. 2023, 30 nodes). Everything here depends on it, including its own choices (for
  example, the paper contradicts itself about PUMA in the apoptosis readout; we follow Section 3.2, which is a choice).
- The new nodes (ATR, CHK1, CHK2, DNA-PK) were chosen by a mechanical rule from the corpus, not by a biologist, and are
  wired by the conventions of `formalize/edits.py` (an extra activator is OR-ed in, an inhibitor is AND-NOT-ed in). Those are
  modelling conventions, not facts. With redundant activators the model tends to predict "no effect" for a single kinase, whatever the
  papers say about dominance in a given cell line.

**The evidence**
- Claims are extracted by a language model. A quote that is found verbatim in the paper shows that the model copied faithfully,
  not that it read correctly. Extraction accuracy (M4) needs a human to label 50 claims and had not been done when this was written.
- The corpus is 36 open-access papers chosen by topic and citation count, many of them not about the DNA damage response in
  human cells. Some report experiments similar to the held-out ones in other cell lines.
- Literature can be inconsistent, incomplete or specific to a cell type; the model has one context.

**Papers you add**
- A PDF you drop is read from its text layer by `pypdf`; scans, encrypted files and figures are not read, and the reading order of columns
  and tables can be wrong. Its claims are drawn only if their quote is found word for word in that text. Details: `docs/own_papers.md`.
- Most links in any paper are about genes that the model does not have (489 of the 679 links drawn, `results/RESULTS.md`). They are drawn grey, "outside the model",
  and not judged. A dropped paper changes no number of the report; adding its accepted links to a model would, and is not done.
- The text of a dropped paper is sent to the Meta Model API. Whoever drops it is responsible for being allowed to process it; its PDF, quotes
  and replies stay in `data/user_papers/` (git-ignored) and are never published.

**The pictures**
- The tissue simulation holds tumour cells of one kind only. Radiation also reaches the normal tissue around a tumour, and the tolerance of that
  tissue limits the dose (Scaife et al. 2015, Br J Radiol, PMC4628540, CC BY 4.0, cited on the page); no normal tissue is modelled here.
  "Only death" is the goal we state for the model's cells because a cell that pauses or ages is still alive; it is not a claim about treatment.
- The virtual tumour (header and demo) replays the frames that PhysiBoSS wrote; the dots of the tumour samples (header) are public
  counts, one dot per sample, in no order that means anything; the ring of genes in the search engine draws the solver's verdict on each
  set, and the profiles are single forced genes, not whole tumours (`docs/search_board.md`). All three are statements about a model.
- The DNA at the top of the page, its story (the dish of cells, the field of dots) and, on the bench, the dish and the cell with its
  membrane are illustrations. The helix is not structure data: shapes, colours and the way they sit are decoration. The dots
  in the story are one per set of one or two changes that the solver tried; their positions are arbitrary, only their number
  and the number that stay lit are real, and the seconds shown are the time the solver took on the machine that built the page.
  "Not every damaged cell dies" is what the published model's stable states say (the four fates are all reachable), not a
  measurement on real cells. "Each one is a lab experiment" is about how a candidate would have to be tested; no lab time or
  cost is claimed anywhere. The one sentence about radiotherapy is a quotation (Bridges et al. 2011), given as context. What the bench shows
  comes from the solver: which fates the circuit allows, whether it settles at all, which fate the paper does not expect,
  which genes are on in a stable state. The number, size and position of the cells, the proportion of each fate (the model
  gives possibilities, not percentages) and the purple cell around the network are not data.
- The "hunt" lists every set of one or two changes (readout genes excluded) that leaves only death in the model. Those are
  hypotheses about the model; two of them (TUG1 knocked out, miR-221 forced on) are what the base paper itself reports.

**The difficulty, and what the header does and does not claim**
- "Controlling a Boolean network is NP-hard in general" is a result of Akutsu, Hayashida, Ching and Ng (J Theor Biol 2007;244:670-679,
  doi 10.1016/j.jtbi.2006.09.023): finding a control strategy that leads to a desired global state is NP-hard, and stays so for
  restricted network structures. Our task (sets of at most two changes after which every stable state is apoptosis) is a relative
  of that problem, not the same one; we cite the general result and claim no complexity class for this exact variant. Sedghamiz et
  al. (Front Physiol 2019;10:241, CC BY) write that finding intervention sets exhaustively is feasible on small networks and
  difficult on larger ones, which is the situation here.
- The header does **not** say that a solver alone cannot solve this model: the exhaustive search over all of its sets of up to two
  changes takes seconds. It shows how the count grows with the number of genes changed at once (sets of up to 3, 4 and 5 changes,
  counted by the same enumeration as the search) and what that would cost at the speed measured for up to two changes. Those
  times are projections ("projected" on the page), not measurements; the one we could check, sets of up to three changes, took 57 s
  measured against 66 s projected (the search skips supersets of sets already found, so the projection errs on the high side).
  What a solver alone cannot do is read the papers: the published model lacks ATR, CHK1, CHK2 and DNA-PK, which the literature
  knows. M6 measures a different limit: on random networks the exact checker timed out at 30 s from 50 nodes up (one of three
  seeds at 50, all at 100 and more), while networks shaped like the published one scaled to 400 nodes in about 12 s.
- "New rules change which genes to flip" (header beat 4) replays two runs of the pipeline edit by edit, from the published model
  (`results/augment_naive_min2.json`: every edit applied unchecked; `results/augment_repaired_min2.json`: each edit checked, and
  repaired when rejected), in the order the run applied them (strongest evidence first). Each edit is a rule, and the link it adds
  is found by comparing the network's influences before and after it (`report/data.py`, `replay`); each unchecked edit adds one.
  After every edit the solver asks, for each of the 11 sets of the published list, whether the damaged network still ends in
  apoptosis only; a dot goes out at the edit after which its set stops doing so, and the number under the dots is how many still
  do. The count is cumulative: the edit named is where the list changes, not necessarily its only cause (the edits before it are
  in the model too). In this run two edits change the list (the 4th, ATR to ATM/γH2AX, takes 11 down to 5, and the 8th, "p53
  requires p21", takes 5 down to 0); the others change nothing and the picture lets them stream by. The three other dots that
  appear at the end are the unchecked model's own list after the exhaustive search (`naive_min2`: 3 sets, none of them in the
  published list), and the unchecked model breaks 8 of the 10 known experiments (the verification matrix), so what it says is
  what a broken model says, not a candidate. In the checked run the 8th edit is rejected, three are repaired (a repaired rule
  adds the same link, and in one case a second one, but its logic differs: the picture shows links, not logic), and the list
  stays at 11 after every edit. It is one extraction run and one set of edits (edges supported by at least two papers): "replaced
  all of the published combinations" describes this set, and another set of unchecked edits can leave some of them. The small
  network shows the genes that the edits touch and the published links between them (`net` in the data), not the whole model;
  where the genes sit is illustration. The card names the first paper that supports the edge (PMC id) and how many papers do.
- Of the 11 shortlisted sets, three are knock-outs (PTEN, RB, TUG1); the other eight force a gene on, and all four pairs include
  one forced-on gene. The header therefore says "switch off, or on", not "switch off".
- The AI alone was measured on the search itself, and it did **not** fail at it (`python -m cellproof.cli search-baseline`; results in
  `results/llm_search_minimal.json` and `results/RESULTS.md`). Muse Spark, without tools, reasoning effort minimal, was asked three
  times (the rules shown in a different order each time) for ten sets of one or two changes that leave only apoptosis. Of the 17
  distinct sets it named, 13 (76%) leave only apoptosis, where a set picked at random from the 1,058 candidates does so 21% of the
  time; the first guess of every request was right; and 4 of the 11 shortlisted sets were among them. So the header does not say
  that the AI fails. It says what was measured: the AI is often right here and nothing checks it (4 of the 17 guesses were wrong),
  it found fewer than half of the candidates, and its edits to the model, applied without the solver, break 7 or 8 of the 10 known
  experiments (M2). Limits of this measurement: three requests, one model, one effort (counts, not a statistic). Low, medium and
  high effort were tried first and one request at each did not return within 7 to 15 minutes, and the API also stalled some requests
  at minimal effort; two further requests (seeds 3 and 4) were stopped after repeated stalls and are not counted, so the model's
  best shot is not measured. A request that runs out of its 12,000-token budget would be reported and not counted as wrong (none
  did). The cost of requests that never returned is not in the cost table, which is therefore a lower bound.

**The solver and the loop**
- The solver catches contradictions with the ten verification cases (and the G2 regression), not every error. Those cases
  come from the same paper as the base model, so they test that augmentation does not break what that paper reports.
- A rule can pass the cases by being gated so that its new term is never true where the cases look. The loop therefore
  refuses a repair that changes no prediction in a small panel of scenarios ("vacuous"), but passing the panel is still not
  evidence that the rule is biologically right. Accepted means "consistent with the checks", nothing more.
- Edits are applied one at a time in a fixed order; a different order can give a different network.

**The evaluation**
- The held-out set has 23 claims, 10 of them scoreable. That is far too few for a statistic, so results are counts per claim.
- Most radiosensitisation results are about survival, which this network cannot express; that is a finding about the approach.
- The set was written by the assistant from papers it chose, knowing the base rules. Per-claim reporting and a no-information
  baseline are the guard. A human has not yet checked that each quote supports its claim (D4); until then all M1 numbers are provisional.
- No claim in the held-out set tests the DNA-PK node.
- Scaling (M6) was measured on synthetic networks and on cascades added to the base network; no larger published model was tried.

**The tissue what-if and the chemistry step (extension, `docs/downstream_notes.md`)**
- The tissue is many independent cells: the network has no input from neighbours, so no signal, bystander effect or gradient is
  modelled, and the cells neither divide nor move. It counts deaths and fates.
- An intervention is a gene fixed on or off from the first minute. No drug, dose, uptake or timing is modelled, so the
  simulation cannot say how any compound would act. "Proving that a therapy kills a tumour and spares healthy tissue" is
  something this model cannot show and the project does not claim.
- Time is a choice (one model time unit is one hour) and every gene flips at the same rate. Under those rates a healthy,
  irradiated cell reaches only two of the model's four stable end states (apoptosis and senescence); the other two appear only
  under some interventions. Other rates could change the shares.
- Each condition is one stochastic realisation. With 1,663 cells a share has a binomial error of up to about 1.2 percentage
  points. A rerun with the same seed reproduced 23 of 24 conditions exactly; the variant with a finite apoptosis rate
  differed by one cell (PhysiCell draws random numbers in parallel loops).
- There is no mutation process, so nothing is said about secondary cancers, and no tumour-versus-healthy comparison is made.
- The agreement between the simulation and the exact solver uses a threshold fixed in advance (fewer than 1% of the cells
  alive after 72 h for an accepted set). It checks the translation and the search against each other; it is not a validation of
  the biology.
- The chemistry counts are ChEMBL records of one release (ChEMBL_37, queried 2026-10-31); a compound missing there may exist
  elsewhere. pChEMBL mixes IC50, Ki, Kd and EC50 and assays of different kinds; the flag for assays that mention
  phosphorylation is a text match on the assay description, not a classification (for RB1 it marks all six strong records, and each
  says that RB1 phosphorylation was inhibited in cells; for a kinase it may mark a substrate's phosphorylation instead).
- TUG1 is a non-coding RNA in the base model, while HGNC now lists a protein-coding gene of that name. The model's own annotation
  was followed and the disagreement is written next to the target.
- Every one of the solver's sets depends on p53: with p53 knocked out, none leaves only apoptosis and a damaged cell has no stable
  state at all (`with_p53_lost` in `results/targets.json`). Nothing here says what would happen in a cell without p53.
- PTEN and RB are named by the model as genes whose loss leaves only apoptosis after damage. A reading of 24 open-access papers in two
  waves of six per gene under a fixed protocol (`docs/literature_check.md`; read by the assistant, not yet by a person; the second wave
  was decided after the first results) found 10 on topic: four in the model's direction, five against it and one without a difference.
  For RB1 the one paper that knocked RB1 out went against the model; for PTEN two agree (through senescence and repair, not apoptosis)
  and four contradict. No paper reports apoptosis as the only fate. Twelve papers per gene, of which more than half were off topic, is a
  small sample.
- The start-aware and sequential analysis (`docs/sequential_protocol.md`) is exact for one model and one start (the healthy cell at
  the moment of irradiation, every update order allowed). It has two meanings of "dead" because the first, written before any result,
  failed its check against the tissue for 8 of 23 conditions (the simulation commits a cell to death the first time it touches an
  apoptosis state; the protocol asked for a settled apoptosis state). The second meaning, which the simulation implements, agrees
  with it on all 23, but it was added after seeing the failure and is labelled so. It was then tested out of sample: three sets
  that only it finds, predicted before the runs, left no cell alive in the tissue. Both engines run the same Boolean rules, so this
  checks the two analyses against each other and not the biology.
- Sequences here are permanent changes made one after the other, with the cell left to settle in between. Changes that are released
  again, fixed delays, drug kinetics and the fact that nobody can watch a cell settle are not modelled, so a negative result on
  sequences is a statement about this restricted kind of sequence in this model, not about Mandon et al.'s method in general.
- One of the three sets only the start-aware analysis finds is AMPK_MAPK KO with CHK1 KO. The node AMPK_MAPK merges two entities of
  the base model, so there is no single protein to inhibit, and no chemistry was looked up for it.
- The genotype study (`docs/genotype_protocol.md`) forces only the 22 nodes that stand for one protein-coding gene, by a rule that
  ignores missense changes and expression, on public tumour counts that are mixtures of cells and not about any person. TP53 loss is
  14.2% under the narrow rule and 38.6% under the broad one, which shows how much the rule decides. Where the model says a genotype
  needs no change (PTEN or RB1 lost), the literature check does not support the model's direction for those genes.
