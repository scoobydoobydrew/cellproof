import json
import re
from pathlib import Path

import pytest

from cellproof.report.build import WEB, parts
from cellproof.report.data import _rle, downstream_block, tissue_block

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "results" / "tissue"
stored = (FOLDER / "summary.json").exists()


def _decode(text: str) -> str:
    """What tissue.js does with a frame."""
    return "".join(digit * int(run) for digit, run in re.findall(r"(\d)(\d+),", text))


def test_run_length_coding_of_the_frames_round_trips_and_is_what_the_page_decodes():
    for frame in ("", "0", "0000115", "5" * 1663, "0123450123", "4" * 9 + "5" * 10):
        assert _decode(_rle(frame)) == frame
    assert _rle("0000115") == "04,12,51,"


@pytest.mark.skipif(not stored, reason="results/tissue has not been written")
def test_the_tissue_block_states_only_facts_that_the_stored_runs_bear_out():
    block = tissue_block()
    summary = json.loads((FOLDER / "summary.json").read_text(encoding="utf-8"))
    rows = {r["name"]: r for r in summary["rows"]}
    f = block["facts"]
    assert f["cells"] == rows["radiation_only"]["cells"] == len(block["positions"])
    assert f["radiation"]["alive"] == rows["radiation_only"]["alive_end"] and f["radiation"]["alive"] + f["radiation"]["dead"] == f["cells"]
    assert f["hits"]["count"] == f["misses"]["count"] == f["long"]["count"] == 11
    assert f["hits"]["agree"] == f["misses"]["agree"] == 11 and f["long"]["none_alive"] == 11 and f["hits"]["none_alive"] == sum(r["alive_end"] == 0 for r in summary["rows"] if r["group"] == "hit")
    assert f["hits"]["most_alive"] == max(r["alive_end"] for r in summary["rows"] if r["group"] == "hit")
    shown = next(c for c in block["conditions"] if c["name"] == "hit_03")
    original = json.loads((FOLDER / "hit_03.json").read_text(encoding="utf-8"))["frames"]
    assert [_decode(x) for x in shown["frames"]] == original  # the page gets exactly what the simulator wrote
    assert not any("frames" in c for c in block["conditions"] if c["group"] == "long")  # the long runs only feed the log chart


@pytest.mark.skipif(not (ROOT / "results" / "compounds.json").exists(), reason="results/compounds.json has not been written")
def test_the_chemistry_block_names_the_solvers_proteins_first_and_flags_assays_that_mention_phosphorylation():
    proteins = downstream_block()["compounds"]["proteins"]
    assert [p["symbol"] for p in proteins] == ["PTEN", "RB1", "ATR", "CHEK1", "CHEK2", "WEE1", "PRKDC"]
    by = {p["symbol"]: p for p in proteins}
    assert by["PTEN"]["sets"] == ["hit_03"] and by["RB1"]["sets"] == ["hit_04"] and not by["ATR"]["sets"]
    assert by["PTEN"]["chembl"]["records"]["pchembl_6_or_more"] == 0
    strong = by["RB1"]["chembl"]["at_1_micromolar_or_better"]
    assert strong["records_mentioning_phosphorylation"] == by["RB1"]["chembl"]["records"]["pchembl_6_or_more"] > 0  # every strong record is a readout
    assert all(p["only_apoptosis"] for p in (by["PTEN"], by["RB1"])) and not any(by[s]["only_apoptosis"] for s in ("ATR", "CHEK1", "CHEK2", "WEE1", "PRKDC"))


def test_the_page_has_the_tissue_section_and_its_script_is_part_of_the_build():
    head, body, script = parts({"x": 1})
    assert 'id="tissue"' in body and 'id="tCanvas"' in body and 'id="downCard"' in body and "Tissue what-if" in script
    assert (WEB / "tissue.js").read_text(encoding="utf-8").startswith("/* Tissue what-if.")
    page = (WEB / "tissue.js").read_text(encoding="utf-8")
    for word in ("clinical trial", "proof", "patient"):
        assert word not in page.lower().replace("not a prediction for any patient", "").replace("no patient", "").replace("not a clinical trial", ""), word
