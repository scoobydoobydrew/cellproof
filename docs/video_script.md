# Demo video script (3 minutes)

Record from `results/report.html` (open the file in a browser) and a terminal running `make verify`. Everything on screen comes from
cached model outputs, so there is no live-API risk. Numbers below are the ones the page shows at the time of writing; read them off the
page when recording, do not trust this file.

Before recording: the page speaks English and Greek and remembers the last choice (a browser set to Greek opens it in Greek). Press
**EN** in the top bar, then reload once to check. The header loops eight beats of about ten seconds each (about 80 seconds in all) and
stands still while the pointer is over its words or pictures; the little bars under the words jump to any beat, so for a three-minute
video click the bars instead of waiting for the loop. The search engine starts by itself when it scrolls into view.

**0:00 to 0:15. The one line (say it over the DNA, beat 1).**
"Before this week: a published 30-gene model of how a cell responds to DNA damage, open-access papers, and open-source solvers. Built this
week: an agent where Muse Spark reads the papers and proposes rules, and an exact solver decides which ones the model can take."
Keep the pointer off the header while the first beat plays.

**0:15 to 0:50. The problem, in the header (click the bars: 2, 3, 5, 4, 6; about 6 seconds each, one sentence each).**
2. *Not every damaged cell dies.* "After radiation a cell can pause, age, recycle itself or die."
3. *Flip the right genes, and every cell dies.* "The goal: a combination of genes to switch off or on, so that only death is left."
5. *Which combination? The search explodes.* "Every combination is a lab experiment. Our solver tried all 1,058 changes of one or two genes in a
   few seconds. For five genes at once it is over a million." (Read the numbers off the counter.)
4. *New rules change which genes to flip.* "And papers keep adding rules. Eleven new rules from 36 papers, unchecked, replaced all eleven
   combinations that worked."
6. *The AI proposes. The solver decides.* "The AI alone finds four of the eleven and breaks seven or eight known experiments; the solver alone
   cannot read the papers; together, none are broken."

**0:50 to 1:10. The virtual tumour and the tumour samples (bars 7 and 8).**
7. "A virtual tumour: a real simulation of 1,663 cells. Radiation alone leaves 107 alive. With one of the solver's candidates: none."
8. "Every tumour has its own genes. We asked the model again for 9,896 real tumour samples from public data. For between 14 and 39 of every 100,
   p53 is lost, depending on how strictly we count, and then none of our candidates works." Say once that this is a statement about the
   model, not about any person.

**1:10 to 2:10. The demo (press *Play the demo*; it runs about 90 seconds; show the first 60 and the end, or press Escape to stop).**
- An AI reads 36 papers and proposes a link; an exact checker replays ten experiments with known results; three come out wrong; the AI
  rewrites the link; all ten pass: "the checker decided, not the AI". Mention that the AI once offered a rule that passed every test but
  changed nothing, and the checker refused it as vacuous.
- The honest limit, said straight (it is in the caption): "On outcomes from papers the AI never read, the model is no better than before."
- The virtual tumour: radiation alone, then the solver's candidate: no cell is left, and the simulation agrees with the solver on 22 of 22 sets.
  Say that the two engines run the same rules, so this checks one against the other, not the biology.
- The last caption: "Every tumour has its own genes. Where p53 is lost, none of the candidates works."

**2:10 to 2:40. The search engine (scroll to *Search*; it plays by itself).**
"This is the solver's whole search on one board: 23 genes, each switched off in red or on in green, and a line for every set it tried, 1,058
in all. Eleven glow: they leave only death and nothing smaller does." Click **p53 lost**: "Now the same search in a tumour where p53 is
lost: 968 sets tried, none leaves only death." Click **WIP1 high**: "Another profile, one different answer." Click a result's **Dish** or
**Tumour** button to show it opening in the demo. Do not say "patient", "therapy", "treatment", "personalised", "proof", "trial", "cure" or "safe"
(the page says "no treatment, no dose, no medical advice" in the negative, and that is the only place). Say "tumour samples", "candidates",
"hypotheses for the lab", "a model of a cell".

**2:40 to 3:00. Reproducibility and limits.**
- Terminal: `make verify`, which rebuilds every number with no API call.
- Limits, on screen (scroll to **Limits**): ten scoreable held-out claims, written by me and not yet checked by a person; the model's repairs
  can pass the checks without being biologically right; Boolean networks have no dose and no time; no medical claims. "These are hypotheses
  for the lab."
- If the simulator PhysiBoSS, the ChEMBL database, the cBioPortal API and TCGA data appear in the opening line, say that they existed before
  the week and that the translation of the network, the experiments, the checks, the board and the studies are new.

**If asked afterwards**
- The audit: "The published model can answer 8 of the 10 scoreable outcomes. In 4 of them it has no stable state, so those verdicts are
  artifacts. On the other 4 it gets 2 right, the same as ignoring the perturbation. So this does not show better prediction. It shows where
  a published model and the literature disagree, and it does so automatically."
- The literature check: 24 open-access papers, 10 on topic, none reports apoptosis as the only fate, and the model's direction for PTEN and RB1 is
  contested (4 agree, 5 contradict, 1 no difference). The search engine says PTEN loss, RB loss and MYC gain need no extra change in the model;
  that is the model's answer, not a recommendation.
- The first validation of the sequence analysis: it was written before the results, failed for 8 of 23 conditions because the two engines
  mean different things by "dead", and was amended afterwards and labelled as such; the amended one holds on 23 of 23 and was then tested out of
  sample on three recipes (none of 1,663 cells alive). No pair of changes, and no order of the five kinases named in the brief, works only in a
  particular order in this model.
