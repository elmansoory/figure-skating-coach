"""Build the Olympic analytics dataset used by the "Olympic Analytics" page.

Source: the cleanskate dataset (https://github.com/erleholgersen/cleanskate, MIT),
which parses the ISU's public result pages and "Judges Details per Skater"
protocols for international events from 2018/19 onward.

Usage:
    pip install pandas pyarrow
    python scripts/data/build_olympic_analytics.py            # downloads the pinned snapshot
    python scripts/data/build_olympic_analytics.py --data-dir /path/to/parquet

Writes artifacts/figure-skating-coach/src/data/olympic-analytics.json.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import urllib.request
from datetime import date
from pathlib import Path

import pandas as pd

SNAPSHOT = "2026-04-29"
BASE_URL = f"https://storage.googleapis.com/cleanskate/{SNAPSHOT}"
TABLES = ["events", "results", "standings", "elements", "program_components"]
REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT = REPO_ROOT / "artifacts/figure-skating-coach/src/data/olympic-analytics.json"

OLYMPICS = ["Olympics 2022", "Olympics 2026"]
DISCIPLINES = ["Men", "Women", "Pairs", "Ice Dance"]
JUMP_FAMILIES = ["Jump", "Jump Combo", "Jump Sequence"]
# Events held in the second half of a season (Jan–Apr) belong to the season that began the previous July.
LATE_SEASON_SERIES = {"Europeans", "Four Continents", "Worlds", "Junior Worlds", "Olympics"}
JUMP_RE = re.compile(r"^([1-4])(Lz|Lo|A|T|S|F)")


def load_tables(data_dir: Path | None) -> dict[str, pd.DataFrame]:
    if data_dir is None:
        data_dir = REPO_ROOT / ".cache/cleanskate" / SNAPSHOT
        data_dir.mkdir(parents=True, exist_ok=True)
        for table in TABLES:
            target = data_dir / f"{table}.parquet"
            if not target.exists():
                print(f"Downloading {table}…")
                urllib.request.urlretrieve(f"{BASE_URL}/{table}.parquet", target)
    return {t: pd.read_parquet(data_dir / f"{t}.parquet") for t in TABLES}


def season_of(event_label: str, series: str, start_date: str | None) -> str | None:
    """ISU seasons run July–June. Prefer the event's start date; fall back to the year in its name."""
    if isinstance(start_date, str) and len(start_date) >= 7:
        year, month = int(start_date[:4]), int(start_date[5:7])
        start = year if month >= 7 else year - 1
    else:
        m = re.search(r"(20\d\d)", event_label)
        if not m:
            return None
        year = int(m.group(1))
        start = year - 1 if series in LATE_SEASON_SERIES else year
    return f"{start}/{str(start + 1)[-2:]}"


def wilson(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (float("nan"), float("nan"))
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (centre - half, centre + half)


def rate_block(df: pd.DataFrame) -> dict:
    """Outcome rates for a set of jump elements. Rows with unknown cleanliness are excluded."""
    known = df[df["clean_element"].notna()]
    n = len(known)
    clean = int(known["clean_element"].astype(bool).sum())
    falls = int(known["fall"].fillna(False).astype(bool).sum())
    lo, hi = wilson(clean, n)
    return {
        "n": n,
        "cleanRate": clean / n if n else None,
        "cleanCi": [lo, hi] if n else None,
        "fallRate": falls / n if n else None,
        "meanGoe": float(known["goe"].mean()) if n else None,
    }


def segment_kind(label: str) -> str:
    return "SP" if label.endswith(("SP", "RD")) else "FS"


def r2(x):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), 2)


def r4(x):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), 4)


