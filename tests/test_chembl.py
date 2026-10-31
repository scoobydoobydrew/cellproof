import pytest

from cellproof.targets import chembl


def record(compound, pchembl, description="Inhibition of human X using substrate Y", **extra):
    return {"molecule_chembl_id": compound, "molecule_pref_name": None, "standard_type": "IC50", "standard_relation": "=", "standard_value": "10",
            "standard_units": "nM", "pchembl_value": str(pchembl), "assay_chembl_id": "CHEMBL1", "assay_type": "B", "assay_description": description,
            "document_chembl_id": "CHEMBL2", "data_validity_comment": None, **extra}


def test_a_target_is_the_human_single_protein_of_an_accession_or_none():
    calls = []

    def fetch(path, **params):
        calls.append((path, params))
        return {"targets": [{"target_chembl_id": "CHEMBL1", "pref_name": "P", "organism": "Homo sapiens", "target_type": "SINGLE PROTEIN", "extra": 1}]}

    assert chembl.human_target("P60484", fetch) == {"target_chembl_id": "CHEMBL1", "pref_name": "P", "organism": "Homo sapiens", "target_type": "SINGLE PROTEIN"}
    assert calls[0][1]["target_type"] == "SINGLE PROTEIN" and calls[0][1]["organism"] == "Homo sapiens"
    assert chembl.human_target("X", lambda path, **params: {"targets": []}) is None


def test_activities_are_paged_until_every_record_has_been_read():
    pages = {0: [record("A", 7), record("B", 6)], 2: [record("C", 6.5)]}
    offsets = []

    def fetch(path, **params):
        offsets.append(params["offset"])
        return {"activities": pages[params["offset"]], "page_meta": {"total_count": 3}}

    assert [r["molecule_chembl_id"] for r in chembl.activities("CHEMBL1", 6, fetch)] == ["A", "B", "C"] and offsets == [0, 2]


def test_the_top_compounds_keep_each_compounds_best_record_and_flag_assays_that_mention_phosphorylation():
    records = [record("A", 6.0), record("A", 7.5), record("B", 6.5, "Inhibition of RB1 phosphorylation in human MCF7 cells"), record("C", 5.0),
               record("D", 4.0, "Inhibition of human PTEN using 3-O-Methylfluorescein phosphate as substrate")]
    top = chembl.top_compounds(records)
    assert [(t["compound"], t["pchembl"]) for t in top] == [("A", 7.5), ("B", 6.5), ("C", 5.0), ("D", 4.0)]
    assert [t["mentions_phosphorylation"] for t in top] == [False, True, False, False]  # "phosphate" is a substrate, not a phosphorylation


def test_the_dossier_counts_records_at_each_potency_and_reads_only_the_strong_ones_in_full():
    asked = []

    def fetch(path, **params):
        asked.append((path, params))
        if path == "target":
            return {"targets": [{"target_chembl_id": "CHEMBL9", "pref_name": "P", "organism": "Homo sapiens", "target_type": "SINGLE PROTEIN"}]}
        if params.get("limit") == 1:
            level = params.get("pchembl_value__gte")
            return {"activities": [], "page_meta": {"total_count": {None: 10, 4: 6, 5: 4, 6: 2}[level]}}
        if "order_by" in params:
            return {"activities": [record("A", 7), record("B", 6)], "page_meta": {"total_count": 6}}
        return {"activities": [record("A", 7), record("A", 6.5, "Inhibition of X phosphorylation in cells")], "page_meta": {"total_count": 2}}

    result = chembl.dossier("P1", fetch)
    assert result["records"] == {"all": 10, "pchembl_4_or_more": 6, "pchembl_5_or_more": 4, "pchembl_6_or_more": 2}
    assert result["at_1_micromolar_or_better"] == {"compounds": 1, "assay_types": {"B": 2}, "records_mentioning_phosphorylation": 1}
    assert [t["compound"] for t in result["most_potent"]] == ["A", "B"]
    assert chembl.dossier("P1", lambda path, **p: {"targets": []}) == {"uniprot": "P1", "chembl_target": None}


def test_a_failing_connection_is_retried_and_then_reported(monkeypatch):
    import urllib.error

    attempts = []

    def failing(*args, **kwargs):
        attempts.append(1)
        raise urllib.error.URLError("no network")

    monkeypatch.setattr(chembl.urllib.request, "urlopen", failing)
    monkeypatch.setattr(chembl.time, "sleep", lambda s: None)
    with pytest.raises(urllib.error.URLError):
        chembl.get("status")
    assert len(attempts) == 4


def test_a_response_is_kept_on_disk_so_that_a_rerun_asks_once_and_the_release_is_always_asked_afresh(monkeypatch, tmp_path):
    import io
    import json

    monkeypatch.setattr(chembl, "CACHE", tmp_path)
    opened = []

    def fake_urlopen(request, timeout):
        opened.append(request.full_url)
        return io.BytesIO(json.dumps({"page_meta": {"total_count": len(opened)}, "chembl_db_version": f"ChEMBL_{len(opened)}"}).encode())

    monkeypatch.setattr(chembl.urllib.request, "urlopen", fake_urlopen)
    first = chembl.get("activity", target_chembl_id="CHEMBL1", limit=1)
    assert chembl.get("activity", target_chembl_id="CHEMBL1", limit=1) == first and len(opened) == 1 and len(list(tmp_path.iterdir())) == 1
    chembl.get("activity", target_chembl_id="CHEMBL2", limit=1)
    assert len(opened) == 2
    assert chembl.release() != chembl.release() and len(opened) == 4 and len(list(tmp_path.iterdir())) == 2  # "status" is never cached
