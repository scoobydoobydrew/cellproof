"""Run PhysiBoSS (built by scripts/physiboss_setup.sh) from Python: stage the files of one condition, run it inside WSL,
parse the output there with frames.py and bring the small result back. The simulation itself never leaves WSL."""
from __future__ import annotations

import json
import os
import subprocess
import time
from pathlib import Path

from cellproof.tissue import frames as frames_module
from cellproof.tissue.maboss import bnd, cfg, start_state
from cellproof.tissue.project import Settings, cells_csv, disc, settings_xml

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "results" / "tissue"
DISTRO = "Ubuntu"
HOME = "$HOME/cellproof_external"


def wsl_path(path: Path) -> str:
    """C:\\Users\\x\\y becomes /mnt/c/Users/x/y."""
    path = path.resolve()
    return f"/mnt/{path.drive[0].lower()}/" + "/".join(path.parts[1:])


def wsl(script: str, timeout: float) -> subprocess.CompletedProcess:
    """Run a bash script in WSL. Bytes in and out: text mode on Windows would turn every newline of the script into CRLF."""
    done = subprocess.run(["wsl.exe", "-d", DISTRO, "--", "bash", "-s"], input=script.replace("\r\n", "\n").encode("utf-8"), capture_output=True,
                          timeout=timeout, env={**os.environ, "MSYS_NO_PATHCONV": "1"})
    return subprocess.CompletedProcess(done.args, done.returncode, done.stdout.decode("utf-8", "replace"), done.stderr.decode("utf-8", "replace"))


def template_xml() -> str:
    """The settings file of PhysiBoSS's cell-lines sample, read from the installed copy."""
    done = wsl(f'cat "{HOME}/PhysiBoSS/sample_projects_intracellular/boolean/physiboss_cell_lines/config/PhysiCell_settings.xml"', 120)
    if done.returncode:
        raise RuntimeError("PhysiBoSS is not installed in WSL; run scripts/physiboss_setup.sh first\n" + done.stderr[-500:])
    return done.stdout


def stage(name: str, rules: dict[str, str], setting: dict[str, int], settings: Settings, template: str) -> Path:
    """Write the four files PhysiBoSS reads for one condition; returns the folder."""
    folder = OUT / "staging" / name / "config"
    folder.mkdir(parents=True, exist_ok=True)
    state = start_state(rules, setting)
    max_time = settings.max_time / settings.scaling
    files = {"model.bnd": bnd(rules, setting), "model.cfg": cfg(state, seed=settings.seed, max_time=max_time),
             "PhysiCell_settings.xml": settings_xml(template, settings), "cells.csv": cells_csv(disc(settings.radius, settings.spacing))}
    for file, text in files.items():
        (folder / file).write_text(text, encoding="utf-8", newline="\n")
    return folder


def simulate(name: str, rules: dict[str, str], setting: dict[str, int], settings: Settings, template: str, *, keep_frames: bool = False,
             timeout: float = 3600) -> dict:
    """Run one condition and return the parsed result (also written to results/tissue/<name>.json)."""
    folder = stage(name, rules, setting, settings, template)
    result_path = OUT / f"{name}.json"
    flag = "--frames" if keep_frames else ""
    script = f"""set -euo pipefail
RUN="{HOME}/runs/{name}"
rm -rf "$RUN"; mkdir -p "$RUN/config" "$RUN/output"
cp "{wsl_path(folder)}/"* "$RUN/config/"
cd "$RUN"
if ! "{HOME}/PhysiBoSS/PhysiBoSS_Cell_Lines" config/PhysiCell_settings.xml > run.log 2>&1; then tail -40 run.log >&2; exit 1; fi
python3 "{wsl_path(Path(frames_module.__file__))}" "$RUN/output" "{wsl_path(result_path)}" {flag}
rm -rf "$RUN/output"
"""
    started = time.time()
    done = wsl(script, timeout)
    if done.returncode:
        raise RuntimeError(f"{name}: the simulation failed\n{done.stderr[-1500:]}")
    result = json.loads(result_path.read_text(encoding="utf-8"))
    result.update({"name": name, "setting": setting, "seed": settings.seed, "apoptosis_rate": settings.apoptosis_rate,
                   "wall_seconds": round(time.time() - started, 1)})
    result_path.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    return result
