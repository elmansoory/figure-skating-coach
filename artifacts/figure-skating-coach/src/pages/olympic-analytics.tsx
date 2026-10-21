import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { OlympicSection, type SegmentFilter } from "@/components/analytics/olympic-section";
import { JumpPatterns } from "@/components/analytics/jump-patterns";
import { analytics, DISCIPLINES, OLYMPIC_EVENTS, type Discipline } from "@/data/olympic-analytics";

const SOURCES = [
  {
    name: "cleanskate",
    url: "https://github.com/erleholgersen/cleanskate",
    status: "Used here",
    detail: "Parsed ISU results and protocols from 2018/19 onward: results, element-level scores and calls, program components, judges. Olympics 2022 and 2026 included. MIT licence.",
  },
  {
    name: "ISU results & protocols",
    url: "https://results.isu.org",
    status: "Original source",
    detail: "Official HTML result pages and \"Judges Details per Skater\" PDFs for every ISU event. Everything else on this list derives from them.",
  },
  {
    name: "BuzzFeedNews/figure-skating-scores",
    url: "https://github.com/BuzzFeedNews/figure-skating-scores",
    status: "Historical",
    detail: "Tidy CSVs (performances, judged aspects, per-judge scores) for 17 major competitions, Oct 2016 – Dec 2017, plus the PDF parser.",
  },
  {
    name: "mayupei/isu-figure-skating-competitions-web-scraper",
    url: "https://github.com/mayupei/isu-figure-skating-competitions-web-scraper",
    status: "Scraper",
    detail: "Pipeline that scrapes ISU protocols and judge panels from 2004/05 to 2024/25; you run it yourself to produce the data.",
  },
  {
    name: "mengyazhu96/figure-skating-analysis",
    url: "https://github.com/mengyazhu96/figure-skating-analysis",
    status: "Historical",
    detail: "Senior-thesis data and score-prediction models, 2016–2018 seasons.",
  },
  {
    name: "edomt/isu-data",
    url: "https://github.com/edomt/isu-data",
    status: "Metadata",
    detail: "Weekly-updated CSV of active skaters' coaches and choreographers from ISU bios.",
  },
  {
    name: "FSBench (arXiv 2504.19514)",
    url: "https://arxiv.org/abs/2504.19514",
    status: "Video / AI",
    detail: "Benchmark of 783 Grand Prix performances with element categories and GOE annotations for video understanding.",
  },
  {
    name: "Mercity Figure-Skating-Classification-Data",
    url: "https://huggingface.co/datasets/Mercity/Figure-Skating-Classification-Data",
    status: "Video / AI",
    detail: "Skeleton pose sequences for 64 element classes, from competition video and motion capture.",
  },
  {
    name: "Kaggle",
    url: "https://www.kaggle.com/search?q=figure+skating",
    status: "Not found",
    detail: "No element-level ISU scoring dataset on Kaggle could be verified for this build; search there directly before relying on one.",
  },
];

export default function OlympicAnalytics() {
  const [event, setEvent] = useState(OLYMPIC_EVENTS.at(-1)!);
  const [discipline, setDiscipline] = useState<Discipline>("Men");
  const [segment, setSegment] = useState<SegmentFilter>("combined");
  const [topN, setTopN] = useState(10);
  const dance = discipline === "Ice Dance";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olympic Analytics</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Technical (TES) and component (PCS) scores of the Beijing 2022 and Milano Cortina 2026 Olympic fields, and what
          separates clean jumps from failed ones across all senior international events. Data: {analytics.meta.source}, snapshot {analytics.meta.snapshot}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="f-event">Olympics</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger id="f-event" className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{OLYMPIC_EVENTS.map((e) => <SelectItem key={e} value={e}>{e.replace("Olympics", "Olympic Games")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-disc">Discipline</Label>
          <Select value={discipline} onValueChange={(v) => setDiscipline(v as Discipline)}>
            <SelectTrigger id="f-disc" className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-seg">Segment</Label>
          <Select value={segment} onValueChange={(v) => setSegment(v as SegmentFilter)}>
            <SelectTrigger id="f-seg" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">Both segments</SelectItem>
              <SelectItem value="SP">{dance ? "Rhythm dance" : "Short program"}</SelectItem>
              <SelectItem value="FS">{dance ? "Free dance" : "Free skate"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-top">Show</Label>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
            <SelectTrigger id="f-top" className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 30].map((n) => <SelectItem key={n} value={String(n)}>{n === 30 ? "All" : `Top ${n}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <OlympicSection key={`${event}-${discipline}-${segment}`} event={event} discipline={discipline} segment={segment} topN={topN} />

      <Separator />

      <JumpPatterns />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Figure skating datasets</CardTitle>
          <CardDescription>Public sources reviewed for this dashboard. See docs/datasets.md in the repository for details and how to rebuild the data.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {SOURCES.map((s) => (
            <div key={s.name} className="py-3 grid gap-1 md:grid-cols-[260px_110px_1fr] md:gap-4">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline break-words">{s.name}</a>
              <span className="text-xs font-medium text-muted-foreground md:pt-0.5">{s.status}</span>
              <span className="text-sm text-muted-foreground">{s.detail}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
