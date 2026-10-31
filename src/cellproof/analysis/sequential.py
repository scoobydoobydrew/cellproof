"""Start-aware and sequential analysis of interventions (docs/sequential_protocol.md, written before any result).

`analysis.interventions` asks which small sets of changed genes leave apoptosis as the only stable end state of a damaged cell,
whatever state it starts in. Two further questions are asked here, both exactly (symbolic forward reachability and attractors of
the asynchronous network, no sampling):

  H0  every attractor of the perturbed network is an apoptosis fixed point (the same question over all attractors, cycles included);
  H1  starting from the healthy cell at the moment of irradiation, every attractor the cell can still reach is one;
  H2  the same after an ordered list of stages: a stage is a set of literals applied together, the cell settles in an attractor
      before the next stage, and the next stage's nodes are set in every state of the attractors the cells settled in.

Two meanings of "dead" are computed (`death`), the second added to the protocol after the first results were seen (Amendment 1):

  settled  a cell is dead when it has settled in an apoptosis fixed point (the protocol's first meaning);
  visit    a cell is dead as soon as it enters any state that `classify` calls apoptosis, and it survives if it can avoid all of
           them for ever (an attractor with no apoptosis state, reached without touching one). The tissue runs commit a cell the
           first time its apoptosis node switches on, so this is the meaning the simulation implements.

A dead cell receives no later stage. The idea is Mandon et al. 2019 (waiting between perturbations lets the dynamics prepare the
ground); this is the special case of permanent literals applied after settling, not their algorithm. A hit is a statement about
the model.
"""
from __future__ import annotations

from collections.abc import Iterator
from itertools import combinations
from typing import NamedTuple

import biodivine_aeon as aeon

from cellproof.analysis.attractors import perturb
from cellproof.analysis.interventions import READOUT_NODES
from cellproof.network.bnet import format_bnet
from cellproof.network.phenotypes import classify
from cellproof.tissue.maboss import healthy_state

Literal = tuple[str, int]
Stage = frozenset[Literal]
OSCILLATION = "oscillation"  # an attractor of more than one state
UNCLASSIFIED = "unclassified"  # a fixed point that matches none of the model's phenotypes
BRIEF_KINASES = ("ATR", "CHK1", "CHK2", "Wee1", "DNA_PK")  # the five named in the project brief, as nodes of the model


class Reached(NamedTuple):
    held: frozenset[Literal]  # every literal in force after this stage
    labels: tuple[str, ...]  # the fates of the attractors that can still be reached, sorted, one entry per attractor (in `visit` meaning: of those that can survive)
    alive: object | None  # the attractors a cell can survive in, as a set in this stage's graph; None when no cell is left alive


def label(attractor) -> str:
    """The model's phenotype of a fixed point, `unclassified` if it matches none, `oscillation` for an attractor of several states."""
    vertices = attractor.vertices()
    if vertices.cardinality() > 1:
        return OSCILLATION
    state = next(iter(vertices.items())).to_named_dict()
    return classify({node: int(value) for node, value in state.items()}) or UNCLASSIFIED


def fate_patterns(graph) -> dict[str, object]:
    """The states of `graph` that `network.phenotypes.classify` calls apoptosis, autophagy, senescence or arrest (DNA damage is on in every
    graph built here). A test checks that this equals `classify` on random states."""
    def sub(**values: bool):
        return graph.mk_subspace(values)

    like = sub(p53_K=True, BAX=True, Caspase=True)
    rest = graph.mk_unit_colored_vertices().minus(like)
    senescence = rest.intersect(sub(p53_A=True, p21=True, mTORC1=True, mTORC2=True))
    arrest = rest.intersect(sub(p53_A=True, p21=True, Wip1=True)).minus(senescence)
    return {"apoptosis": like.intersect(sub(ULK1_Beclin1=False)), "autophagy": like.intersect(sub(ULK1_Beclin1=True)), "senescence": senescence, "arrest": arrest}


