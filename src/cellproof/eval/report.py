"""M1: the per-claim table of base and augmented networks against the held-out set, and its totals.

Every number is a count of claims. Nothing is averaged, and not-expressible is never merged with wrong.
"""
from __future__ import annotations

from collections import Counter

from cellproof.eval.score import CORRECT, NOT_EXPRESSIBLE, WRONG, score_doc

SYMBOL = {CORRECT: "correct", WRONG: "WRONG", NOT_EXPRESSIBLE: "n/e", None: ""}


def score_networks(doc: dict, networks: dict[str, dict[str, str]]) -> dict:
    """{network name: rows}, rows as returned by score_doc, plus the claim texts for the table."""
    scored = {name: score_doc(doc, rules) for name, rules in networks.items()}
    return {"rows": scored}


def totals(rows: list[dict], key: str = "verdict") -> dict[str, int]:
    counts = Counter(r[key] for r in rows if r["category"] in ("scoreable", "scoreable_with_new_nodes"))
    return {CORRECT: counts[CORRECT], WRONG: counts[WRONG], NOT_EXPRESSIBLE: counts[NOT_EXPRESSIBLE]}


SCOREABLE = ("scoreable", "scoreable_with_new_nodes")


def d4_summary(scored: dict[str, list[dict]], path) -> dict | None:
    """What the person's check of the quotes (D4, `data/labels/d4_check.csv`) means for the scored claims. It only reads the answers:
    the frozen item file is never edited, and a flagged claim is reported, not removed. Ids are `H03#1` in the check, `H03.1` elsewhere."""
    import csv
    from pathlib import Path

    path = Path(path)
    if not path.exists():
        return None
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    answered = [r for r in rows if r["verdict"].strip()]
    if not answered:
        return None
    flagged = {r["id"].replace("#", ".") for r in answered if r["verdict"] != "supports"}
    names = list(scored)

    def key(row: dict) -> str:
        return f"{row['item']}.{row['claim'] + 1}"

    kept = {n: [r for r in scored[n] if key(r) not in flagged] for n in names}
    scoreable = [r for r in scored[names[0]] if r["category"] in SCOREABLE]
    return {
        "total": len(rows), "checked": len(answered),
        "supports": sum(r["verdict"] == "supports" for r in answered),
        "does_not_support": sum(r["verdict"] == "does_not_support" for r in answered),
        "unsure": sum(r["verdict"] == "unsure" for r in answered),
        "flagged": sorted(flagged), "scored": len(scoreable),
        "flagged_scored": [key(r) for r in scoreable if key(r) in flagged],
        "without": {
            "claims": sum(1 for r in kept[names[0]] if r["category"] in SCOREABLE),
            "totals": {n: totals(kept[n]) for n in names},
            "baseline": totals(kept[names[0]], "baseline"),
        },
    }


def d4_markdown(d4: dict) -> str:
    flagged = d4["flagged_scored"]
    lines = [f"D4, added after the freeze (the item file and its status text above are unchanged): a person checked {d4['checked']} of {d4['total']} quotes "
             f"against their claims: {d4['supports']} supported, {d4['does_not_support']} not supported, {d4['unsure']} unsure. "
             f"Among the {d4['scored']} scored claims, {len(flagged)} flagged: {', '.join(flagged) or 'none'}. "
             f"Flagged claims are reported, not removed; the totals without them ({d4['without']['claims']} claims) are:", "",
             "| network | correct | wrong | not expressible |", "|---|---|---|---|"]
    for name, t in d4["without"]["totals"].items():
        lines.append(f"| {name} | {t[CORRECT]} | {t[WRONG]} | {t[NOT_EXPRESSIBLE]} |")
    b = d4["without"]["baseline"]
    lines.append(f"| no-information baseline | {b[CORRECT]} | {b[WRONG]} | {b[NOT_EXPRESSIBLE]} |")
    return "\n".join(lines)


def markdown(doc: dict, scored: dict[str, list[dict]]) -> str:
    names = list(scored)
    claims = {(i["id"], n): c for i in doc["items"] for n, c in enumerate(i["claims"])}
    first = scored[names[0]]
    scoreable = [r for r in first if r["category"] in ("scoreable", "scoreable_with_new_nodes")]
    head = "| claim | readout | polarity | how scored | " + " | ".join(names) + " | no-information baseline |"
    lines = [head, "|" + "---|" * (len(names) + 5)]
    for index, row in enumerate(scoreable):
        claim = claims[(row["item"], row["claim"])]
        cells = []
        for name in names:
            match = next(r for r in scored[name] if (r["item"], r["claim"]) == (row["item"], row["claim"]))
            cells.append(SYMBOL[match["verdict"]] + (" *" if match.get("no_stable_state") else ""))
        baseline = SYMBOL[next(r for r in scored[names[0]] if (r["item"], r["claim"]) == (row["item"], row["claim"]))["baseline"]]
        lines.append(
            f"| {row['item']}.{row['claim'] + 1} | {claim['readout']} | {claim['polarity']} | {row['mode']} | "
            + " | ".join(cells) + f" | {baseline} |"
        )
    lines.append("")
    lines.append("| network | correct | wrong | not expressible | of scoreable claims |")
    lines.append("|---|---|---|---|---|")
    for name in names:
        t = totals(scored[name])
        lines.append(f"| {name} | {t[CORRECT]} | {t[WRONG]} | {t[NOT_EXPRESSIBLE]} | {len(scoreable)} |")
    b = totals(first, "baseline")
    lines.append(f"| no-information baseline | {b[CORRECT]} | {b[WRONG]} | {b[NOT_EXPRESSIBLE]} | {len(scoreable)} |")
    lines += ["", "\\* The perturbed network has no stable state in this setting (it keeps oscillating). Under the frozen rule nothing is "
              "present, so the verdict says nothing about the cells. Marked after the first scoring run; no verdict was changed."]
    return "\n".join(lines) + "\n"
