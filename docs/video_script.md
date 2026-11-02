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

## The opening (made by the page, with a voice-over)

There is one opening. A visitor starts it with the **Watch the intro** button in the header (no countdown; **Skip** stops it). To record it, open
`results/report.html#intro-master`, press Space (or the button at the top), and the page does the rest after a 3-2-1. It lasts about 2 minutes 16 seconds
and is timed to a voice-over. In order:

1. Two slides: what the platform is for ("a platform that helps cancer labs decide which experiments to run first") and why there is too much to read
   (new papers, new genes, a lab can only run a few experiments). It does not say "clinical trials": the platform does not touch them.
2. A quiet scene: a night, a tree in blossom, an old teacher with a lantern, the student from the cliff, petals falling. A short talk, then one line about
   using AI where it can help people.
3. The words "There is a feeling...", *solitary conviction* and its definition, and the seven days of the week.
4. "Shoot for the moon. A treatment for cancer." (a point aims at the moon and falls short), then "At worst, you land among the stars: a platform that helps labs
   choose which tests to run first. We did not find a cure for cancer." (the stars light up and join into a network).
5. The platform explained on that network (the field, the problem, where it helps) while a new link grows and the solver scans it, with the caption that
   says what pre-existed and what was built this week (rule 9 of the brief).

**The voice.** `results/voice/*.wav`, twelve files, made once by `python -m cellproof.voice` with Meta's open-source MMS-TTS (CC-BY-NC 4.0; see
`THIRD_PARTY.md`). It is synthetic, has one voice and no style, and is English only: on the Greek page (**EN / ΕΛ**) the opening is silent. The cues are
`MASTER_CUES` in `video.js`; if the lines or the voice change, run the command again and paste the cues it prints. The browser plays the files after a
click or a key press; if a file is missing the opening still plays, without sound. Do not call the voice a person's.

**For the three-minute video.** The opening alone is longer than two minutes, and `#video-short` (about 1 minute 37 seconds) comes after it, so both do not fit in
three minutes. Choose: the opening as a clip of its own (for X or a reel) and `#video` as the three-minute video; or a shorter take after the opening. The
earlier short and long openings no longer exist.

One sentence of the teacher's talk, "You are too concerned about what was and what will be", is a short nod to a line of the film Kung Fu Panda (DreamWorks);
everything else in the scene and its figures is ours. If you would rather not quote it in a public video, replace it with a sentence of our own in `TALK_EN`
and `TALK_EL` in `video.js` (and say the new sentence in `src/cellproof/voice.py`, line `03-teacher`).

Put your own royalty-free music under it in the editor (with a licence; nothing from a reel or a stock library without rights).

## If you want the drop of a PDF in the video (optional, about 20 seconds)

It needs the local server, so it is a separate screen recording, not the page of the artifact. Read the paper once beforehand (a few cents):
`python -m cellproof.cli serve`, open the *Your PDFs* part, drop the PDF, press *Read it*. Then press *remove* on it (the model's replies stay in
`data/user_papers/cache`, git-ignored) and record: drop the same PDF again. The six steps run in front of the camera, Muse Spark's two answers
come from the cache in an instant, the solver runs for real, and the graph is drawn line by line, then each line takes the colour of the solver's
verdict. Nothing is spent twice and there is no live-API risk. Say what it is: "A paper the AI could not find on its own, handed over as a PDF:
read like the others, and every link it can judge is judged by the solver." Do not drop a paper you may not process, and do not show one that is not
open access in a public video unless its licence allows it.
