import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { analytics, isJump, linearFit, type Discipline, type ElementRow, type Performance } from "@/data/olympic-analytics";
import { VIZ, axisProps, tooltipStyle } from "@/lib/viz";
import { DataTable, VizCard } from "./shared";

export type SegmentFilter = "combined" | "SP" | "FS";

interface Row {
  rank: number;
  name: string;
  noc: string;
  tes: number;
  pcs: number;
  deductions: number;
  total: number;
  falls: number;
  components: Record<string, number>;
  performances: Performance[];
}

const legendText = (value: string) => <span className="text-foreground">{value}</span>;
const shortName = (name: string) => name.replace(/\b([A-Z][a-z]+)\s/g, (m, first: string) => `${first[0]}. `);

function buildRows(event: string, discipline: Discipline, segment: SegmentFilter): Row[] {
  const data = analytics.olympics[event][discipline];
  if (segment !== "combined") {
    return data.performances
      .filter((p) => p.segment === segment)
      .sort((a, b) => a.rank - b.rank)
      .map((p) => ({ rank: p.rank, name: p.name, noc: p.noc, tes: p.tes, pcs: p.pcs, deductions: p.deductions, total: p.tss, falls: p.falls, components: p.components, performances: [p] }));
  }
  const rows: Row[] = [];
  for (const s of data.final) {
    const perfs = data.performances.filter((p) => p.name === s.name);
    if (perfs.length < 2) continue;
    const sum = (k: "tes" | "pcs" | "deductions" | "falls") => perfs.reduce((acc, p) => acc + p[k], 0);
    const components: Record<string, number> = {};
    for (const key of Object.keys(perfs[0].components)) {
      components[key] = perfs.reduce((acc, p) => acc + (p.components[key] ?? 0), 0) / perfs.length;
    }
    rows.push({ rank: s.rank, name: s.name, noc: s.noc, tes: sum("tes"), pcs: sum("pcs"), deductions: sum("deductions"), total: s.total, falls: sum("falls"), components, performances: perfs });
  }
  return rows;
}

