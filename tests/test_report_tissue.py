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


@pytest.mark.skipif(not (ROOT / "results" / "sequences.json").exists() or not (ROOT / "results" / "genotypes.json").exists(), reason="results/sequences.json or results/genotypes.json has not been written")
def test_the_sequence_and_genotype_blocks_state_only_what_the_stored_files_say():
    blocks = downstream_block()
    sq, gt = blocks["sequences"], blocks["genotypes"]
    stored = json.loads((ROOT / "results" / "sequences.json").read_text(encoding="utf-8"))
    assert sq["validation"]["total"] == 23 and sq["validation"]["v1_fates_within_reachable"] == 15 and sq["validation"]["v2_survival_matches"] == 23
    assert sq["validation"]["v1_failed"] == ["hit_03", "hit_05", "hit_06", "hit_07", "miss_01", "miss_02", "miss_03", "miss_07"]
    assert sq["settled"]["survive"] == ["apoptosis", "senescence"] and sq["visit"]["survive"] == ["senescence"] and sq["all_attractors"] == ["apoptosis", "arrest", "autophagy", "senescence"]
    for death in ("settled", "visit"):
        assert sq[death]["h2_only"] == sq[death]["h2_only_with_single_hit"] and sq[death]["sequence_only"] == 0  # what the page says about pairs that work only in some order
        assert sq[death]["h1_only"] == stored[death]["summary"]["h1_only"]
    assert [r["alive"] for r in sq["novel"]] == [0, 0, 0] and all(r["cells"] == 1663 for r in sq["novel"]) and sq["hours"] == 72
    assert sq["visit"]["at_once_only"] == ["AMPK_MAPK KO + CHK1 KO"] and sq["visit"]["at_once_stuck"] == ["senescence"]  # the sentence of the card about the pair that works only at once
    assert sq["s2"] == {"triples": 1771, "searched": 1122, "sequences": 14586, "hits": 0, "sequence_only": 0}
    g = json.loads((ROOT / "results" / "genotypes.json").read_text(encoding="utf-8"))
    assert gt["r1"]["samples"] == gt["r2"]["samples"] == 9896 and gt["r1"]["tp53_lost"] == g["r1"]["tp53_lost"] and len(gt["r1"]["sets"]) == 11
    assert (gt["r1"]["any_works"], gt["r2"]["any_works"]) == (8236, 5907)  # the green dots of the story
    assert gt["r1"]["searched"] == gt["r2"]["searched"] == 20 and (gt["r1"]["searched_tp53_lost"], gt["r2"]["searched_tp53_lost"]) == (5, 11)
    assert gt["r1"]["searched_tp53_lost_found"] == gt["r2"]["searched_tp53_lost_found"] == 0 and gt["r1"]["alone_lost_only_apoptosis"] == 0  # the sentences of the genotype card
    assert all(s["lost"] == 0 for r in ("r1", "r2") for s in gt[r]["sets"])


def test_the_page_has_the_tissue_section_and_its_script_is_part_of_the_build():
    head, body, script = parts({"x": 1})
    assert 'id="tissue"' in body and 'id="tCanvas"' in body and 'id="downCard"' in body and "Tissue what-if" in script
    assert 'id="story"' not in body  # no long story between the header and the demo
    assert body.index('id="top"') < body.index('id="how"') < body.index('id="bench"') < body.index('id="search"') < body.index('id="honest"') < body.index('id="tech"') < body.index('id="notebook"')  # the header, how it works, the demo, the search engine, what this is and is not, and only then the technical part
    inside = body[body.index('id="tech"'):body.index("</main>")]
    assert all(f'id="{name}"' in inside for name in ("notebook", "model", "agent", "cases", "evidence", "tissue", "limits"))  # everything technical waits behind one door
    assert '<div id="tech" class="tech" data-open="0">' in body and body.count("data-tech-toggle") == 2 and 'id="namesBtn"' in body and 'id="howFlow"' in body and body.count('class="how-step"') == 6
    nav = body[body.index("<nav"):body.index("</nav>")]
    assert nav.count("<a ") == 3 and 'href="#tech"' in nav and body.count('class="hon-cards"') == 1 and body.count('<li class="mid">') >= 2
    assert body.index('<div class="wrap"><footer>') > body.index("</main>")  # the footer with the commit and the hash of the held-out set stays outside the door
    assert all(f'data-b="{n}"' in body for n in range(1, 9)) and body.count('<button type="button"></button>') == 8 and 'id="playHero"' in body  # eight beats, one bar each
    assert 'id="bTumour"' in body and 'data-scale="tumour"' in body and "makeTumour" in script and "tissueFrames" in script and "drawSamples" in script
    assert 'id="sxBoard"' in body and 'id="sxProfiles"' in body and "The search engine" in script and "Play the demo" in script
    assert 'id="seqCard"' in body and 'id="genoCard"' in body and "Does the order of the changes matter?" in script and "Do the answers survive a tumour's genotype?" in script
    assert (WEB / "tissue.js").read_text(encoding="utf-8").startswith("/* Tissue what-if.")
    assert not (WEB / "story.js").exists()
    video = (WEB / "video.js").read_text(encoding="utf-8")
    assert '/^#(video|intro)/.test(location.hash)' in video and "CPBench.play(SPEED)" in video and "CPHero.pin(true)" in video  # the recording mode exists only behind #video, and plays the page's own demo and beats
    assert '"video.js"' in (WEB.parent / "build.py").read_text(encoding="utf-8")
    assert '"how.js", "close.js"' in (WEB.parent / "build.py").read_text(encoding="utf-8")
    for name in ("tissue.js", "search.js", "bench.js", "video.js", "how.js", "close.js", "core.js"):
        page = (WEB / name).read_text(encoding="utf-8")
        for word in ("clinical trial", "proof", "patient", "personalis", "cure"):
            assert word not in page.lower().replace("cellproof", "").replace("not a prediction for any patient", "").replace("no patient", "").replace("not a clinical trial", "").replace("before there is <em>proof.</em>", "").replace("we did not find a cure for cancer", "").replace("a cure for cancer", "")  # the opening says that the project began before there was any proof, which is the opposite of claiming one, (name, word)
