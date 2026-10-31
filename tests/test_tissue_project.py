import math
import xml.etree.ElementTree as ET

import pytest

from cellproof.tissue.maboss import FATE_OF
from cellproof.tissue.project import Settings, cells_csv, disc, settings_xml

# The parts of PhysiBoSS's cell-lines sample that settings_xml reads or replaces, with a second cell type that must disappear.
TEMPLATE = """<PhysiCell_settings>
  <domain><x_min>-100</x_min><x_max>200</x_max><y_min>-100</y_min><y_max>100</y_max><z_min>-20</z_min><z_max>20</z_max>
    <dx>10</dx><dy>10</dy><dz>10</dz><use_2D>false</use_2D></domain>
  <overall><max_time units="min">200</max_time><dt_phenotype units="min">0.5</dt_phenotype></overall>
  <parallel><omp_num_threads>6</omp_num_threads></parallel>
  <save><full_data><interval units="min">10</interval><enable>true</enable></full_data><SVG><enable>true</enable></SVG><legacy_data><enable>true</enable></legacy_data></save>
  <cell_definitions>
    <cell_definition name="default" ID="0"><phenotype>
      <cycle code="2"><phase_transition_rates><rate start_index="0" end_index="1">0.3</rate><rate start_index="1" end_index="2">0.2</rate></phase_transition_rates></cycle>
      <death><model code="100" name="apoptosis"><death_rate>0.5</death_rate></model></death>
      <intracellular type="maboss"><bnd_filename>./old.bnd</bnd_filename></intracellular>
      <volume><total>1000</total></volume>
    </phenotype><custom_data><somedata>1.0</somedata></custom_data></cell_definition>
    <cell_definition name="other" ID="1"><phenotype/></cell_definition>
  </cell_definitions>
  <user_parameters><random_seed type="int">0</random_seed></user_parameters>
</PhysiCell_settings>"""


def test_the_settings_file_has_one_kind_of_cell_that_does_not_divide_and_carries_the_network_and_its_fate_outputs():
    root = ET.fromstring(settings_xml(TEMPLATE, Settings(radius=100, max_time=1000, snapshot=60, scaling=30, update=3, threads=2, seed=9)))
    assert [c.get("name") for c in root.find("cell_definitions")] == ["default"]
    assert [r.text for r in root.findall(".//cycle/phase_transition_rates/rate")] == ["0.0", "0.0"]
    assert root.find(".//model[@name='apoptosis']/death_rate").text == "0"
    assert [c.tag for c in root.find(".//custom_data")] == ["fate_" + fate for fate in FATE_OF.values()]
    block = root.find(".//phenotype/intracellular")
    assert block.get("type") == "maboss" and block.find("bnd_filename").text == "./config/model.bnd" and block.find("cfg_filename").text == "./config/model.cfg"
    assert float(block.find("settings/scaling").text) == 30 and float(block.find("settings/intracellular_dt").text) == 3
    outputs = {(o.get("intracellular_name"), o.get("physicell_name")): o.find("settings/value").text for o in block.findall("mapping/output")}
    assert outputs == {("Fate_apoptosis", "apoptosis"): "1000000.0", **{(node, f"custom:fate_{fate}"): "1" for node, fate in FATE_OF.items()}}
    assert list(root.find(".//phenotype"))[2] is block  # replaced where the old block was, so the order of the phenotype is kept
    assert root.find("user_parameters/random_seed").text == "9" and float(root.find("overall/max_time").text) == 1000
    assert root.find("domain/use_2D").text == "true" and root.find("save/SVG/enable").text == "false" and float(root.find("save/full_data/interval").text) == 60
    assert float(root.find("domain/x_max").text) % 20 == 0 and float(root.find("domain/x_max").text) >= 100 + 2 * 14  # the disc fits with a margin


def test_a_template_that_lost_an_element_is_reported_not_silently_ignored():
    with pytest.raises(KeyError, match="PhysiBoSS may have changed"):
        settings_xml(TEMPLATE.replace("<omp_num_threads>6</omp_num_threads>", ""), Settings())


def test_the_disc_is_packed_evenly_and_stays_inside_its_radius():
    points = disc(300.0, 14.0)
    assert all(math.hypot(x, y) <= 300.0 + 1e-6 for x, y in points)
    area = math.pi * 300.0**2 / (14.0**2 * math.sqrt(3) / 2)  # cells in a hexagonal packing of that area
    assert abs(len(points) - area) / area < 0.03
    sample = points[len(points) // 2]
    nearest = sorted(math.hypot(sample[0] - x, sample[1] - y) for x, y in points if (x, y) != sample)[:6]
    assert all(abs(d - 14.0) < 0.01 for d in nearest)  # six neighbours at the spacing
    assert cells_csv(points[:3]) == "".join(f"{x},{y},0,0\n" for x, y in points[:3])
