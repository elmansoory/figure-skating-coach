# Figure skating datasets

Public sources reviewed for the **Olympic Analytics** page (October 2026).

| Source | Coverage | Granularity | Notes |
|---|---|---|---|
| [cleanskate](https://github.com/erleholgersen/cleanskate) — **used** | 2018/19 → 2025/26: Olympics (2022, 2026), Worlds, Europeans, Four Continents, Grand Prix + Final, Junior Grand Prix, most Challenger events | Results, per-element scores (base value, GOE, panel score, per-judge marks), derived calls (q, <, <<, e, !), falls, program components, officials | MIT. Parquet snapshots on Google Cloud Storage; pinned snapshot `2026-04-29`. |
| [ISU results](https://results.isu.org) | Every ISU event | HTML result pages and "Judges Details per Skater" PDF protocols | The original source of every dataset below. |
| [BuzzFeedNews/figure-skating-scores](https://github.com/BuzzFeedNews/figure-skating-scores) | 17 competitions, Oct 2016 – Dec 2017 | Tidy CSVs: performances, judged aspects, judge scores | Includes the PDF parser. |
| [BuzzFeedNews/2018-02-figure-skating-analysis](https://github.com/BuzzFeedNews/2018-02-figure-skating-analysis) | Same period | Per-judge GOE | Home-country judging bias analysis. |
| [mayupei/isu-figure-skating-competitions-web-scraper](https://github.com/mayupei/isu-figure-skating-competitions-web-scraper) | 2004/05 → 2024/25 | Protocols and judge panels | Code only — run it to produce the data. |
| [mengyazhu96/figure-skating-analysis](https://github.com/mengyazhu96/figure-skating-analysis) | 2016/17 – 2017/18 | Protocol data | Senior thesis with score prediction models. |
| [edomt/isu-data](https://github.com/edomt/isu-data) | Active skaters | Coach and choreographer per skater | Updated weekly. |
| [KrasimirKovachki/ISU](https://github.com/KrasimirKovachki/ISU) | Smaller events using ISUCalcFS / FS Manager | Parsers + PostgreSQL schema | Useful for national-level competitions. |
| [FSBench](https://arxiv.org/abs/2504.19514) | 783 Grand Prix / JGP performances | Video with element and GOE annotations | For video / AI work, not score analysis. |
| [Mercity Figure-Skating-Classification-Data](https://huggingface.co/datasets/Mercity/Figure-Skating-Classification-Data) | 64 element classes | Skeleton pose sequences | For element recognition models. |
| [Skating2010](https://r-packages.io/datasets/Skating2010) | Vancouver 2010 men | Totals only | Small R teaching dataset. |
| Kaggle | — | — | No element-level ISU scoring dataset could be verified; Kaggle was not reachable from the build environment. |

## Rebuilding the analytics data

```bash
pip install pandas pyarrow
python scripts/data/build_olympic_analytics.py
```

The script downloads the pinned cleanskate snapshot into `.cache/cleanskate/` and writes
`artifacts/figure-skating-coach/src/data/olympic-analytics.json`. To use a newer snapshot,
change `SNAPSHOT` in the script (the list of snapshots is in
`https://storage.googleapis.com/cleanskate/latest.json`).

## Definitions

- **Clean jump**: a scored jump element with no protocol call (`q`, `<`, `<<`, `e`, `!`, `*`) and no fall
  assigned to it (cleanskate's `clean_element`). Elements whose cleanliness can't be determined are excluded.
- **Combinations** are classified by their first jump. A combination is clean only if every jump in it is.
- **Season** runs July → June (e.g. `2025/26`).
- Rates are shown with 95% Wilson score intervals.

## Caveats

- Element-level falls are inferred conservatively in some older protocols (see cleanskate's analysis notes).
- The Olympic field is a selected group of skaters, so comparisons with other events mix event effects with
  skater-quality effects.
- 2022 programs were judged on five components; from 2022/23 there are three
  (Composition, Presentation, Skating Skills).
