# Evaluation

An index. The code is in [`src/cellproof/eval/`](../src/cellproof/eval/), the frozen data in [`data/`](../data/), and every number is rebuilt by
`make verify` (no API call, no cost) into [`results/RESULTS.md`](../results/RESULTS.md). Nothing is typed in by hand.

| Metric | What it measures | Protocol and data | Result |
|---|---|---|---|
| M1 held-out outcome agreement | base network against augmented networks, on outcomes the loop never saw | [`docs/heldout_protocol.md`](../docs/heldout_protocol.md), frozen before any scoring | [`results/m1_heldout.md`](../results/m1_heldout.md) |
| M2 contradiction rate | share of proposed rule edits that break a known behaviour, with and without the solver | ten known wild-type and mutant behaviours in `data/` | [`results/RESULTS.md`](../results/RESULTS.md) |
| M3 repair success | rejected edits fixed by the model after a counterexample | same | [`results/RESULTS.md`](../results/RESULTS.md) |
| M4 extraction accuracy | claims read correctly, on 50 claims labelled by a person | `data/labels/m4_sample.csv`, `make label` | 37 of 50 `correct` (one labeller); see `results/RESULTS.md` |
| M5 model ablation | Muse Spark against Muse Wonder: accuracy, cost, latency | `src/cellproof/cli.py` | [`results/RESULTS.md`](../results/RESULTS.md) |
| M6 scaling | exact checker time against network size, with time-outs | `src/cellproof/analysis/` | [`results/RESULTS.md`](../results/RESULTS.md) |

Read the limits first: [`docs/limitations.md`](../docs/limitations.md). The held-out set has ten scoreable claims and cannot show an improvement either way;
the audit says the augmented networks are not better than the published model.
