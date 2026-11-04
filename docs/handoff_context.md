# CellProof: context for a new conversation (written 2026-11-02)

Paste this file, or point the assistant at it, when starting a new chat. The binding rules are in `Claude.md` (CLAUDE.md); this file is the state of the work.

## Who and how
- The user is a Greek-speaking ECE student, working alone, who delegates decisions. Reply in Greek, plain words; code, docs and commits in English.
- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never rewrite history or force-push.
- `make` is not available in the bash tool: use `.venv/Scripts/python.exe -m cellproof.cli <command>`.
- Bash heredocs turn `\n` inside Python strings into real newlines: write patch scripts with the Write tool, or use Edit.
- Always `cd /c/Users/Master/Desktop/meta_ai_hackathon &&` first (the cwd drifts).

## Project
Hackathon: Meta Global AI Developer Hackathon, Indie track (Track 2, "Push the Frontier"). **Deadline Wed Nov 4, 9 PM ET (Thu 5 Nov 04:00 Greece); target submit Tue Nov 3 evening.** Assistant feature freeze was planned for Mon Nov 2 evening.
CellProof: Muse Spark reads papers and proposes mechanism rules; an exact solver accepts or rejects each against 10 known experiments; accepted rules augment a published 30-gene DNA-damage Boolean model (Gupta 2023). Held-out audit (10 scoreable outcomes): the augmented model is **not better** than the published one; the page says so.

## State (HEAD 28ac44a, pushed to origin/main; 322 tests pass; artifact v34)
- Page: `results/report.html`, built by `.venv/Scripts/python.exe -m cellproof.cli report [--fragment <path>]` (about 20 s). Source in `src/cellproof/report/web/` (body.html, style.css, core/sections/hero/bench/search/papers/how/close/video/tissue .js) and `report/data.py`.
- Front page: 8-beat header (with a "Watch the intro" button), how-it-works strip, demo, **papers section** (36 AI-found papers as graphs + local drop zone for PDFs), search engine, three honesty cards, then the technical part behind one button (map of where to look, glossary, plain-language blocks that fold). Genes are "Gene N" unless the "Real names" button is on.
- Own PDFs: `cellproof serve` / `cellproof ingest` (docs/own_papers.md). Data in git-ignored `data/user_papers/`. Works only locally; the static page explains itself. Guard refuses the audit's source papers.
- Published artifact (private): https://claude.ai/artifact/WNGKzTnQSoChqqULvg9b2K (republish the same file path after a build: `scratchpad\cellproof_report.html`, built with `--fragment`).
- Repo is public: https://github.com/scoobydoobydrew/meta_ai_hackathon. Secret scan done on 2026-11-02 (clean). Root `index.html` redirects to `results/report.html` for GitHub Pages.
- Preview in the app: launch config "page" (port 8766, dir `results`); add `?v=N` to the URL to defeat the cache; the pane must be visible.

## What remains

**Only the user can do (cannot be faked by the assistant)**
1. GitHub settings (no gh, no token, browser not signed in): enable Pages (main, root) so `https://scoobydoobydrew.github.io/meta_ai_hackathon/` works; set repo description (include "Meta Global AI Hackathon 2026"); add topics `meta-hackathon-2026` and `meta-ai-hackathon`. The community tracker artifacts.watt-mind.com/meta-hackathon-2026 indexes by these.
2. Read `THIRD_PARTY.md` (human check, rule 4).
3. M4 is done (37 of 50 `correct`, labelled by the user on 2026-11-04). D4 is done too (16 of 23 quotes support their claim, 7 do not, 1 of the 7 is scored; labelled by the user on 2026-11-04, no amendment).
4. Read the Scaife et al. 2015 source (PMC4628540) cited on the page.
5. Record the video (3 min): `#intro-short` (or the button), then `#video-short`, then the terminal (`make verify`), then `#card`. Script and timings: `docs/video_script.md`. The first line must say what pre-existed and what was built this week. Make the video public and link it in the README.
6. Check the page in a clean browser at 1920x1080 and on a real phone.
7. Check on Discord #questions whether AI coding tools and the X viral prize have rules.
8. Submit through the official form well before Nov 4, 9 PM ET.

**Assistant can do (ask or confirm first where marked)**
- A real end-to-end test of the PDF drop with one open-access CC BY PDF from Europe PMC and a real Muse Spark call (about $0.07). **Needs the user's explicit yes** (download and spend). It would also give a real example for the static page and a free replay for the video.
- Dockerfile (small, for `make verify`) and a short README "Quickstart" if missing; the tracker rewards both.
- After the user enables Pages and topics: re-check the tracker for the score and see what is missing.
- Greek version of the technical part (currently English only), if wanted.
- Last-day polish only; no new features after the freeze unless the user asks.

## Do not
- Claim treatment, efficacy, speed-ups of lab time, or "proof"; no patient-facing wording (rule 6, docs/limitations.md).
- Put a number in the README, page or video that no script in the repo produced (rule 7).
- Change the frozen held-out split, add paid services, or delete data without asking.
- Commit anything under `data/user_papers/`, `.env`, or papers the user may not redistribute.

## Optional idea discussed
NTUA x Columbia "Lab to Market": weak fit as a startup (no customer, no business model, audit shows no gain); only worth applying for mentoring, and only with a lab that tests it on their own paper.
