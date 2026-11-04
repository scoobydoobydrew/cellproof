"""What a person's D4 answers mean for the scored claims: read only, the frozen item file is never touched."""
import csv

from cellproof.eval.report import d4_markdown, d4_summary


def _row(item, claim, verdict, baseline, category="scoreable"):
    return {"item": item, "claim": claim, "category": category, "verdict": verdict, "baseline": baseline}


def _check(tmp_path, answers):
    path = tmp_path / "d4.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "item", "verdict", "note"])
        writer.writeheader()
        writer.writerows({"id": i, "item": i.split("#")[0], "verdict": v, "note": ""} for i, v in answers)
    return path


SCORED = {
    "base": [_row("H01", 0, "correct", "wrong"), _row("H02", 0, "wrong", "correct"), _row("H03", 0, "wrong", "correct"),
             _row("H05", 0, "wrong", "wrong", category="survival_level")],
    "aug": [_row("H01", 0, "correct", "wrong"), _row("H02", 0, "correct", "correct"), _row("H03", 0, "wrong", "correct"),
            _row("H05", 0, "wrong", "wrong", category="survival_level")],
}


def test_a_flagged_scored_claim_is_counted_with_and_without(tmp_path):
    path = _check(tmp_path, [("H01#1", "supports"), ("H02#1", "supports"), ("H03#1", "does_not_support"), ("H05#1", "does_not_support")])
    d4 = d4_summary(SCORED, path)
    assert (d4["checked"], d4["supports"], d4["does_not_support"], d4["unsure"]) == (4, 2, 2, 0)
    assert d4["flagged_scored"] == ["H03.1"] and d4["scored"] == 3 and d4["without"]["claims"] == 2
    assert d4["without"]["totals"]["base"] == {"correct": 1, "wrong": 1, "not_expressible": 0}
    assert d4["without"]["totals"]["aug"] == {"correct": 2, "wrong": 0, "not_expressible": 0}
    assert d4["without"]["baseline"] == {"correct": 1, "wrong": 1, "not_expressible": 0}
    assert "H03.1" in d4_markdown(d4) and "| aug | 2 | 0 | 0 |" in d4_markdown(d4)


def test_nothing_is_reported_before_a_person_has_answered(tmp_path):
    assert d4_summary(SCORED, tmp_path / "missing.csv") is None
    assert d4_summary(SCORED, _check(tmp_path, [("H01#1", ""), ("H02#1", "")])) is None