def build_olympics(t: dict[str, pd.DataFrame]) -> dict:
    results = t["results"]
    standings = t["standings"]
    components = t["program_components"]
    elements = t["elements"]

    out = {}
    for event in OLYMPICS:
        ev_results = results[(results.event_label == event) & ~results.segment_label.str.startswith("Team")]
        ev_standings = standings[(standings.event_label == event) & (standings.standing_type == "Final")]
        ev_components = components[components.event_label == event]
        ev_elements = elements[elements.event_label == event]

        disciplines = {}
        for disc in DISCIPLINES:
            disc_results = ev_results[ev_results.segment_label.str.startswith(disc + " ")]
            if disc == "Men" or disc == "Women":
                # "Men SP" must not match "Women SP"
                disc_results = disc_results[disc_results.segment_label.str.split(" ").str[0] == disc]

            final = ev_standings[ev_standings.discipline == disc].sort_values("rank")
            performances = []
            for _, r in disc_results.sort_values(["segment_label", "rank"]).iterrows():
                comps = ev_components[ev_components.result_id == r.result_id]
                els = ev_elements[ev_elements.result_id == r.result_id].sort_values("element_number")
                performances.append(
                    {
                        "segment": segment_kind(r.segment_label),
                        "rank": int(r["rank"]),
                        "name": r["name"],
                        "noc": r.noc,
                        "tss": r2(r.total_segment_score),
                        "tes": r2(r.total_element_score),
                        "pcs": r2(r.total_program_component_score),
                        "deductions": r2(r.total_deductions),
                        "baseValue": r2(r.element_base_value_sum),
                        "falls": int(r.reported_falls),
                        "components": {c.component_name: r2(c.average) for c in comps.itertuples()},
                        "elements": [
                            {
                                "no": int(e.element_number),
                                "code": e.element_code,
                                "family": e.element_family,
                                "bv": r2(e.base_value),
                                "goe": r2(e.goe),
                                "score": r2(e.panel_score),
                                "clean": None if pd.isna(e.clean_element) else bool(e.clean_element),
                                "fall": None if pd.isna(e.fall) else bool(e.fall),
                                "secondHalf": bool(e.second_half_bonus),
                            }
                            for e in els.itertuples()
                        ]
                        if disc != "Ice Dance"
                        else [],
                    }
                )
            disciplines[disc] = {
                "final": [
                    {
                        "rank": int(s["rank"]),
                        "name": s["name"],
                        "noc": s.noc,
                        "total": r2(s.total_score),
                        "sp": r2(s.segment_1_score),
                        "fs": r2(s.segment_2_score),
                    }
                    for _, s in final.iterrows()
                ],
                "performances": performances,
            }
        out[event] = disciplines
    return out


