# The search board

What the page's "search engine" draws, and what it does not claim. The profile rule below was written in code (`search_board.chosen`, `PROFILES = 5`) before the board was run.

## What it is

The exact solver's verdict on every set of one or two gene changes (a gene switched off or forced on; the readout genes that define the outcome are not
offered) on the checked network `data/models/repaired_min2.bnet`: 23 genes, 46 single changes, 1,012 pairs on two different genes, 1,058 sets in all. For each
set, the fates the damaged cell can still reach, by the same complete fixed-point enumeration as `analysis.interventions.fates`:

| code | meaning |
|---|---|
| D | only death (apoptosis is the only fate) |
| O | another fate, or several |
| N | no stable state (the network oscillates) |
| - | not offered: the set touches a gene the profile already fixes |

A set is *kept* if it is a D and no smaller set already is one (`search_board.kept`, the same rule as `minimal_sets`). The page draws a ring of the 23 genes, a line
for every pair tried, in the order of the exhaustive search (`analysis.llm_search.candidate_sets`, the order the header's 1,058 dots use), and lists the kept sets.

## Profiles

A profile is a genotype forced onto the network, as in `docs/genotype_protocol.md` (rule R1: a homozygous deletion or a truncating mutation forces a node to 0,
a high-level amplification forces it to 1). The profiles are not hand-picked; the rule is in `search_board.chosen`: the first five signatures of R1, by number of
tumour samples (results/genotypes.json), whose genotype alone does not already leave only death in the model. The signatures where it does (PTEN lost, RB lost, MYC
high, and so on) need no search and are listed apart on the page and in RESULTS.md. The model cell, with nothing forced, is the first profile.

The kept sets of the model cell are the solver's 11 (test: equal to `solver_sets` of results/genotypes.json). The kept sets of each profile are the ones the genotype
study found for that signature (test: equal to `specific_sets`); the board recomputes them with a second, separate implementation of the same search.

## What it does not say

- It says what a model says. A verdict is about the Boolean network with a node forced, not about a tumour, a drug or a person. No dose, no time, no clinical claim.
- "p53 lost: none of the 968 sets leaves only death" means: in this model, with p53 forced off, no change of one or two of the other genes leaves death as the only
  fate. It does not say that no such combination exists in biology, or that a larger set would not work (sets of three or more are not searched here).
- A profile is a single forced gene (or two). Real tumours carry many alterations; the genotype study counts how often each signature occurs, and the board shows five.
- The sample counts are how many of the 9,896 public tumour samples carry exactly that signature under R1; they are counts, never samples.

## Reproduce

```
python -m cellproof.cli board       # about 20 seconds; writes results/search_board.json from results/genotypes.json
python -m pytest tests/test_search_board.py
```

`make verify` only reads the file and writes the section of RESULTS.md.
