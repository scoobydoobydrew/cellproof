import json
import struct
import subprocess
import sys
from pathlib import Path

from cellproof.tissue import frames

LABELS = {"ID": 0, "position": 1, "dead": 4, "fate_arrest": 5, "fate_senescence": 6, "fate_autophagy": 7, "fate_apoptosis": 8}
ROWS = 9


def _write_snapshot(folder: Path, index: int, time: float, cells: list[dict]) -> None:
    """A PhysiCell-shaped snapshot: an xml with the time and the column names, and a level-4 MAT file, one column per cell."""
    labels = "".join(f'<label index="{i}" size="{3 if name == "position" else 1}">{name}</label>' for name, i in LABELS.items())
    (folder / f"output{index:08d}.xml").write_text(f'<root><current_time units="min">{time}</current_time><labels>{labels}</labels></root>', encoding="utf-8")
    data = []
    for cell in cells:
        column = [0.0] * ROWS
        column[LABELS["ID"]] = cell["id"]
        column[1:4] = cell.get("xyz", (0.0, 0.0, 0.0))
        for name in ("dead", "fate_arrest", "fate_senescence", "fate_autophagy", "fate_apoptosis"):
            column[LABELS[name]] = float(cell.get(name, 0))
        data += column
    name = b"cells\x00"
    payload = struct.pack("<5i", 0, ROWS, len(cells), 0, len(name)) + name + struct.pack(f"<{len(data)}d", *data)
    (folder / f"output{index:08d}_cells.mat").write_bytes(payload)


def _run(tmp_path: Path) -> Path:
    _write_snapshot(tmp_path, 0, 0.0, [{"id": i, "xyz": (float(i), 2.0 * i, 0.0)} for i in range(4)])
    _write_snapshot(tmp_path, 1, 60.0, [{"id": 0, "dead": 1, "fate_apoptosis": 1}, {"id": 1, "fate_senescence": 1}, {"id": 3}])  # cell 2 is gone
    _write_snapshot(tmp_path, 2, 120.0, [{"id": 1, "fate_arrest": 1, "fate_senescence": 1}, {"id": 3, "fate_autophagy": 1}])
    return tmp_path


def test_each_cell_gets_one_state_and_a_cell_missing_from_a_snapshot_counts_as_gone(tmp_path):
    result = frames.parse_run(_run(tmp_path), frames=True)
    assert result["cells"] == 4 and result["times"] == [0.0, 60.0, 120.0]
    assert result["counts"] == [[4, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 0, 2]]  # none, arrest, senescence, autophagy, apoptosis, gone
    assert result["alive"] == [4, 2, 2]
    assert result["frames"] == ["0000", "4250", "5153"]  # one digit per cell in the order of the first snapshot
    assert result["positions"] == [[0.0, 0.0, 0.0], [1.0, 2.0, 0.0], [2.0, 4.0, 0.0], [3.0, 6.0, 0.0]]
    assert len(frames.STATES) == 6


def test_a_dead_flag_wins_over_the_fate_flags_and_arrest_over_senescence(tmp_path):
    _write_snapshot(tmp_path, 0, 0.0, [{"id": 0, "dead": 1, "fate_arrest": 1}, {"id": 1, "fate_arrest": 1, "fate_senescence": 1}])
    assert frames.parse_run(tmp_path)["counts"] == [[0, 1, 0, 0, 1, 0]]


def test_the_file_also_works_as_a_script_inside_wsl_style_use(tmp_path):
    folder = tmp_path / "output"
    folder.mkdir()
    _run(folder)
    target = tmp_path / "result.json"
    done = subprocess.run([sys.executable, "-I", frames.__file__, str(folder), str(target)], capture_output=True, text=True)
    assert done.returncode == 0 and "4 cells, 3 snapshots" in done.stdout
    result = json.loads(target.read_text(encoding="utf-8"))
    assert "frames" not in result and result["alive"] == [4, 2, 2]  # without --frames only the counts are kept
