from pathlib import Path

import pytest

from cellproof.analysis.interventions import describe, minimal_sets
from cellproof.network.bnet import load_bnet
from cellproof.targets.table import node_kind, target_table

DATA = Path(__file__).resolve().parents[1] / "data"
CHECKED = load_bnet(DATA / "models" / "repaired_min2.bnet")
CODING = {"symbol": "TUG1", "locus_group": "protein-coding gene"}
RNA = {"symbol": "MIR221", "locus_group": "non-coding RNA"}


def test_a_node_is_what_the_models_own_annotation_says_and_a_disagreement_with_hgnc_is_written_down():
    kind, note = node_kind("Long non-coding RNA - taurine up-regulated 1", [CODING])
    assert kind == "non_coding_rna" and "HGNC lists this gene as protein coding" in note  # TUG1 today; the node stands for the RNA
    assert node_kind("microRNA 221", [RNA]) == ("non_coding_rna", "")
    assert node_kind("Phosphatase and tensin homolog", [{"symbol": "PTEN", "locus_group": "protein-coding gene"}]) == ("protein", "")
    assert node_kind("AMP-activated protein kinase/Mitogen-activated protein kinase", [CODING, CODING])[0] == "several_genes"
    assert node_kind("AKT serine/threonine kinase 1", [{"symbol": "AKT1", "locus_group": "protein-coding gene"}])[0] == "protein"  # a slash in a name is not two genes
    assert node_kind("anything", [None])[0] == "unmapped"


@pytest.fixture(scope="module")
def table():
    import os

    os.environ["CELLPROOF_OFFLINE"] = "1"  # identifiers come from the committed HGNC cache; no network
    try:
        return target_table()
    finally:
        del os.environ["CELLPROOF_OFFLINE"]


def test_the_eleven_sets_become_a_list_of_targets_that_the_published_and_the_checked_model_agree_on(table):
    rows = {r["id"]: r for r in table["rows"]}
    assert len(rows) == 11 and rows["hit_03"]["label"] == "PTEN KO"
    assert all(r["only_apoptosis_in"]["checked"] and r["only_apoptosis_in"]["published"] for r in rows.values())
    assert not any(r["only_apoptosis_in"]["unchecked"] for r in rows.values())  # the unchecked rules replaced all of them (docs/limitations.md)
    pten = rows["hit_03"]["literals"][0]
    assert pten["kind"] == "protein" and pten["genes"][0]["hgnc_id"] == "HGNC:9588" and pten["genes"][0]["uniprot_ids"] == ["P60484"]
    assert {r["id"] for r in rows.values() if r["knock_out_only"]} == {"hit_03", "hit_04", "hit_05"}  # PTEN, RB, TUG1: the rest need a gene switched on
    assert rows["hit_05"]["literals"][0]["kind"] == "non_coding_rna" and rows["hit_05"]["literals"][0]["note"]


def test_every_set_depends_on_p53_without_it_none_leaves_only_apoptosis_and_a_damaged_cell_alone_has_no_stable_state(table):
    from cellproof.analysis.attractors import fixed_points, perturb

    assert fixed_points(perturb(CHECKED, {"DNA_damage": 1, "p53": 0})) == []
    lost = {r["id"]: r["with_p53_lost"] for r in table["rows"]}
    assert not any(v["only_apoptosis"] for v in lost.values())
    assert all(v["fates"] == [] or v["fates"] == ["unclassified"] for v in lost.values())  # no stable state, or one that is none of the four fates
    assert {k for k, v in lost.items() if v["fixed_points"] == 0} == {"hit_03", "hit_05", "hit_06", "hit_07", "hit_11"}


def test_allowing_only_knock_outs_up_to_three_genes_at_once_finds_nothing_beyond_pten_rb_and_tug1():
    found = {describe(s) for s in minimal_sets(CHECKED, 2, values=(0,))}
    assert found == {"PTEN KO", "RB KO", "TUG1 KO"}
