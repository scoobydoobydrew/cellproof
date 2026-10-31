# Demo video script (3 minutes)

Record from `results/report.html` (open the file in a browser) and a terminal running `make verify`. Everything on screen comes from
cached model outputs, so there is no live-API risk. Numbers below are the ones the page shows at the time of writing; read them off the
page when recording, do not trust this file.

Before recording: the page speaks English and Greek and remembers the last choice (a browser set to Greek opens it in Greek). Press
**EN** in the top bar, then reload once to check. The top-bar moon button switches light and dark for the technical part; the story is
always dark. The story fades each scene in when it comes into view, so scroll a little slower than you talk and give each scene a second
to appear. Do not click while a scene is playing, except where the script says so.

**0:00 to 0:15. The one line (say it over the DNA, three beats loop).**
"Before this week: a published 30-gene model of how a cell responds to DNA damage, open-access papers, and open-source solvers. Built this
week: an agent where Muse Spark reads the papers and proposes rules, and an exact solver decides which ones the model can take."
The header plays "Radiation breaks DNA", "Not every damaged cell dies", "Flip the right genes, and every cell dies". Let it play; do not
read the captions out. Keep the pointer off the header (it stands still while the pointer is over it). Then press **Start the story**.

**0:15 to 1:55. The story (six scenes and a close; about 15 seconds each; one sentence each).**
1. *A tumour is a crowd of cells.* "Radiation hits every cell. In our virtual tumour, a computer simulation, 107 of 1,663 are still alive
   after three days." (Read the exact numbers off the page.)
2. *Inside each cell, genes switch each other on and off.* "A cell is a little circuit. Different switch positions, different fate:
   pause, age, recycle itself, die. Cut the right switches and only death is left."
3. *Too many to try in a lab.* "Which genes? A thousand combinations for two genes, over a million for five, and each one is an
   experiment. Our exact solver tried every one of one or two genes in about five seconds and found eleven that leave only death."
4. *An AI reads. A checker checks.* "The AI reads 36 papers and proposes new links in the circuit. An AI can be wrong with confidence, so
   an exact solver replays ten known experiments before any link is kept: without it, seven or eight break; with it, none."
5. *Back to the virtual tumour.* Click the four buttons in turn: "Radiation only: some survive. One switch the checker picked: none are
   left. A switch it rejected: many survive, so it does not say yes to everything. And a recipe our exact analysis predicted before the
   simulation ran: none left, in all three." Say that two independent engines agree on 22 of 22 cases and that they run the same rules,
   so this checks one against the other, not the biology.
6. *Every tumour has its own genes.* "Each dot is one of 9,896 real tumour samples from public data. We forced each sample's genetic
   changes into the model and asked again. For most samples a recipe still works, but when the gene p53 is lost, none does: between 14 and
   39 of every 100 samples, depending on how strictly we count. Every recipe we found relies on p53." Click the second button to show the
   range. Say once that this is a statement about the model, not about any person.
7. *What this is, and what it isn't.* Read the three cards, quickly: checked exactly, a model of a cell and not of a person, and not better
   than the published model on outcomes it never saw.
Do not say "patient", "therapy", "treatment", "personalised", "proof", "trial", "cure" or "safe" (the second card says "no treatment, no
dose, no medical advice", in the negative, and that is the only place). Say "tumour samples", "recipes", "hypotheses for the lab",
"a model of a cell".

**1:55 to 2:35. The technical part (press **The technical part**, then the bench or the notebook).**
- Bench: press the top-bar **Bench demo** (it plays a 60-second walk-through; show a few seconds): an AI's link breaks three known
  experiments, the AI rewrites it, all ten pass: "the checker decided, not the AI". Mention that the AI once offered a rule that passed
  every test but changed nothing, and the checker refused it as vacuous.
- Evidence: the heat map ("without the solver, 7 to 8 of ten known behaviours break; with it, none") and "47% of the edits taken from papers
  contradict the published model".
- Audit, said straight: "The published model can answer 8 of the 10 scoreable outcomes. In 4 of them it has no stable state, so those
  verdicts are artifacts. On the other 4 it gets 2 right, the same as ignoring the perturbation. So this does not show better prediction.
  It shows where a published model and the literature disagree, and it does so automatically."
- If asked about the literature check: 24 open-access papers, 10 on topic, none reports apoptosis as the only fate, and the model's
  direction for PTEN and RB1 is contested (4 agree, 5 contradict, 1 no difference). If PTEN or RB appears on screen, say it is the model's
  answer, not a recommendation.
- If asked about the first validation of the sequence analysis: it was written before the results, failed for 8 of 23 conditions because
  the two engines mean different things by "dead", and was amended afterwards and labelled as such; the amended one holds on 23 of 23 and
  was then tested out of sample on three recipes (none of 1,663 cells alive). No pair of changes, and no order of the five kinases named in
  the brief, works only in a particular order in this model.

**2:35 to 3:00. Reproducibility and limits.**
- Terminal: `make verify`, which rebuilds every number with no API call.
- Limits, on screen (scroll to **Limits**): ten scoreable held-out claims, written by me and not yet checked by a person; the model's
  repairs can pass the checks without being biologically right; Boolean networks have no dose and no time; no medical claims. "These are
  hypotheses for the lab."
- If the simulator PhysiBoSS and the ChEMBL database, the cBioPortal API and TCGA data appear in the opening line, say that they existed
  before the week and that the translation of the network, the experiments, the checks and the studies are new.
