# What only the human can do

These cannot be delegated to the assistant, because the assistant would be checking its own work. Each is a reading task, not
a biology exam: the question is always "does this sentence say what the row claims?".

**The easy way for both reading tasks: `make label`** (or `python -m cellproof.cli label`). It opens a local page with one
card per claim: the quote inside its paragraph, the claim, and buttons (keys 1 to 5). Every click is saved at once into
`data/labels/m4_sample.csv` (M4) and `data/labels/d4_check.csv` (D4); nothing is pre-filled and no model is called. The
held-out item file itself is never written. When a tab shows all done, tell the assistant, which computes the numbers and
commits the files.

1. **D4: check the held-out claims (23 rows).** The data is in `data/heldout/gupta2023_heldout.json`. Each claim has a `statement`, a
   `readout`, a `polarity` (present, absent, decreased, ...) and a `quote` copied from the paper. For each, ask whether the
   quote supports the statement and the polarity. If a claim is wrong, do not edit the file: write it down and tell the
   assistant, because a change needs a logged amendment (`docs/heldout_protocol.md`, last section).
   - 10 of the 23 are scored. They are the ones with category `scoreable` or `scoreable_with_new_nodes`; run
     `python -m cellproof.cli score` to see which.
2. **M4: label 50 extracted claims.** The data is in `data/labels/m4_sample.csv`. Each row is a claim a model extracted from a paper
   (`source`, `effect`, `target`) with the sentence it quoted. In the `label` column write one of: `correct`,
   `wrong_direction`, `wrong_entity`, `not_a_mechanism`, `quote_does_not_support`. This gives the extraction accuracy; until
   it is filled, no accuracy may be quoted anywhere. The sample was drawn with a fixed seed before anyone looked at it.
3. **Before the repository is made public:** run a secret scan (the `.env` file is git-ignored and must stay untracked), read
   `THIRD_PARTY.md`, and check that no full paper text is committed (they live in `data/raw`, which is ignored).
4. **The video:** its first line must say what pre-existed and what was built this week (the brief, rule 9). Record it from
   `make verify` output, which replays cached model outputs and needs no network. Set the page to English (the **EN**
   button) before recording; `docs/video_script.md` has the beat sheet around the page's *Play* button.

## Where things stand (updated 2026-10-31) and what is left until the submission

Done by the assistant and checked by tests: the pipeline, the audit, the report page, the tissue what-if, the target list, the
ChEMBL snapshot, the click page for the two reading tasks, the secret scan of the new files (clean on 2026-10-31; run it again
the moment before the repository is made public), `THIRD_PARTY.md` (new entries for PhysiBoSS, MaBoSS, ChEMBL, HGNC use,
and what was considered and not used).

Left, in order of importance:
1. **M4 and D4** (`make label`): about 25 and 15 minutes. Without M4 the extraction accuracy stays "TBD" in the README, which is
   honest but a visible gap. Tell the assistant when a tab shows all done; it computes the numbers and commits the files.
2. **The video**, recorded from the page and `make verify` (see `docs/video_script.md`). The first line must say what pre-existed and
   what was built this week; if the tissue beat is shown, add that the simulator PhysiBoSS and the ChEMBL database existed and
   that the translation of the network, the experiments and the checks are new.
3. **Before the repository is public**: secret scan again, read `THIRD_PARTY.md` once, check that no paper text is committed
   (`git ls-files data/raw` must print nothing), and check the page once in a clean browser profile.
4. **Optional**: a decision on whether the tissue beat goes in the three minutes (10 to 15 seconds; the script says what to say and
   what not to say).
5. **Optional**: skim the 18 quotes of the literature check of PTEN and RB (`data/literature/pten_rb_evidence.json`, a minute each;
   the page and `docs/literature_check.md` say that only code has checked them). Code confirms that every quote occurs in its paper;
   whether the verdict that goes with it is fair is a reading task, like M4 and D4.

Feature freeze for the assistant: Mon 2026-11-02 evening. After that only fixes, the README and the video.