def offered_nodes(rules: dict[str, str]) -> list[str]:
    """The nodes a literal may name: the same offer as the solver's search (readout nodes are the outcome, not an intervention)."""
    return sorted(n for n in rules if n not in READOUT_NODES)


class Explorer:
    """One model, with every perturbed network, its attractors and every stage computed once."""

    def __init__(self, rules: dict[str, str], death: str = "settled"):
        if death not in ("settled", "visit"):
            raise ValueError(f"death is 'settled' or 'visit', not {death!r}")
        self.rules = rules
        self.death = death
        self.healthy = healthy_state(rules)
        self._graphs: dict[frozenset[Literal], aeon.AsynchronousGraph] = {}
        self._attractors: dict[frozenset[Literal], list[tuple[object, str]]] = {}
        self._reached: dict[tuple[Stage, ...], Reached] = {}

    def graph(self, held: frozenset[Literal]) -> aeon.AsynchronousGraph:
        if held not in self._graphs:
            rules = perturb(self.rules, {"DNA_damage": 1, **dict(held)})
            # from_bnet declares every variable of a rule as essential; the regulatory graph is re-inferred from the update functions
            network = aeon.BooleanNetwork.from_bnet(format_bnet(rules)).infer_valid_graph()
            self._graphs[held] = aeon.AsynchronousGraph(network)
        return self._graphs[held]

    def attractors(self, held: frozenset[Literal]) -> list[tuple[object, str]]:
        """Every attractor of the network with these literals held and DNA damage on, with its fate."""
        if held not in self._attractors:
            self._attractors[held] = [(a, label(a)) for a in aeon.Attractors.attractors(self.graph(held))]
        return self._attractors[held]

    def reached(self, stages: tuple[Stage, ...]) -> Reached:
        if stages in self._reached:
            return self._reached[stages]
        held = frozenset().union(*stages)
        if len({node for node, _ in held}) != len(held):
            raise ValueError("a node can be named in one stage only")
        graph = self.graph(held)
        if len(stages) == 1:
            state = {**self.healthy, "DNA_damage": 1, **dict(stages[0])}
            start = graph.mk_subspace({node: bool(value) for node, value in state.items()})
        else:
            before = self.reached(stages[:-1])
            if before.alive is None:  # every cell was already dead
                self._reached[stages] = Reached(held, (), None)
                return self._reached[stages]
            start = graph.transfer_from(before.alive, self.graph(before.held))
            for node, value in stages[-1]:
                # the new nodes take their forced values at once: states that already have it stay, the others take one step of that node
                variable = graph.find_network_variable(node)
                start = start.intersect(graph.mk_subspace({node: bool(value)})).union(graph.var_post(variable, start))
        if self.death == "settled":
            reach = aeon.Reachability.reach_fwd(graph, start)
            found = [(a, lab) for a, lab in self.attractors(held) if not a.intersect(reach).is_empty()]
            survivors = [(a, lab) for a, lab in found if lab != "apoptosis"]
        else:
            dead = fate_patterns(graph)["apoptosis"]
            start = start.minus(dead)  # a cell that starts in, or is set into, an apoptosis state is already dead
            if start.is_empty():
                self._reached[stages] = Reached(held, (), None)
                return self._reached[stages]
            # the cell survives if it can reach an attractor with no apoptosis state without touching one: reach within the states that are not
            reach = aeon.Reachability.reach_fwd(graph.restrict(graph.mk_unit_colored_vertices().minus(dead)), start)
            survivors = [(a, lab) for a, lab in self.attractors(held) if a.intersect(dead).is_empty() and not a.intersect(reach).is_empty()]
            found = survivors
        alive = None
        for a, _ in survivors:
            alive = a if alive is None else alive.union(a)
        self._reached[stages] = Reached(held, tuple(sorted(lab for _, lab in found)), alive)
        return self._reached[stages]

    def visited_fates(self, held: frozenset[Literal]) -> set[str]:
        """The phenotypes of every state a healthy irradiated cell can pass through, transient or not (an upper bound for what a simulation can show)."""
        graph = self.graph(held)
        state = {**self.healthy, "DNA_damage": 1, **dict(held)}
        reach = aeon.Reachability.reach_fwd(graph, graph.mk_subspace({node: bool(value) for node, value in state.items()}))
        return {name for name, pattern in fate_patterns(graph).items() if not pattern.intersect(reach).is_empty()}

    def forget(self) -> None:
        """Drop every cached graph, attractor and stage (a long search would otherwise keep all of them in memory)."""
        self._graphs.clear()
        self._attractors.clear()
        self._reached.clear()

    def size(self) -> int:
        return len(self._graphs)

    def h0(self, held: frozenset[Literal]) -> bool:
        """Every attractor of the perturbed network, from any start, is an apoptosis fixed point."""
        return all(lab == "apoptosis" for _, lab in self.attractors(held))

    def h1(self, held: frozenset[Literal]) -> bool:
        """One stage from the healthy start: no cell can survive."""
        return self.reached((held,)).alive is None

    def h2(self, stages: tuple[Stage, ...]) -> bool:
        return self.reached(stages).alive is None

    def fates(self, stages: tuple[Stage, ...]) -> dict[str, list[str]]:
        """After each stage, the fates of the attractors a cell can still reach, in order (the trace of a sequence)."""
        return {"after_stage_" + str(i + 1): list(self.reached(stages[: i + 1]).labels) for i in range(len(stages))}


