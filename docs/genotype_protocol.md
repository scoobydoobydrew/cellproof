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
- **With each of the 11 solver sets P:** the same with S and P forced together. Where P and S name the same node, P wins (the
  intervention overrides the genotype).
- **Genotype-specific search:** for the most frequent distinct signatures (the 20 most frequent non-empty ones, by count over all
  studies), the exhaustive search of `analysis.interventions.minimal_sets` up to two literals on the network with S forced.

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
