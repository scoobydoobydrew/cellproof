"""The project's Boolean network as the files PhysiBoSS (MaBoSS) reads, with the four fates as separate output nodes.

Every node keeps its bnet rule word for word (MaBoSS reads `!`, `&` and `|` the way this project does) and flips at one fixed
rate whenever its rule disagrees with its state: the asynchronous semantics of the exact checker, whose fixed points are
the stable states of this simulation too. A knock-out or a forced gene is the rule replaced by the constant, exactly as
`analysis.attractors.perturb` does. The fates are extra nodes that only read the network and feed nothing: each is on
exactly when `network.phenotypes.classify` returns that fate for a damaged cell (a test checks it state by state), because
PhysiBoSS can connect one node, not a pattern of nodes, to a behaviour of the cell.

The rates are not measurements. They set only how fast things happen relative to each other, never which end states exist.
"""
from __future__ import annotations

from cellproof.analysis.attractors import fixed_points, perturb

RATE = 1.0  # every node of the network, per MaBoSS time unit
READOUT_RATE = 20.0  # the output nodes only report the network, so they follow it quickly

READOUTS: dict[str, str] = {
    "Fate_apoptosis": "DNA_damage & p53_K & BAX & Caspase & !ULK1_Beclin1",
    "Fate_autophagy": "DNA_damage & p53_K & BAX & Caspase & ULK1_Beclin1",
    "Fate_senescence": "DNA_damage & !(p53_K & BAX & Caspase) & p53_A & p21 & mTORC1 & mTORC2",
    "Fate_arrest": "DNA_damage & !(p53_K & BAX & Caspase) & p53_A & p21 & Wip1 & !(mTORC1 & mTORC2)",
}
FATE_OF = {node: node.removeprefix("Fate_") for node in READOUTS}


def _node(name: str, rule: str, rate: str) -> str:
    return (f"Node {name} {{\n  logic = {rule};\n  rate_up = @logic ? {rate} : 0;\n  rate_down = @logic ? 0 : {rate};\n}}\n")


def bnd(rules: dict[str, str], setting: dict[str, int] | None = None) -> str:
    """The network file: the (perturbed) rules, then the four output nodes."""
    nodes = [_node(node, rule, "$rate") for node, rule in perturb(rules, setting or {}).items()]
    nodes += [_node(node, rule, "$readout_rate") for node, rule in READOUTS.items()]
    return "\n".join(nodes)


def healthy_state(rules: dict[str, str]) -> dict[str, int]:
    """The state of an undamaged cell: the one fixed point of the network without DNA damage."""
    states = fixed_points(perturb(rules, {"DNA_damage": 0}))
    if len(states) != 1:
        raise ValueError(f"an undamaged cell needs exactly one stable state, this network has {len(states)}")
    return states[0]


def start_state(rules: dict[str, str], setting: dict[str, int] | None = None) -> dict[str, int]:
    """A healthy cell at the moment of irradiation, with the intervention applied: DNA damage on, the forced genes at their
    forced values, every other gene where it was. The output nodes start at what the network says."""
    state = {**healthy_state(rules), **(setting or {}), "DNA_damage": 1}
    return {**state, **{node: 0 for node in READOUTS}}


def cfg(state: dict[str, int], *, seed: int = 1, max_time: float = 1.0) -> str:
    """The run file: the two rates, the simulation settings PhysiBoSS needs to read, and every node's start state."""
    lines = [f"$rate = {RATE};", f"$readout_rate = {READOUT_RATE};", "",
             "discrete_time = 0;", "use_physrandgen = FALSE;", f"seed_pseudorandom = {seed};", "sample_count = 1;",
             f"max_time = {max_time};", "time_tick = 0.1;", "thread_count = 1;", ""]
    lines += [f"{node}.istate = {int(value)};" for node, value in state.items()]
    return "\n".join(lines) + "\n"