def build_jump_stats(t: dict[str, pd.DataFrame]) -> dict:
    events = t["events"][["event_label", "event_series", "start_date"]].drop_duplicates("event_label")
    e = t["elements"]
    e = e[(e.event_level == "Senior") & e.element_family.isin(JUMP_FAMILIES)].copy()
    e["discipline"] = e.segment_label.str.replace("Team Event - ", "", regex=False).str.split(" ").str[0]
    e = e[e.discipline.isin(["Men", "Women"])]
    e = e.merge(events, on="event_label", how="left", suffixes=("", "_ev"))
    e["season"] = [season_of(l, s, d) for l, s, d in zip(e.event_label, e.event_series, e.start_date)]
    e["segment"] = e.segment_label.map(segment_kind)
    first = e.element_code.str.split("+").str[0].str.extract(JUMP_RE)
    e["firstJump"] = first[0] + first[1]
    e["firstRevs"] = pd.to_numeric(first[0])
    e["isOlympics"] = e.event_series == "Olympics"

    # Solo jumps: outcome and calls belong to a single jump
    solo = e[(e.element_family == "Jump") & e.firstJump.notna()]
    by_type = []
    for (disc, code), g in solo.groupby(["discipline", "firstJump"]):
        if len(g) < 15:
            continue
        block = rate_block(g)
        n = len(g)
        by_type.append(
            {
                "discipline": disc,
                "jump": code,
                "revolutions": int(code[0]),
                **{k: r4(v) if isinstance(v, float) else v for k, v in block.items() if k != "cleanCi"},
                "cleanCi": [r4(x) for x in block["cleanCi"]] if block["cleanCi"] else None,
                "quarterRate": r4(g.call_quarter.mean()),
                "underRate": r4(g.call_underrotated.mean()),
                "downgradeRate": r4(g.call_downgraded.mean()),
                "wrongEdgeRate": r4(g.call_wrong_edge.mean()) if code[1:] in ("F", "Lz") else None,
                "edgeAttentionRate": r4(g.call_edge_attention.mean()) if code[1:] in ("F", "Lz") else None,
                "meanGoeClean": r2(g[g.clean_element == True].goe.mean()),  # noqa: E712
                "meanBaseValue": r2(g.base_value.mean()),
                "attempts": n,
            }
        )

    def compare(df: pd.DataFrame, key: str, labels: dict) -> list[dict]:
        rows = []
        for value, label in labels.items():
            block = rate_block(df[df[key] == value])
            rows.append({"group": label, **{k: (r4(v) if isinstance(v, float) else v) for k, v in block.items() if k != "cleanCi"}, "cleanCi": [r4(x) for x in block["cleanCi"]] if block["cleanCi"] else None})
        return rows

    triples_quads = e[e.firstRevs >= 3]
    fs = triples_quads[triples_quads.segment == "FS"]

    patterns = {
        "segment": compare(triples_quads, "segment", {"SP": "Short program", "FS": "Free skate"}),
        "half": compare(fs, "second_half_bonus", {False: "First half (FS)", True: "Second half (FS)"}),
        "olympics": compare(triples_quads, "isOlympics", {False: "Other senior events", True: "Olympics"}),
        "elementType": compare(
            triples_quads,
            "element_family",
            {"Jump": "Solo jump", "Jump Combo": "Combination", "Jump Sequence": "Sequence"},
        ),
        "revolutions": [
            {"discipline": disc, "revolutions": int(rv), **{k: (r4(v) if isinstance(v, float) else v) for k, v in rate_block(g).items() if k != "cleanCi"}}
            for (disc, rv), g in e[e.firstRevs.notna()].groupby(["discipline", "firstRevs"])
            if len(g) >= 30
        ],
        "position": [
            {"position": int(pos), **{k: (r4(v) if isinstance(v, float) else v) for k, v in rate_block(g).items() if k != "cleanCi"}}
            for pos, g in fs.groupby("element_number")
            if len(g) >= 100
        ],
    }

    # Season trends for quads (men) and 3A/quads (women), per free skate performance
    trends = []
    for (disc, season), g in e[e.segment == "FS"].groupby(["discipline", "season"]):
        performances = g.result_id.nunique()
        hard = g[(g.firstRevs == 4) | ((disc == "Women") & (g.firstJump == "3A"))]
        block = rate_block(hard)
        trends.append(
            {
                "discipline": disc,
                "season": season,
                "performances": performances,
                "attemptsPerProgram": r2(len(hard) / performances) if performances else None,
                "cleanRate": r4(block["cleanRate"]) if block["cleanRate"] is not None else None,
                "n": block["n"],
            }
        )

    combos = []
    combo_rows = e[e.element_family == "Jump Combo"].copy()
    combo_rows["pattern"] = combo_rows.attempt_code.str.replace(r"[<q!e]+", "", regex=True)
    for pattern, g in combo_rows.groupby("pattern"):
        if len(g) < 60 or "COMBO" in pattern or "REP" in pattern:
            continue
        block = rate_block(g)
        combos.append({"combo": pattern, **{k: (r4(v) if isinstance(v, float) else v) for k, v in block.items() if k != "cleanCi"}})
    combos.sort(key=lambda c: -c["n"])

    # GOE distribution of triple/quad jump elements, clean vs not
    known = triples_quads[triples_quads.clean_element.notna()]
    bins = [x / 2 for x in range(-12, 13)]
    hist = []
    for lo, hi in zip(bins[:-1], bins[1:]):
        in_bin = known[(known.goe >= lo) & (known.goe < hi)]
        hist.append({"from": lo, "to": hi, "clean": int((in_bin.clean_element == True).sum()), "notClean": int((in_bin.clean_element == False).sum())})  # noqa: E712

    seasons = sorted({s for s in e.season.dropna()})
    return {
        "scope": {
            "level": "Senior",
            "disciplines": ["Men", "Women"],
            "seasons": [seasons[0], seasons[-1]] if seasons else [],
            "events": int(e.event_label.nunique()),
            "jumpElements": int(len(e)),
            "soloJumps": int(len(solo)),
        },
        "byType": sorted(by_type, key=lambda r: (r["discipline"], -r["revolutions"], r["jump"])),
        "patterns": patterns,
        "trends": sorted(trends, key=lambda r: (r["discipline"], r["season"])),
        "combos": combos[:20],
        "goeHistogram": hist,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=None)
    args = parser.parse_args()
    tables = load_tables(args.data_dir)

    data = {
        "meta": {
            "source": "cleanskate dataset (github.com/erleholgersen/cleanskate), parsed from ISU results and protocols",
            "snapshot": SNAPSHOT,
            "license": "cleanskate: MIT. Underlying results and protocols published by the International Skating Union.",
            "generated": date.today().isoformat(),
            "definitions": {
                "clean": "Scored element with no protocol call (q, <, <<, e, !, *) and no fall assigned to it.",
                "jumpElements": "Solo jumps, combinations and sequences from senior singles events; combinations are classified by their first jump.",
            },
        },
        "olympics": build_olympics(tables),
        "jumps": build_jump_stats(tables),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False))
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
