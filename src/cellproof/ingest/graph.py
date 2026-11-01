"""What one paper says, as a graph: genes and molecules are nodes, each mechanism claim is an edge, and the solver's verdict is the edge's colour.

The same function serves both halves of the page: the papers the AI found on its own and the PDFs the user dropped. Every claim of a paper is
drawn, because that is what the paper says; the solver can only judge a link whose two ends are nodes of the model, so the others are marked
"outside the model" (knowledge kept, not tested), never dropped and never called wrong.

  accepted   a new link; the model with it still gives every one of the ten known experiments
  rejected   a new link that breaks a known experiment (the counterexample is kept)
  present    the model already has this link
  implied    the model already has a longer route with the same sign
  conflict   the published model has the opposite sign
  outside    an end of the link is not a node of the model
"""
from __future__ import annotations

import re
from collections import Counter

from cellproof.formalize.entities import Grounder, key

VERDICT = {
    "accepted": "accepted", "rejected": "rejected", "skipped_present": "present", "skipped_implied": "implied",
    "skipped_conflict": "conflict", "skipped_input": "outside", "skipped_not_available": "outside", "skipped_needs_activator": "outside",
}
VERDICTS = ("accepted", "rejected", "present", "implied", "conflict", "outside")
CASE = re.compile(r"^(V\d+)\b")
QUOTE_MAX, CONTEXT_MAX, LOCATION_MAX = 260, 110, 60


def _node(grounder: Grounder, name: str) -> tuple[str, str, str]:
    """(node id, name to show, how it was named). A gene the model has gets the model's id; any other gene HGNC knows uniquely gets its
    approved symbol, so that two spellings of one gene meet in one node; a name that is ambiguous or unknown stays as the paper wrote it
    (its id starts with "?", and spellings that differ only in case, spaces or hyphens meet in one node)."""
    ground = grounder.ground(name)
    if ground.kind in ("base", "new"):
        return ground.node, ground.node, ground.kind
    return "?" + (key(name) or name.strip()), name.strip(), ground.kind


def _why(verdict: str, record: dict | None, detail: str = "") -> str:
    if record is None:
        return detail
    if verdict == "rejected":
        first = next((m for a in record.get("attempts", []) for m in a.get("messages", [])), "")
        cases = sorted({m.group(1) for a in record.get("attempts", []) for text in a.get("messages", []) if (m := CASE.match(text))})
        return ("breaks " + ", ".join(cases) + ": " if cases else "") + first[:240]
    if verdict == "accepted":
        return {"introduces": "a new gene enters the model", "active": "it changes what the model does", "neutral": "consistent with every experiment, but changes no outcome we test"}.get(record.get("effect") or "", "")
    return (record.get("detail") or detail)[:200]


def paper_graph(claims: list[dict], grounder: Grounder, rules: dict[str, str], records: dict[str, dict]) -> dict:
    """`claims`: grounded claims of one paper, dicts with source, target, effect, context, evidence_quote, location and `pass`.
    `rules`: the model the verdicts were reached against. `records`: the solver's decision per edge id (the augmentation log)."""
    nodes: dict[str, dict] = {}
    edges: dict[str, dict] = {}
    for claim in claims:
        ends = []
        for name in (claim["source"], claim["target"]):
            node, shown, kind = _node(grounder, name)
            ends.append(node)
            nodes.setdefault(node, {"id": node, "name": shown, "model": node in rules, "naming": kind})
        source, target = ends
        if source == target:
            continue
        edge_id = f"{source}|{claim['effect']}|{target}"
        edge = edges.get(edge_id)
        if edge is None:
            record = records.get(edge_id) if source in rules and target in rules else None
            verdict = VERDICT.get(record["status"], "outside") if record else "outside"
            missing = [nodes[n]["name"] for n in (source, target) if n not in rules]
            detail = f"{' and '.join(missing)} {'is' if len(missing) == 1 else 'are'} not in the model yet" if missing else ""
            edge = edges[edge_id] = {
                "id": edge_id, "s": source, "t": target, "effect": claim["effect"], "verdict": verdict, "why": _why(verdict, record, detail),
                "repaired": bool(record and record.get("repaired")), "n": 0, "support": [],
            }
        edge["n"] += 1
        if len(edge["support"]) < 3:
            edge["support"].append({
                "quote": claim["evidence_quote"][:QUOTE_MAX], "context": claim["context"][:CONTEXT_MAX], "location": claim["location"][:LOCATION_MAX], "pass": claim.get("pass", ""),
            })
    counts = Counter(e["verdict"] for e in edges.values())
    return {"nodes": list(nodes.values()), "edges": list(edges.values()), "counts": {v: counts.get(v, 0) for v in VERDICTS}}