def ordered_partitions(items: tuple[Literal, ...]) -> Iterator[tuple[Stage, ...]]:
    """Every way to apply `items` in stages: an ordered list of non-empty sets that together are all of them (one stage is `all at once`)."""
    if not items:
        yield ()
        return
    for size in range(1, len(items) + 1):
        for first in combinations(items, size):
            rest = tuple(i for i in items if i not in first)
            for tail in ordered_partitions(rest):
                yield (frozenset(first), *tail)


def stage_name(stages: tuple[Stage, ...]) -> str:
    def one(stage: Stage) -> str:
        return " + ".join(f"{n} {'KO' if v == 0 else 'E1'}" for n, v in sorted(stage))

    return "  then  ".join(one(s) for s in stages)


def pair_row(explorer: Explorer, a: Literal, b: Literal) -> dict:
    """Everything the protocol asks about two literals on different nodes: H0 and H1 as one stage, H2 in both orders, and the fates."""
    both = frozenset({a, b})
    first_then_second = (frozenset({a}), frozenset({b}))
    second_then_first = (frozenset({b}), frozenset({a}))
    return {
        "literals": sorted([a, b]),
        "h0": explorer.h0(both), "h1": explorer.h1(both),
        "h2_ab": explorer.h2(first_then_second), "h2_ba": explorer.h2(second_then_first),
        "one_stage_fates": list(explorer.reached((both,)).labels),
        "ab_fates": explorer.fates(first_then_second), "ba_fates": explorer.fates(second_then_first),
    }


def triple_row(explorer: Explorer, triple: tuple[Literal, ...]) -> dict:
    """Three literals on different nodes: a hit as one stage, and in how many of the other ordered lists of stages."""
    held = frozenset(triple)
    orders = [stages for stages in ordered_partitions(tuple(sorted(triple))) if len(stages) > 1 and explorer.h2(stages)]
    return {"literals": [list(l) for l in sorted(triple)], "h1": explorer.h1(held), "h2_orders": len(orders)}


def single_row(explorer: Explorer, literal: Literal) -> dict:
    held = frozenset({literal})
    return {"literal": list(literal), "h0": explorer.h0(held), "h1": explorer.h1(held), "fates": list(explorer.reached((held,)).labels),
            "all_attractor_fates": sorted(lab for _, lab in explorer.attractors(held))}
