import json
from collections import Counter
from pathlib import Path

import pytest

from cellproof.analysis.interventions import minimal_sets
from cellproof.genotype import outcomes, signatures
from cellproof.genotype.signatures import decode, mapped_nodes, sample_signatures
from cellproof.network.bnet import load_bnet

ROOT = Path(__file__).resolve().parents[1]
rules = load_bnet(ROOT / "data" / "models" / "repaired_min2.bnet")
STORED = ROOT / "results" / "genotypes.json"
TABLE = signatures.SIGNATURES

NODES = {"p53": "TP53", "PTEN": "PTEN", "Myc": "MYC", "RB": "RB1"}
ENTREZ = {"TP53": 7157, "PTEN": 5728, "MYC": 4609, "RB1": 5925}


def mut(sample, gene, kind):
    return {"sampleId": sample, "entrezGeneId": ENTREZ[gene], "mutationType": kind}


def cna(sample, gene, value):
    return {"sampleId": sample, "entrezGeneId": ENTREZ[gene], "alteration": value}


def test_the_rule_forces_nodes_only_for_deletions_truncations_and_amplifications():
    samples = {"s1", "s2", "s3", "s4", "s5", "s6", "s7"}
    muts = [mut("s1", "PTEN", "Frame_Shift_Del"), mut("s2", "RB1", "Missense_Mutation"), mut("s3", "TP53", "Missense_Mutation"), mut("s4", "MYC", "Nonsense_Mutation"),
            mut("s5", "TP53", "Silent"), mut("s99", "PTEN", "Nonsense_Mutation")]  # s99 is not in the cohort's list
    cnas = [cna("s4", "MYC", 2), cna("s5", "RB1", -2), cna("s6", "MYC", 2), cna("s7", "PTEN", -2), cna("s7", "PTEN", 2)]
    r1, r2, types = sample_signatures(samples, NODES, ENTREZ, muts, cnas)
    assert r1 == Counter({(): 2, (("PTEN", 0),): 2, (("RB", 0),): 1, (("Myc", 0),): 1, (("Myc", 1),): 1})  # s2 and s3 are missense; s4's loss wins over its amplification
    assert r2 == Counter({(): 1, (("PTEN", 0),): 2, (("RB", 0),): 1, (("Myc", 0),): 1, (("Myc", 1),): 1, (("p53", 0),): 1})  # R2 adds the missense TP53 sample, only that one
    assert types == Counter({"Frame_Shift_Del": 1, "Missense_Mutation": 2, "Nonsense_Mutation": 1, "Silent": 1}) and sum(r1.values()) == sum(r2.values()) == len(samples)


def test_a_gene_with_a_loss_and_a_broad_tp53_mutation_is_still_one_signature_per_sample():
    r1, r2, _ = sample_signatures({"a"}, NODES, ENTREZ, [mut("a", "TP53", "Nonsense_Mutation"), mut("a", "TP53", "Missense_Mutation")], [cna("a", "TP53", 2)])
    assert r1 == r2 == Counter({(("p53", 0),): 1})


def test_the_nodes_that_can_carry_a_genotype_are_the_22_of_the_protocol():
    nodes = mapped_nodes(rules)
    assert len(nodes) == 22 and nodes["p53"] == "TP53" and nodes["CHK1"] == "CHEK1" and nodes["ATR"] == "ATR" and nodes["DNA_PK"] == "PRKDC"
    for merged in ("ATM_pH2AX", "AMPK_MAPK", "Cdc2_CycB", "ULK1_Beclin1", "Caspase", "mTORC1", "mTORC2", "p53_A", "p53_K", "TUG1", "miR221", "DNA_damage"):
        assert merged not in nodes


def test_a_set_that_asks_for_the_opposite_of_the_genotype_is_not_applicable():
    assert outcomes.applicable({"Myc": 0}, (("Myc", 1),)) is False
    assert outcomes.applicable({"Myc": 1}, (("Myc", 1), ("PTEN", 0))) and outcomes.applicable({}, (("Myc", 1),))
    assert outcomes.outcome({"apoptosis"}) == "only_apoptosis" and outcomes.outcome(set()) == "no_stable_state" and outcomes.outcome({"apoptosis", "arrest"}) == "other"


def test_the_genotype_specific_search_with_no_genotype_is_the_solvers_search():
    assert outcomes.minimal_sets_given(rules, {}, 2) == minimal_sets(rules, 2)


@pytest.mark.skipif(not TABLE.exists(), reason="data/genotypes has not been written (python -m cellproof.cli genotypes --fetch)")
def test_the_committed_table_has_counts_only_and_each_study_adds_up():
    table = json.loads(TABLE.read_text(encoding="utf-8"))
    assert len(table["studies"]) == 32 and set(table["nodes"].values()) == set(table["genes"]) and len(table["nodes"]) == 22
    for study, block in table["studies"].items():
        assert set(block) == {"samples", "r1", "r2", "mutation_types"}  # no sample, no patient, no identifier
        assert sum(decode(block["r1"]).values()) == sum(decode(block["r2"]).values()) == block["samples"], study
    text = TABLE.read_text(encoding="utf-8")
    assert "TCGA-" not in text  # no sample or patient barcode is stored


@pytest.mark.skipif(not STORED.exists(), reason="results/genotypes.json has not been written")
def test_the_stored_results_say_what_the_protocol_reports():
    d = json.loads(STORED.read_text(encoding="utf-8"))
    assert len(d["solver_sets"]) == 11
    for rule in ("r1", "r2"):
        r = d[rule]
        assert r["samples"] == sum(s["samples"] for s in r["per_study"]) == sum(r["baseline"].values()) == 9896 and r["studies"] == 32
        for block in (r["baseline_tp53_lost"], r["baseline_tp53_intact"]):
            assert sum(block.values()) in (r["tp53_lost"], r["samples"] - r["tp53_lost"])
        assert r["baseline_tp53_lost"]["only_apoptosis"] == 0  # without p53 the damaged cell never has apoptosis as its only fate
        for s in r["sets"]:
            assert sum(s["all"].values()) == r["samples"] and s["tp53_lost"]["only_apoptosis"] == 0, s["label"]  # every one of the 11 sets needs p53
            assert s["all"]["only_apoptosis"] == s["tp53_intact"]["only_apoptosis"]
        for top in r["top_signatures"]:
            if ["p53", 0] in top["signature"]:
                assert top["specific_sets"] == [], top["signature"]  # no set of up to two literals, for any of the most frequent TP53-lost genotypes
    assert d["r1"]["tp53_lost"] == 1408 and d["r2"]["tp53_lost"] == 3815 and d["r1"]["altered"] == 4453
    for rule, works in (("r1", 8236), ("r2", 5907)):  # the three kinds of dot on the page: a set works, TP53 intact but none works, TP53 lost
        r = d[rule]
        assert r["any_set_works"] == works and r["any_set_works_tp53_lost"] == 0 and 0 < r["samples"] - r["tp53_lost"] - r["any_set_works"] < 300
    wip1 = next(t for t in d["r1"]["top_signatures"] if t["signature"] == [["Wip1", 1]])
    assert wip1["sets_that_leave_only_apoptosis"] == [] and wip1["specific_sets"] == ["Cdc25 E1 + Sirt1 KO"]  # a genotype for which the 11 sets fail and one other exists