export function OlympicSection({ event, discipline, segment, topN }: { event: string; discipline: Discipline; segment: SegmentFilter; topN: number }) {
  const rows = useMemo(() => buildRows(event, discipline, segment), [event, discipline, segment]);
  const top = rows.slice(0, topN);
  const podium = analytics.olympics[event][discipline].final.slice(0, 3);
  const fit = useMemo(() => (rows.length > 2 ? linearFit(rows.map((r) => r.tes), rows.map((r) => r.pcs)) : null), [rows]);
  const tesShare = top.length ? top.reduce((s, r) => s + r.tes / (r.tes + r.pcs), 0) / top.length : 0;
  const componentNames = rows[0] ? Object.keys(rows[0].components) : [];
  const leaders = rows.slice(0, 3);
  const scale = segment === "combined" ? "SP + FS" : segment === "SP" ? (discipline === "Ice Dance" ? "Rhythm dance" : "Short program") : discipline === "Ice Dance" ? "Free dance" : "Free skate";

  const tesRange = rows.length ? [Math.min(...rows.map((r) => r.tes)), Math.max(...rows.map((r) => r.tes))] : [0, 0];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {podium.map((p, i) => (
          <Card key={p.name}>
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground">{["Gold", "Silver", "Bronze"][i]} · {event}</div>
              <div className="mt-1 font-semibold text-foreground">{p.name} <span className="text-muted-foreground font-normal">{p.noc}</span></div>
              <div className="mt-1 text-2xl font-semibold">{p.total.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{discipline === "Ice Dance" ? "RD" : "SP"} {p.sp?.toFixed(2) ?? "–"} · {discipline === "Ice Dance" ? "FD" : "FS"} {p.fs?.toFixed(2) ?? "–"}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <VizCard
        title={`TES and PCS – top ${top.length} (${scale})`}
        description={`On average technical elements make up ${(tesShare * 100).toFixed(0)}% of these skaters' TES + PCS. Deductions are listed in the table.`}
        height={Math.max(220, top.length * 34 + 60)}
        chart={
          <BarChart data={top.map((r) => ({ ...r, label: `${r.rank}. ${shortName(r.name)}` }))} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={6}>
            <CartesianGrid stroke={VIZ.grid} horizontal={false} />
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="label" {...axisProps} width={170} interval={0} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              formatter={(v: number, name: string) => [v.toFixed(2), name]}
              labelFormatter={(label: string, payload) => {
                const r = payload?.[0]?.payload as Row | undefined;
                return r ? `${label} (${r.noc}) – total ${r.total.toFixed(2)}${r.deductions ? `, deductions ${r.deductions}` : ""}` : label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
            <Bar dataKey="tes" name="TES (technical)" stackId="s" fill={VIZ.series[0]} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false} />
            <Bar dataKey="pcs" name="PCS (components)" stackId="s" fill={VIZ.series[1]} stroke="hsl(var(--card))" strokeWidth={2} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        }
        table={
          <DataTable
            head={["Skater", "Rank", "TES", "PCS", "Ded.", "Falls", "Total"]}
            rows={top.map((r) => [`${r.name} (${r.noc})`, r.rank, r.tes.toFixed(2), r.pcs.toFixed(2), r.deductions.toFixed(2), r.falls, r.total.toFixed(2)])}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title="Do technical and component scores move together?"
          description={
            fit
              ? `All ${rows.length} ${discipline === "Men" || discipline === "Women" ? "skaters" : "teams"}. Pearson r = ${fit.r.toFixed(2)}; each extra TES point goes with ${fit.slope.toFixed(2)} PCS points on average.`
              : "Not enough skaters."
          }
          chart={
            <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} />
              <XAxis type="number" dataKey="tes" name="TES" {...axisProps} domain={["auto", "auto"]} label={{ value: "TES", position: "insideBottom", offset: -8, fill: VIZ.axis, fontSize: 12 }} />
              <YAxis type="number" dataKey="pcs" name="PCS" {...axisProps} domain={["auto", "auto"]} label={{ value: "PCS", angle: -90, position: "insideLeft", fill: VIZ.axis, fontSize: 12 }} />
              <ZAxis range={[70, 70]} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ strokeDasharray: "0", stroke: VIZ.grid }}
                content={({ payload }) => {
                  const r = payload?.[0]?.payload as Row | undefined;
                  if (!r) return null;
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow">
                      <div className="font-semibold">{r.rank}. {r.name} ({r.noc})</div>
                      <div>TES {r.tes.toFixed(2)} · PCS {r.pcs.toFixed(2)}</div>
                    </div>
                  );
                }}
              />
              {fit && (
                <ReferenceLine
                  segment={[
                    { x: tesRange[0], y: fit.intercept + fit.slope * tesRange[0] },
                    { x: tesRange[1], y: fit.intercept + fit.slope * tesRange[1] },
                  ]}
                  stroke={VIZ.axis}
                  ifOverflow="extendDomain"
                />
              )}
              <Scatter data={rows} fill={VIZ.series[0]} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false} />
            </ScatterChart>
          }
          table={<DataTable head={["Skater", "TES", "PCS"]} rows={rows.map((r) => [`${r.rank}. ${r.name}`, r.tes.toFixed(2), r.pcs.toFixed(2)])} />}
        />

        <VizCard
          title="Program component marks – top 3"
          description={`Average judges' mark (0–10) per component${segment === "combined" ? ", mean of both segments" : ""}. ${componentNames.length === 5 ? "2022 used five components; they were merged into three from 2022/23." : ""}`}
          chart={
            <BarChart data={componentNames.map((c) => Object.fromEntries([["component", c], ...leaders.map((l) => [l.name, l.components[c]])]))} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} barGap={2}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="component" {...axisProps} interval={0} tick={{ fontSize: 11 }} tickFormatter={(c: string) => (c.length > 14 ? c.split(" ")[0] : c)} />
              <YAxis {...axisProps} domain={[0, 10]} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} formatter={(v: number, name: string) => [v.toFixed(2), name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
              {leaders.map((l, i) => (
                <Bar key={l.name} dataKey={l.name} fill={VIZ.series[i]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          }
          table={
            <DataTable
              head={["Component", ...leaders.map((l) => shortName(l.name))]}
              rows={componentNames.map((c) => [c, ...leaders.map((l) => l.components[c]?.toFixed(2) ?? "–")])}
            />
          }
        />
      </div>

      {discipline !== "Ice Dance" && <ElementComparison rows={rows} segment={segment === "combined" ? "FS" : segment} />}
    </div>
  );
}

function jumpSummary(elements: ElementRow[]) {
  const jumps = elements.filter(isJump);
  return {
    jumps: jumps.length,
    clean: jumps.filter((e) => e.clean === true).length,
    falls: elements.filter((e) => e.fall === true).length,
    bv: elements.reduce((s, e) => s + (e.bv ?? 0), 0),
    goe: elements.reduce((s, e) => s + (e.goe ?? 0), 0),
  };
}

function ElementComparison({ rows, segment }: { rows: Row[]; segment: "SP" | "FS" }) {
  const candidates = rows.filter((r) => r.performances.some((p) => p.segment === segment));
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const picks = [candidates[a], candidates[b]].filter(Boolean);
  if (candidates.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Element-by-element comparison ({segment === "SP" ? "short program" : "free skate"})</CardTitle>
        <CardDescription>Base value, GOE and protocol calls for each element. Highlighted rows are jumps that were not clean.</CardDescription>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[a, b].map((value, slot) => (
            <div key={slot} className="space-y-1">
              <Label htmlFor={`cmp-${slot}`}>Skater {slot === 0 ? "A" : "B"}</Label>
              <Select value={String(value)} onValueChange={(v) => (slot === 0 ? setA : setB)(Number(v))}>
                <SelectTrigger id={`cmp-${slot}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {candidates.map((c, i) => <SelectItem key={c.name} value={String(i)}>{c.rank}. {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {picks.map((row) => {
          const perf = row.performances.find((p) => p.segment === segment)!;
          const sum = jumpSummary(perf.elements);
          return (
            <div key={row.name} className="space-y-3 min-w-0">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">TES {perf.tes.toFixed(2)}</Badge>
                <Badge variant="secondary">PCS {perf.pcs.toFixed(2)}</Badge>
                <Badge variant="secondary">Base value {sum.bv.toFixed(2)}</Badge>
                <Badge variant="secondary">GOE {sum.goe >= 0 ? "+" : ""}{sum.goe.toFixed(2)}</Badge>
                <Badge variant="secondary">Clean jumps {sum.clean}/{sum.jumps}</Badge>
                {sum.falls > 0 && <Badge variant="destructive">Falls {sum.falls}</Badge>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-1.5 pr-2 text-left font-medium">#</th>
                      <th className="py-1.5 pr-2 text-left font-medium">Element</th>
                      <th className="py-1.5 pr-2 text-right font-medium">BV</th>
                      <th className="py-1.5 pr-2 text-right font-medium">GOE</th>
                      <th className="py-1.5 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {perf.elements.map((e) => {
                      const failed = isJump(e) && e.clean === false;
                      return (
                        <tr key={e.no} className={failed ? "bg-destructive/10" : undefined}>
                          <td className="py-1.5 pr-2 text-muted-foreground">{e.no}</td>
                          <td className="py-1.5 pr-2 font-mono">
                            {e.code}
                            {e.fall && <span className="ml-1 text-xs font-sans font-semibold text-destructive">fall</span>}
                            {e.secondHalf && <span className="ml-1 text-xs font-sans text-muted-foreground">x</span>}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-mono tabular-nums">{e.bv?.toFixed(2)}</td>
                          <td className="py-1.5 pr-2 text-right font-mono tabular-nums">{e.goe != null && e.goe > 0 ? "+" : ""}{e.goe?.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-mono tabular-nums">{e.score?.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
