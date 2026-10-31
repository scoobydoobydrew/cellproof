"""A PhysiBoSS settings file for a tissue of cells that each carry the project's Boolean network, and the layout of the cells.

The settings file is made by patching the one of PhysiBoSS's own cell-lines sample, read from the installed PhysiBoSS at build
time and not copied into this repository. What is patched is listed in `Settings`: all of it is an assumption of the
experiment (docs/tissue_notes.md), none of it a measurement.
"""
from __future__ import annotations

import math
import xml.etree.ElementTree as ET
from dataclasses import dataclass

from cellproof.tissue.maboss import FATE_OF

VOXEL = 20.0  # micron, side of a voxel of the (here unused) diffusion grid
FATE_VARIABLES = {node: "fate_" + fate for node, fate in FATE_OF.items()}  # custom data of a cell, one flag per fate


@dataclass(frozen=True)
class Settings:
    radius: float = 400.0  # micron: the tissue is a disc of cells
    spacing: float = 14.0  # micron between neighbouring cell centres (hexagonal packing; the cells are 12.4 micron across)
    max_time: float = 4320.0  # minutes of tissue time: 72 hours
    snapshot: float = 180.0  # minutes between two saved snapshots
    scaling: float = 60.0  # minutes of tissue time per MaBoSS time unit: one unit is one hour
    update: float = 6.0  # minutes between two updates of the network inside a cell
    apoptosis_rate: float = 1e6  # per minute while Fate_apoptosis is on; this large the cell is committed at the next step
    threads: int = 16
    seed: int = 1


def disc(radius: float, spacing: float) -> list[tuple[float, float]]:
    """Centres of a hexagonally packed disc of cells."""
    height = spacing * math.sqrt(3) / 2
    points = []
    for row in range(-int(radius / height) - 1, int(radius / height) + 2):
        y = row * height
        for col in range(-int(radius / spacing) - 2, int(radius / spacing) + 3):
            x = (col + 0.5 * (row % 2)) * spacing
            if x * x + y * y <= radius * radius:
                points.append((round(x, 3), round(y, 3)))
    return points


def cells_csv(points: list[tuple[float, float]]) -> str:
    return "".join(f"{x},{y},0,0\n" for x, y in points)


def _text(root: ET.Element, path: str, value) -> None:
    node = root.find(path)
    if node is None:
        raise KeyError(f"the template has no <{path}>; PhysiBoSS may have changed its sample")
    node.text = str(value)


def _output(intracellular_name: str, physicell_name: str, value: float, base_value: float) -> ET.Element:
    output = ET.Element("output", intracellular_name=intracellular_name, physicell_name=physicell_name)
    settings = ET.SubElement(output, "settings")
    for tag, content in (("action", "activation"), ("value", value), ("base_value", base_value), ("smoothing", 0)):
        ET.SubElement(settings, tag).text = str(content)
    return output


def _intracellular(s: Settings) -> ET.Element:
    block = ET.Element("intracellular", type="maboss")
    ET.SubElement(block, "bnd_filename").text = "./config/model.bnd"
    ET.SubElement(block, "cfg_filename").text = "./config/model.cfg"
    settings = ET.SubElement(block, "settings")
    for tag, content in (("intracellular_dt", s.update), ("time_stochasticity", 0.0), ("scaling", s.scaling), ("start_time", 0.0)):
        ET.SubElement(settings, tag).text = str(content)
    ET.SubElement(settings, "inheritance", {"global": "False"})
    mapping = ET.SubElement(block, "mapping")
    mapping.append(_output("Fate_apoptosis", "apoptosis", s.apoptosis_rate, 0))  # the one behaviour the network drives
    for node, variable in FATE_VARIABLES.items():  # flags, so that each cell's fate is in the saved data
        mapping.append(_output(node, f"custom:{variable}", 1, 0))
    return block


def settings_xml(template: str, s: Settings) -> str:
    root = ET.fromstring(template)
    half = math.ceil((s.radius + 2 * s.spacing) / VOXEL) * VOXEL
    for tag, value in (("x_min", -half), ("x_max", half), ("y_min", -half), ("y_max", half), ("z_min", -VOXEL / 2), ("z_max", VOXEL / 2),
                       ("dx", VOXEL), ("dy", VOXEL), ("dz", VOXEL), ("use_2D", "true")):
        _text(root, f"domain/{tag}", value)
    _text(root, "overall/max_time", s.max_time)
    _text(root, "overall/dt_phenotype", s.update)
    _text(root, "parallel/omp_num_threads", s.threads)
    _text(root, "save/full_data/interval", s.snapshot)
    _text(root, "save/SVG/enable", "false")
    _text(root, "save/legacy_data/enable", "false")
    _text(root, "user_parameters/random_seed", s.seed)

    definitions = root.find("cell_definitions")
    for definition in list(definitions):
        if definition.get("name") != "default":
            definitions.remove(definition)  # one kind of cell
    default = definitions.find("cell_definition[@name='default']")
    for rate in default.findall("phenotype/cycle/phase_transition_rates/rate"):
        rate.text = "0.0"  # the cells do not divide: the experiment counts deaths and fates, not regrowth
    _text(default, "phenotype/death/model[@name='apoptosis']/death_rate", 0)
    custom = default.find("custom_data")
    custom.clear()
    for variable in FATE_VARIABLES.values():
        ET.SubElement(custom, variable, {"conserved": "false", "units": "dimensionless", "description": ""}).text = "0.0"
    phenotype = default.find("phenotype")
    old = phenotype.find("intracellular")
    position = list(phenotype).index(old)
    phenotype.remove(old)
    phenotype.insert(position, _intracellular(s))
    ET.indent(root, space="    ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
