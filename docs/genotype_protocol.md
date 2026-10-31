# Tumour genotypes as constraints on the model: protocol, fixed before any outcome was computed

Written 2026-10-31. The idea comes from Montagud et al. (eLife 2022, "Patient-specific Boolean models of signalling networks guide
personalised treatments"), which the project owner supplied: a published Boolean model is tailored to each sample's genotype by
forcing the nodes of altered genes, and the tailored models are then compared. This protocol does the discrete part of that, and only
that, on our model and with a rule that needs no biology that is not in a source file.

**This is a study of how the model's answers depend on genotype. It is not a patient-facing result and it is not a treatment
suggestion.** Tumour samples of a public cohort are counted; no sample is followed, no identifier is stored, and nothing is said
about any person. Montagud et al. themselves write that such results rank candidates and should not be used as targets for
experiments or trials; that applies here with more force.

## The question

The solver's 11 minimal sets say which genes, held on or off, leave apoptosis as the only stable end state of a damaged cell. They
were found for a cell that is otherwise normal. Every one of them depends on p53, and the literature check does not support the
model's direction for PTEN and RB1. **If the cell already carries the alterations that tumours of a public cohort carry, how often
does each set still leave only apoptosis, and which sets does the model then find?**

## Data

TCGA PanCancer Atlas through the cBioPortal API (`https://www.cbioportal.org/api`), all 32 studies of the atlas
(`*_tcga_pan_can_atlas_2018`), tumour samples that have both mutation and copy-number data (the study's `_cnaseq` sample list):
somatic mutations (`_mutations` profile) and GISTIC copy-number calls (`_gistic`, values -2 to 2). Licence of the portal's data:
ODC Open Database License with attribution to the original studies (cBioPortal FAQ, read 2026-10-31); to be cited: Cerami 2012,
Gao 2013, de Bruijn 2023, and the TCGA PanCancer Atlas. Raw responses are cached in `data/raw/cbioportal` (git-ignored). What is
committed is a table of **counts of genotype signatures per study**, with no sample or patient identifier
(`data/genotypes/tcga_pancan_signatures.json`).

## From a sample to a signature (the rule, fixed here)

1. **Which nodes can carry a genotype.** A node of the model whose gene list in `formalize.entities.NODE_GENES` is exactly one HGNC
   symbol, whose own annotation (Gupta et al. 2023, Supplementary Table S2) does not call it a complex or a non-coding RNA, plus the
   added nodes ATR, CHK1, CHK2 and DNA_PK (genes ATR, CHEK1, CHEK2, PRKDC). That gives 22 nodes. Not mapped, and never forced:
   nodes that merge several genes (ATM_pH2AX, AMPK_MAPK, Cdc2_CycB, ULK1_Beclin1, Caspase), complexes (mTORC1, mTORC2), the two
   modified forms of p53 (p53_A, p53_K), non-coding RNAs (TUG1, miR221) and the DNA damage input.
2. **Loss.** A node is forced to 0 when its gene has a homozygous deletion (GISTIC -2) or a truncating mutation (variant types
   Nonsense_Mutation, Frame_Shift_Del, Frame_Shift_Ins, Splice_Site, Nonstop_Mutation).
3. **Gain.** A node is forced to 1 when its gene has a high-level amplification (GISTIC +2) and no loss. If a gene has both, the loss wins.
4. **Everything else is ignored:** missense and in-frame mutations, shallow copy-number changes, expression. Their effect on a
   gene is not decided by a rule that needs no biology, so they are not used. This is the main limit of the whole study.
5. **A bound for TP53, stated as one.** The rule above under-counts TP53 loss, because most TP53 mutations are missense. A second
   signature, R2, treats every protein-changing TP53 mutation (any type except Silent, Splice_Region, 3'UTR, 5'UTR, Intron, RNA and
   Flank) as a loss, which is deliberately too broad. R1 and R2 bracket the truth; both are reported and neither is called the answer.
   R2 differs from R1 only for TP53.
6. **The signature** of a sample is the set of its forced (node, value) pairs. Samples with the same signature are counted together.

## What is computed (offline, exact, no new tools)

For every distinct signature S, and for the empty signature:

- **Alone:** the fates of the damaged cell with S forced, by the solver's own function (`analysis.interventions.fates`, complete
  fixed-point enumeration): only apoptosis, no stable state (the network oscillates), or something else.
- **With each of the 11 solver sets P:** the same with S and P forced together. A set is **not applicable** to a signature if one of
  its literals asks for the opposite value of a node the genotype already forces (a gene that is deleted cannot be switched on);
  a literal that asks for the value the genotype already forces changes nothing. Not applicable counts as not leaving only apoptosis
  in the share of all samples, and the share among applicable samples is reported next to it. (Written first as "the intervention
  overrides the genotype"; changed the same day, before any outcome was computed, because overriding a deleted gene is not
  something an intervention can do.)
- **Genotype-specific search:** for the most frequent distinct signatures (the 20 most frequent non-empty ones, by count over all
  studies, under R1 and under R2), the exhaustive search of `analysis.interventions.minimal_sets` up to two literals on the network
  with S forced, over the nodes that S does not force and that are not readouts. If S alone already leaves only apoptosis, no
  search is needed and that is recorded.

Reported: how many samples carry at least one mapped alteration; per set, the share of samples for which S and P together leave only
apoptosis, in all samples and separately for TP53 lost and TP53 not lost, under R1 and R2; per study the same in short; the
genotype-specific minimal sets and how they differ from the 11. Every number comes from the stored signature table by a script.

## What will be said, whatever the outcome

- Counts and shares, with the rule and its limits next to them. A share of samples is a statement about a model constrained by a
  crude rule, not about tumours or people.
- If almost every set fails once TP53 is lost, that is the result (it is what the earlier finding predicts), and it is reported
  with the TP53 share under both R1 and R2.
- No sample, no person, no drug and no outcome is claimed. Nothing is called personalised medicine, therapy, treatment or proof.
- Not modelled: expression, missense effects, subclones, the tissue, any dose, and the fact that a bulk sample is a mixture of cells.

## Results (2026-10-31)

`python -m cellproof.cli genotypes --fetch` read 32 studies and 9,896 tumour samples with mutation and copy-number data, and built
727 distinct signatures under R1 and 739 under R2 (`data/genotypes/tcga_pancan_signatures.json`, counts only;
`results/genotypes.json`; every number below is in `results/RESULTS.md`). The code was written after this protocol, and the one
change made to the protocol (a set that conflicts with the genotype is not applicable) was made before any outcome existed.

- **How many samples carry something the rule can use:** 4,453 (45.0%) under R1 have at least one forced node, 5,635 (56.9%) under R2.
  TP53 is lost in 1,408 (14.2%) under R1 and in 3,815 (38.6%) under R2. The gap between the two is how much the rule for missense
  mutations matters; neither number is a measurement of anything but the rule.
- **The genotype alone:** in 1,744 samples under R1 (17.6%; 1,009 under R2, 10.2%) the genotype by itself already leaves only
  apoptosis in the model, and every one of those samples has TP53. In 1,080 (R1) or 2,833 (R2) the damaged cell has no stable state.
- **The 11 sets on top of the genotype:** among the samples with TP53 not lost, each set leaves only apoptosis in 95.1% to 96.5%
  (R1; 95.4% to 96.6% under R2), except AMPK_MAPK KO with Sirt1 on, which does so in 80.4% (83.2%). **Among the samples with TP53
  lost, none of the 11 sets leaves only apoptosis, for any sample, under either rule** (0 of 1,408 and 0 of 3,815), which is the
  earlier finding about p53 measured on a cohort.
- **Genotype-specific search**, for the 20 most frequent signatures under each rule: for every one of those with TP53 lost
  (5 under R1, 11 under R2) there is **no set of up to two changes** that leaves only apoptosis. Where the genotype alone already
  does so (PTEN lost, RB1 lost, MYC amplified, E2F1 amplified and combinations) no change is needed in the model. Where the
  genotype leaves several fates (TERT or MDM2 amplification, for example) the search returns the same 11 sets. One signature
  stands out: **PPM1D (Wip1) amplified, 89 samples under R1**: none of the 11 sets leaves only apoptosis there, and the search finds
  exactly one set, Cdc25 on with Sirt1 off. That is a statement about the model for one genotype, a hypothesis and nothing more.
- **What it does not say.** Under this rule PTEN lost and RB1 lost are "no change needed" in the model, and the literature check
  found that the model's direction for exactly those two genes is contested. So for the two most frequent such genotypes (510
  samples with PTEN lost alone and 232 with RB1 lost alone, under R1) the model's answer is one that the papers read do not support.
  The numbers measure how the model reacts to genotypes, not what happens in tumours, and no sample, person, drug or outcome is
  claimed.
- **Limits specific to this study.** Only 22 of 34 nodes can carry a genotype (ATM, AMPK, the caspases, mTORC1 and 2 and others are
  merged nodes and never forced), missense effects are ignored, and TP53 loss swings from 14% to 39% with the rule. The model is
  one published DNA damage network, not a model of any of the 32 cancer types, and every sample is a mixture of cells.
