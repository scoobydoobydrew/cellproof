"""Read what a PhysiBoSS run wrote and keep what the report needs. Standard library only and no import from this package, so
the same file runs inside WSL, next to the simulation, and on Windows, in the tests.

A run leaves, every snapshot interval, `output########.xml` (the time and the names of the columns) and
`output########_cells.mat` (a MATLAB level-4 matrix: one column per cell, one row per variable). Each cell gets one state:

  0 no fate yet   1 arrest   2 senescence   3 autophagy   4 committed to apoptosis (the cell is flagged dead)   5 gone

A cell that has finished apoptosis is removed by PhysiCell and so is missing from later snapshots; that is state 5.
`python frames.py <output folder> <result.json> [--frames]` writes the counts, and with --frames one string of digits
per snapshot (one digit per cell, in the order of the first snapshot) plus the cells' positions, for the report's animation.
"""
from __future__ import annotations

import array
import json
import re
import struct
import sys
from pathlib import Path

STATES = ("none", "arrest", "senescence", "autophagy", "apoptosis", "gone")
FATE_FLAGS = (("fate_arrest", 1), ("fate_senescence", 2), ("fate_autophagy", 3))  # checked in this order after "dead"
LABEL = re.compile(r'<label index="(\d+)" size="(\d+)"[^>]*>([^<]*)</label>')
TIME = re.compile(r"<current_time[^>]*>([^<]*)</current_time>")


def read_cells(path: Path) -> tuple[int, int, array.array]:
    """(variables, cells, values) of a level-4 MAT file holding one real matrix, stored column by column."""
    raw = path.read_bytes()
    kind, rows, cols, imaginary, name_length = struct.unpack("<5i", raw[:20])
    if kind != 0 or imaginary:
        raise ValueError(f"{path.name}: not a little-endian real double matrix")
    values = array.array("d")
    start = 20 + name_length
    values.frombytes(raw[start:start + 8 * rows * cols])
    if sys.byteorder == "big":
        values.byteswap()
    return rows, cols, values


def read_snapshot(xml_path: Path) -> dict:
    xml = xml_path.read_text(encoding="utf-8")
    labels = {name: int(index) for index, _, name in LABEL.findall(xml)}
    rows, cols, values = read_cells(xml_path.with_name(xml_path.stem + "_cells.mat"))

    def row(name: str) -> list[float]:
        return list(values[labels[name]::rows])  # one variable of every cell

    x, y, z = (list(values[labels["position"] + k::rows]) for k in range(3))
    flags = {name: row(name) for name, _ in FATE_FLAGS}
    dead = row("dead")
    states = []
    for k in range(cols):
        state = 4 if dead[k] > 0.5 else 0
        if not state:
            state = next((code for name, code in FATE_FLAGS if flags[name][k] > 0.5), 0)
        states.append(state)
    return {"t": float(TIME.search(xml).group(1)), "ids": [int(v) for v in row("ID")], "x": x, "y": y, "z": z, "states": states}


def parse_run(folder: Path, frames: bool = False) -> dict:
    snapshots = [read_snapshot(p) for p in sorted(folder.glob("output????????.xml"))]
    if not snapshots:
        raise FileNotFoundError(f"no output########.xml in {folder}")
    first = snapshots[0]
    order = {cell_id: k for k, cell_id in enumerate(first["ids"])}
    out = {"cells": len(order), "times": [], "counts": [], "alive": []}
    if frames:
        out["positions"] = [[round(a, 1), round(b, 1), round(c, 1)] for a, b, c in zip(first["x"], first["y"], first["z"])]
        out["frames"] = []
    for snap in snapshots:
        counts = [0] * 6
        per_cell = [5] * len(order)
        for cell_id, state in zip(snap["ids"], snap["states"]):
            counts[state] += 1
            per_cell[order[cell_id]] = state
        counts[5] = len(order) - sum(counts[:5])
        out["times"].append(snap["t"])
        out["counts"].append(counts)
        out["alive"].append(sum(counts[:4]))
        if frames:
            out["frames"].append("".join(map(str, per_cell)))
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    result = parse_run(Path(args[0]), frames="--frames" in sys.argv)
    Path(args[1]).write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"{result['cells']} cells, {len(result['times'])} snapshots, alive at the end: {result['alive'][-1]}")
