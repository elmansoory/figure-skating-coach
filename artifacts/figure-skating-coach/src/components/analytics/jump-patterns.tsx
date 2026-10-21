import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ErrorBar, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { analytics } from "@/data/olympic-analytics";
import { VIZ, axisProps, pct, tooltipStyle } from "@/lib/viz";
import { DataTable, RateRow, VizCard } from "./shared";

const legendText = (value: string) => <span className="text-foreground">{value}</span>;
const J = analytics.jumps;

export function JumpPatterns() {
  const [discipline, setDiscipline] = useState<"Men" | "Women">("Men");

  const types = useMemo(
    () =>
      J.byType
        .filter((t) => t.discipline === discipline && t.revolutions >= 3)
        .sort((a, b) => b.revolutions - a.revolutions || (b.cleanRate ?? 0) - (a.cleanRate ?? 0))
        .map((t) => ({
          ...t,
          clean: (t.cleanRate ?? 0) * 100,
          ciErr: t.cleanCi ? [((t.cleanRate ?? 0) - t.cleanCi[0]) * 100, (t.cleanCi[1] - (t.cleanRate ?? 0)) * 100] : [0, 0],
        })),
    [discipline],
  );
  // The highest-value jump with a solid sample size
  const focus = types.filter((t) => t.n >= 100).sort((a, b) => b.meanBaseValue - a.meanBaseValue)[0];
  const trends = J.trends.filter((t) => t.discipline === discipline);
  const hardLabel = discipline === "Men" ? "quads" : "quads and triple Axels";
  const half = J.patterns.half;
  const halfDrop = half[0].cleanRate != null && half[1].cleanRate != null ? (half[0].cleanRate - half[1].cleanRate) * 100 : null;
  const pos = J.patterns.position;
  const bestPos = pos.reduce((a, b) => ((b.cleanRate ?? 0) > (a.cleanRate ?? 0) ? b : a), pos[0]);
  const worstAfter = pos.filter((p) => p.position > bestPos.position).reduce((a, b) => ((b.cleanRate ?? 1) < (a.cleanRate ?? 1) ? b : a), pos.at(-1)!);
  const halfSeparated = !!(half[0].cleanCi && half[1].cleanCi && half[0].cleanCi[0] > half[1].cleanCi[1]);
  const hist = J.goeHistogram.filter((h) => h.clean + h.notClean > 0).map((h) => ({ ...h, label: `${h.from >= 0 ? "+" : ""}${h.from.toFixed(1)}` }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Successful vs failed jumps</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            {J.scope.jumpElements.toLocaleString()} jump elements from {J.scope.events} senior international events, seasons {J.scope.seasons[0]} to {J.scope.seasons[1]}.
            A jump counts as <strong className="text-foreground">clean</strong> when it has no protocol call (q, &lt;, &lt;&lt;, e, !, *) and no fall. Brackets show 95% Wilson confidence intervals.
          </p>
        </div>
        <ToggleGroup type="single" value={discipline} onValueChange={(v) => v && setDiscipline(v as "Men" | "Women")} variant="outline" aria-label="Discipline">
          <ToggleGroupItem value="Men">Men</ToggleGroupItem>
          <ToggleGroupItem value="Women">Women</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Key patterns</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Second-half jumps are less often clean</div>
            <p className="text-muted-foreground mt-1">
              In free skates, triples and quads with the second-half bonus are clean {pct(half[1].cleanRate, 1)} of the time vs {pct(half[0].cleanRate, 1)} in the first half
              {halfDrop != null ? ` – ${halfDrop.toFixed(1)} points lower${halfSeparated ? ", with non-overlapping confidence intervals" : ""}.` : "."} Fatigue is a likely factor, but skaters also choose which jumps to place there.
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">How the {focus?.jump} fails</div>
            <p className="text-muted-foreground mt-1">
              {focus &&
                `The highest-value ${discipline.toLowerCase()}'s jump with 100+ solo attempts: ${pct(focus.cleanRate)} clean, ${pct(focus.fallRate)} falls, ${pct(focus.quarterRate + focus.underRate + focus.downgradeRate)} rotation calls (q, <, <<)${focus.wrongEdgeRate != null ? `, ${pct(focus.wrongEdgeRate + (focus.edgeAttentionRate ?? 0))} edge calls` : ""}. A jump can have both a fall and a call.`}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Where in the program matters</div>
            <p className="text-muted-foreground mt-1">
              The clean rate peaks at element {bestPos.position} ({pct(bestPos.cleanRate)}) and drops to {pct(worstAfter.cleanRate)} at element {worstAfter.position}. Olympic jumps were clean {pct(J.patterns.olympics[1].cleanRate)} of the time vs {pct(J.patterns.olympics[0].cleanRate)} elsewhere – most likely because only the strongest skaters qualify.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title={`Clean rate by jump – ${discipline} (solo jumps)`}
          description="Share of solo triples and quads with no call and no fall. Whiskers show 95% confidence intervals."
          height={Math.max(260, types.length * 30 + 50)}
          chart={
            <BarChart data={types} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }} barCategoryGap={6}>
              <CartesianGrid stroke={VIZ.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} unit="%" />
              <YAxis type="category" dataKey="jump" {...axisProps} width={44} interval={0} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "Clean"]}
                labelFormatter={(label: string, payload) => {
                  const t = payload?.[0]?.payload as (typeof types)[number] | undefined;
                  return t ? `${label} – n=${t.n}, falls ${pct(t.fallRate)}, mean GOE ${t.meanGoe?.toFixed(2)}` : label;
                }}
              />
              <Bar dataKey="clean" fill={VIZ.series[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <ErrorBar dataKey="ciErr" width={4} stroke="hsl(var(--foreground))" direction="x" />
              </Bar>
            </BarChart>
          }
          table={
            <DataTable
              head={["Jump", "n", "Clean", "Fall", "q", "<", "<<", "e / !", "GOE", "GOE clean"]}
              rows={types.map((t) => [
                t.jump,
                t.n,
                pct(t.cleanRate, 1),
                pct(t.fallRate, 1),
                pct(t.quarterRate, 1),
                pct(t.underRate, 1),
                pct(t.downgradeRate, 1),
                t.wrongEdgeRate != null ? `${pct(t.wrongEdgeRate, 1)} / ${pct(t.edgeAttentionRate, 1)}` : "–",
                t.meanGoe?.toFixed(2),
                t.meanGoeClean?.toFixed(2),
              ])}
            />
          }
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What changes the odds? (men and women, triples and quads)</CardTitle>
            <CardDescription>Clean rate of jump elements in each situation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Segment", rows: J.patterns.segment },
              { title: "Position in the free skate", rows: J.patterns.half },
              { title: "Element type", rows: J.patterns.elementType },
              { title: "Event", rows: J.patterns.olympics },
            ].map((g) => (
              <div key={g.title}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
                {g.rows.map((r) => <RateRow key={r.group} label={r.group} rate={r.cleanRate} ci={r.cleanCi} n={r.n} />)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title="Clean rate by element order in the free skate"
          description="All senior singles free skates; element numbers include spins and steps, which is why jumps rarely sit at 5 and 10."
          chart={
            <LineChart data={pos.map((p) => ({ ...p, clean: (p.cleanRate ?? 0) * 100 }))} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="position" {...axisProps} />
              <YAxis {...axisProps} domain={[50, 90]} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Clean"]} labelFormatter={(p: number) => `Element ${p}`} />
              <Line dataKey="clean" stroke={VIZ.series[0]} strokeWidth={2} dot={{ r: 4, fill: VIZ.series[0], stroke: "hsl(var(--card))", strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          }
          table={<DataTable head={["Element", "n", "Clean", "Falls"]} rows={pos.map((p) => [p.position, p.n, pct(p.cleanRate, 1), pct(p.fallRate, 1)])} />}
        />

        <VizCard
          title="GOE of clean and failed jumps"
          description="Triples and quads. A clean jump can still get negative GOE (e.g. a poor landing), and a call almost always pushes GOE below zero."
          chart={
            <BarChart data={hist} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} barCategoryGap={1}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={1} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} labelFormatter={(l: string, payload) => {
                const h = payload?.[0]?.payload as (typeof hist)[number] | undefined;
                return h ? `GOE ${h.from} to ${h.to}` : l;
              }} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
              <Bar dataKey="clean" name="Clean" stackId="g" fill={VIZ.good} stroke="hsl(var(--card))" strokeWidth={1} isAnimationActive={false} />
              <Bar dataKey="notClean" name="Call or fall" stackId="g" fill={VIZ.critical} stroke="hsl(var(--card))" strokeWidth={1} isAnimationActive={false} />
            </BarChart>
          }
          table={<DataTable head={["GOE", "Clean", "Call or fall"]} rows={hist.map((h) => [`${h.from} to ${h.to}`, h.clean, h.notClean])} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title={`Attempts of ${hardLabel} per free skate`}
          description={`${discipline}, by season. 2020/21 had few events because of the pandemic.`}
          chart={
            <BarChart data={trends} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="season" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} formatter={(v: number) => [v.toFixed(2), "Attempts per program"]} labelFormatter={(s: string, payload) => {
                const t = payload?.[0]?.payload as (typeof trends)[number] | undefined;
                return t ? `${s} – ${t.performances} free skates` : s;
              }} />
              <Bar dataKey="attemptsPerProgram" fill={VIZ.series[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          }
          table={<DataTable head={["Season", "Free skates", "Attempts / program", "Attempts", "Clean"]} rows={trends.map((t) => [t.season, t.performances, t.attemptsPerProgram?.toFixed(2), t.n, pct(t.cleanRate, 1)])} />}
        />

        <VizCard
          title={`Clean rate of ${hardLabel} by season`}
          description={`${discipline}. Seasons with few attempts swing widely – check n in the table.`}
          chart={
            <LineChart data={trends.map((t) => ({ ...t, clean: (t.cleanRate ?? 0) * 100 }))} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="season" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Clean"]} labelFormatter={(s: string, payload) => {
                const t = payload?.[0]?.payload as (typeof trends)[number] | undefined;
                return t ? `${s} – n=${t.n}` : s;
              }} />
              <Line dataKey="clean" stroke={VIZ.series[0]} strokeWidth={2} dot={{ r: 4, fill: VIZ.series[0], stroke: "hsl(var(--card))", strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          }
          table={<DataTable head={["Season", "Attempts", "Clean"]} rows={trends.map((t) => [t.season, t.n, pct(t.cleanRate, 1)])} />}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Most common jump combinations</CardTitle>
          <CardDescription>Senior singles, men and women together. A combination is clean only if every jump in it is.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[420px] overflow-auto">
          <DataTable
            head={["Combination", "Attempts", "Clean", "Falls", "Mean GOE"]}
            rows={J.combos.map((c) => [<span className="font-mono">{c.combo}</span>, c.n, pct(c.cleanRate, 1), pct(c.fallRate, 1), c.meanGoe?.toFixed(2)])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
