# Demo video script (3 minutes)

The page performs the video by itself. You start the recorder, press one button, and talk. Everything on screen comes from cached model
outputs, so there is no live-API risk. Numbers below are the ones the page shows at the time of writing; the captions on the page are read
from the same data, so read the numbers off the page, do not trust this file.

## How to record

1. Build the page: `python -m cellproof.cli report` (or `make verify`). Open `results/report.html#video` in a browser at 1920x1080 (full
   screen, F11), in English (**EN** in the top bar; the page remembers it). Close other tabs and notifications.
2. Start the screen recorder (OBS or the system recorder) with your microphone. Press **Start the take** (or Space), then take your hands off
   the mouse and move the pointer off the window: the page hides the top bar and the buttons, shows 3, 2, 1, and performs the take.
   Esc stops it at any point.
3. The take lasts about 2 minutes 39 seconds (after the countdown) and ends on the page's three closing cards (what this is and is not). Then record the terminal on its own for
   10 to 12 seconds: `make verify` (or run it before and scroll the output). Cut the countdown and join the two parts.
4. The take is deterministic: if you stumble over a sentence, record the whole take again. Read the script below at a calm pace; the
   gaps between shots are the pauses.

Each beat from the second on opens with a question on screen ("So, what do we do?", "So how do we choose between them all?"); say it or let the headline answer it. A still closing card is at `report.html#card`: record it for the last four seconds after the terminal. Captions stay on screen at the opening, in the search engine and at the limits, for anyone who watches without sound. The rest of the
words are the page's own.

## The take (seconds counted from the end of the countdown)

| time | on screen | say (about 2.5 words a second) |
|---|---|---|
| 0:00 | DNA and a ray; the caption states what pre-existed and what was built | "Before this week: a published thirty-gene model of how a cell responds to DNA damage, open papers, and open-source solvers. Built this week: an agent where Muse Spark reads papers and proposes rules, and an exact solver decides." |
| 0:14 | *Not every damaged cell dies* | "After radiation a cell can pause, age, recycle itself, or die." |
| 0:20 | *Flip the right genes, and every cell dies* | "The goal: switch a few genes, off or on, so that only death is left." |
| 0:27 | *New rules change which genes to flip* | "And when a new paper comes out? Papers keep adding rules. Eleven new rules from thirty-six papers, unchecked, replaced every combination that worked." |
| 0:36 | *The search explodes* (the counter runs to over a million) | "How many combinations is that? Every one is a lab experiment. For one or two genes there are about a thousand. For five at once, over a million." |
| 0:46 | *The AI proposes. The solver decides.* | "So the AI proposes and the solver decides. Alone, the AI breaks seven or eight known experiments. Together, none." |
| 0:56 | *A virtual tumour* | "A virtual tumour: a real simulation of sixteen hundred cells. Radiation alone leaves a hundred and seven alive. With one of the solver's candidates, none." |
| 1:06 | *Every tumour has its own genes* | "Every tumour has its own genes. For nearly ten thousand real samples, p53 is lost in fourteen to thirty-nine of every hundred, depending on how we count, and then none of our candidates works. That is about the model, not about any person." |
| 1:16 | the demo, a little faster (about a minute): the dish, the four fates, a gene whose loss kills every cell, the circuit | "On the bench: radiation damages a cell, and each cell picks a fate. Switch off one gene and every cell dies. Inside, genes switch each other on and off, and the model is missing a link that the papers know." |
| 1:34 | an AI reads, proposes a link; ten tests, three fail; the fix | "An AI reads thirty-six papers and proposes the link. An exact checker replays ten known experiments: three come out wrong. The AI rewrites the link, and all ten pass. The checker decided, not the AI." |
| 1:54 | the audit, with its caption | "Honest limit: on outcomes it never saw, the model is no better than before." |
| 1:57 | the virtual tumour inside the demo | "Back in the virtual tumour, one candidate leaves no cell alive, and the simulation agrees with the solver on twenty-two of twenty-two sets. Both run the same rules, so this checks one against the other, not the biology." |
| 2:17 | the search engine, scrolled into view; it runs by itself | "This is the solver's whole search on one board: twenty-three genes, off in red, on in green, and a line for every set it tried, one thousand and fifty-eight. Eleven glow: they leave only death, and nothing smaller does." |
| 2:26 | the **p53 lost** profile | "Now the same search in a tumour where p53 is lost: nine hundred and sixty-eight sets, and none leaves only death." |
| 2:34 | the three cards of what this is and is not (the limits themselves wait behind the page's *Technical* button), with a caption | "Limits, plainly: a model of a cell, not of a person. These are hypotheses for the lab." |
| 2:39 | terminal, recorded apart | "One command, `make verify`, rebuilds every number from cached outputs, with no API call." |

Do not say "patient", "therapy", "treatment", "personalised", "proof", "trial", "cure" or "safe" (the page says "no treatment, no dose, no
medical advice" in the negative, and that is the only place). Say "tumour samples", "candidates", "hypotheses for the lab", "a model of a
cell". If PhysiBoSS, ChEMBL, cBioPortal or TCGA appear in the first line, say that they existed before the week and that the translation of
the network, the experiments, the checks, the board and the studies are new.

## If you would rather click than use the take

Open the page normally. The header loops eight beats of about ten seconds (the little bars jump to any beat, and it stands still while the
pointer is over it). **Play the demo** runs the walk-through in about 86 seconds; the search engine starts by itself when it scrolls into
view. The sentences above fit these screens in the same order.

## If asked afterwards

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
- Limits, on the page and in `docs/limitations.md`: ten scoreable held-out claims, written by me and not yet checked by a person; the model's
  repairs can pass the checks without being biologically right; Boolean networks have no dose and no time; no medical claims.

## The opening (cinematic, made by the page)

`results/report.html#intro-short` (about 28 seconds) and `#intro` (about 100 seconds, for a cut of its own, for example on X; it also explains the idea: a cell as a logic circuit of genes, an AI that reads but cannot check, a solver that checks but cannot read; the first three lines are dark red and every cut is a black frame with a slam-in): press the button
and the page plays its own DNA, slowly closer, with one line of words at a time and a white flash on the last, ending on a card with the name,
"From shared uncertainty to solitary conviction." and the caption that says what pre-existed and what was built this week (the brief's rule 9).
The page language decides whether the words are English or Greek (the **EN / ΕΛ** button). Say the lines at the pace they arrive, with a pause
between them; the long version is the corrected form of the draft script: it does not name a solver the project does not use, it says "an exact
solver" and "a virtual tumour", it states the limit ("We did not find a cure for cancer"), and it makes no claim about patients or treatment.
Put your own royalty-free music under it in the editor (with a licence; nothing from a reel or a stock library without rights).
For the three-minute video, record `#intro-short`, then the take (`#video`), then the terminal, then the card (`#card`): the take then needs
about twenty-five seconds cut from the header beats to stay inside three minutes.

## The order for the three minutes (with the opening that explains the project)

1. `#intro-short`, about 47 seconds. Each idea has a background drawn by the page, in the manner of a glowing render: a person on a cliff facing a
   universe of galaxies for "a feeling you get when you believe in something before anyone else does"; a luminous helix in the universe for the term
   *solitary conviction* and its definition; seven days that fill for "a platform that looked impossible to build in one week"; the point that aims for a
   star and lands on the moon for "We aimed for the stars: a cure for cancer. We landed on the moon: a platform that helps labs choose which tests to
   run first. A small step on the way."; and at the end the name over a network of lit cells with three
   lines, large and slow: the field (cancer biology: how cells respond to radiation), the problem (cell models are incomplete, and nobody can check every
   idea from the papers by hand) and where it helps (an AI proposes, an exact solver checks, researchers get candidates to test in the lab), and the caption
   of what pre-existed and what was built this week.
2. `#video-short`, about 1 minute 37 seconds: it starts on the virtual tumour (8 s), then the tumour samples (8 s), then the demo at 1.5 times, the search
   engine with the model cell and the p53 profile, and the three cards of what this is and is not. Say the sentences of the rows *A virtual tumour*, *Every tumour has its own genes*, the demo, the
   search engine and the closing cards of the table above; skip the first beats, the opening has said them.
3. The terminal, 10 to 12 seconds: `make verify`.
4. `#card`, 4 seconds.

That is about 2 minutes 42 seconds; if it comes out longer, cut the countdowns and the pauses. `#intro` (about 100 seconds) is the longer opening, with the same
backgrounds and the explanation in more steps (a network with signals, a new link, a scan, the simulation's own cells), for a cut of its own.
Images from elsewhere (stock photos, a reel) are not in the page: put them in the editor only if you hold their licence; the page draws its own.

## If you want the drop of a PDF in the video (optional, about 20 seconds)

It needs the local server, so it is a separate screen recording, not the page of the artifact. Read the paper once beforehand (a few cents):
`python -m cellproof.cli serve`, open the *Your PDFs* part, drop the PDF, press *Read it*. Then press *remove* on it (the model's replies stay in
`data/user_papers/cache`, git-ignored) and record: drop the same PDF again. The six steps run in front of the camera, Muse Spark's two answers
come from the cache in an instant, the solver runs for real, and the graph is drawn line by line, then each line takes the colour of the solver's
verdict. Nothing is spent twice and there is no live-API risk. Say what it is: "A paper the AI could not find on its own, handed over as a PDF:
read like the others, and every link it can judge is judged by the solver." Do not drop a paper you may not process, and do not show one that is not
open access in a public video unless its licence allows it.

### The teacher scene (long opening only)

`#intro` (not `#intro-short`) has a quiet scene of about 27 seconds after the noise lines and before "There is a feeling...": a night, a tree in blossom,
an old teacher with a lantern, and the student from the cliff, with petals falling. The talk and the figures are our own (nothing is taken from a film);
it ends on "Today is a gift" and one line about using AI where it can help people. The long opening is now about 127 seconds. The short opening is unchanged.

`report.html#intro-master` plays this scene on its own (about 36 seconds after the countdown) and ends on the name, "From shared uncertainty to solitary
conviction." and the caption that says what pre-existed and what was built this week. It is meant as a short clip for X or a reel: press Space (or the button
at the top), record, and the page does the rest. English or Greek follows the page language (**EN / ΕΛ**).
