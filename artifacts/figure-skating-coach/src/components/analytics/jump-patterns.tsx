import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ErrorBar, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { analytics } from "@/data/olympic-analytics";
import { VIZ, axisProps, pct, tooltipStyle } from "@/lib/viz";
import { DataTable, RateRow, VizCard } from "./shared";

const legendText = (value: string) => <span className="text-foreground">{value}</span>;
const J = analytics.jumps;

// Group labels come from the generated dataset in English
const GROUP_LABELS: Record<string, string> = {
  "Short program": "البرنامج القصير",
  "Free skate": "البرنامج الحر",
  "First half (FS)": "النصف الأول (البرنامج الحر)",
  "Second half (FS)": "النصف الثاني (البرنامج الحر)",
  "Other senior events": "بطولات الكبار الأخرى",
  Olympics: "الألعاب الأولمبية",
  "Solo jump": "قفزة منفردة",
  Combination: "مجموعة قفزات",
  Sequence: "تسلسل قفزات",
};
const DISC = { Men: "الرجال", Women: "السيدات" } as const;

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
  const hardLabel = discipline === "Men" ? "القفزات الرباعية" : "القفزات الرباعية والأكسل الثلاثي";
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
          <h2 className="text-2xl font-bold tracking-tight">القفزات الناجحة والفاشلة</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            {J.scope.jumpElements.toLocaleString("en")} عنصر قفز من {J.scope.events} بطولة دولية للكبار، من موسم {J.scope.seasons[0]} حتى {J.scope.seasons[1]}.
            تُعد القفزة <strong className="text-foreground">نظيفة</strong> إذا لم يكن عليها أي نداء في البروتوكول (<span dir="ltr">q, &lt;, &lt;&lt;, e, !, *</span>) ولا سقوط. الأقواس تعرض فترة الثقة 95% (طريقة ويلسون).
          </p>
        </div>
        <ToggleGroup type="single" value={discipline} onValueChange={(v) => v && setDiscipline(v as "Men" | "Women")} variant="outline" aria-label="التخصص">
          <ToggleGroupItem value="Men">الرجال</ToggleGroupItem>
          <ToggleGroupItem value="Women">السيدات</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">أبرز الأنماط</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">قفزات النصف الثاني أقل نظافة</div>
            <p className="text-muted-foreground mt-1">
              في البرامج الحرة، القفزات الثلاثية والرباعية التي تحصل على مكافأة النصف الثاني نظيفة بنسبة {pct(half[1].cleanRate, 1)} مقابل {pct(half[0].cleanRate, 1)} في النصف الأول
              {halfDrop != null ? ` – أقل بـ ${halfDrop.toFixed(1)} نقطة مئوية${halfSeparated ? "، وفترات الثقة لا تتداخل" : ""}.` : "."} الإرهاق عامل محتمل، لكن المتزلجين يختارون أيضًا القفزات التي يضعونها هناك.
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">كيف تفشل قفزة <span dir="ltr">{focus?.jump}</span></div>
            <p className="text-muted-foreground mt-1">
              {focus &&
                `أعلى قفزة قيمةً لدى ${DISC[discipline]} بأكثر من 100 محاولة منفردة: ${pct(focus.cleanRate)} نظيفة، ${pct(focus.fallRate)} سقوط، ${pct(focus.quarterRate + focus.underRate + focus.downgradeRate)} نداءات دوران (q, <, <<)${focus.wrongEdgeRate != null ? `، ${pct(focus.wrongEdgeRate + (focus.edgeAttentionRate ?? 0))} نداءات حافة` : ""}. قد تجتمع في القفزة الواحدة سقطة ونداء.`}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">موضع العنصر في البرنامج مهم</div>
            <p className="text-muted-foreground mt-1">
              تبلغ نسبة النظافة ذروتها عند العنصر {bestPos.position} ({pct(bestPos.cleanRate)}) وتنخفض إلى {pct(worstAfter.cleanRate)} عند العنصر {worstAfter.position}. كانت القفزات في الأولمبياد نظيفة بنسبة {pct(J.patterns.olympics[1].cleanRate)} مقابل {pct(J.patterns.olympics[0].cleanRate)} في غيرها – غالبًا لأن الأقوى فقط هم من يتأهلون.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title={`نسبة النظافة حسب القفزة – ${DISC[discipline]} (قفزات منفردة)`}
          description="نسبة القفزات الثلاثية والرباعية المنفردة بلا نداء ولا سقوط. الخطوط الأفقية تمثل فترة الثقة 95%."
          height={Math.max(260, types.length * 30 + 50)}
          chart={
            <BarChart data={types} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }} barCategoryGap={6}>
              <CartesianGrid stroke={VIZ.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} unit="%" />
              <YAxis type="category" dataKey="jump" {...axisProps} width={44} interval={0} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "نظيفة"]}
                labelFormatter={(label: string, payload) => {
                  const t = payload?.[0]?.payload as (typeof types)[number] | undefined;
                  return t ? `${label} – n=${t.n}، سقوط ${pct(t.fallRate)}، متوسط GOE ${t.meanGoe?.toFixed(2)}` : label;
                }}
              />
              <Bar dataKey="clean" fill={VIZ.series[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <ErrorBar dataKey="ciErr" width={4} stroke="hsl(var(--foreground))" direction="x" />
              </Bar>
            </BarChart>
          }
          table={
            <DataTable
              head={["القفزة", "n", "نظيفة", "سقوط", "q", "<", "<<", "e / !", "GOE", "GOE للنظيفة"]}
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
            <CardTitle className="text-base">ما الذي يغيّر الفرص؟ (رجال وسيدات، ثلاثية ورباعية)</CardTitle>
            <CardDescription>نسبة نظافة عناصر القفز في كل حالة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "البرنامج", rows: J.patterns.segment },
              { title: "الموضع في البرنامج الحر", rows: J.patterns.half },
              { title: "نوع العنصر", rows: J.patterns.elementType },
              { title: "البطولة", rows: J.patterns.olympics },
            ].map((g) => (
              <div key={g.title}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
                {g.rows.map((r) => <RateRow key={r.group} label={GROUP_LABELS[r.group] ?? r.group} rate={r.cleanRate} ci={r.cleanCi} n={r.n} />)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title="نسبة النظافة حسب ترتيب العنصر في البرنامج الحر"
          description="كل البرامج الحرة لفردي الكبار؛ ترقيم العناصر يشمل الدورانات والخطوات، لذلك نادرًا ما تأتي القفزات في الموضعين 5 و10."
          chart={
            <LineChart data={pos.map((p) => ({ ...p, clean: (p.cleanRate ?? 0) * 100 }))} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="position" {...axisProps} />
              <YAxis {...axisProps} domain={[50, 90]} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "نظيفة"]} labelFormatter={(p: number) => `العنصر ${p}`} />
              <Line dataKey="clean" stroke={VIZ.series[0]} strokeWidth={2} dot={{ r: 4, fill: VIZ.series[0], stroke: "hsl(var(--card))", strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          }
          table={<DataTable head={["العنصر", "n", "نظيفة", "سقوط"]} rows={pos.map((p) => [p.position, p.n, pct(p.cleanRate, 1), pct(p.fallRate, 1)])} />}
        />

        <VizCard
          title="درجة التنفيذ (GOE) للقفزات النظيفة والفاشلة"
          description="القفزات الثلاثية والرباعية. قد تحصل القفزة النظيفة على GOE سالبة (مثل هبوط ضعيف)، والنداء يدفع GOE تحت الصفر في أغلب الأحيان."
          chart={
            <BarChart data={hist} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} barCategoryGap={1}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={1} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} labelFormatter={(l: string, payload) => {
                const h = payload?.[0]?.payload as (typeof hist)[number] | undefined;
                return h ? `GOE من ${h.from} إلى ${h.to}` : l;
              }} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendText} />
              <Bar dataKey="clean" name="نظيفة" stackId="g" fill={VIZ.good} stroke="hsl(var(--card))" strokeWidth={1} isAnimationActive={false} />
              <Bar dataKey="notClean" name="نداء أو سقوط" stackId="g" fill={VIZ.critical} stroke="hsl(var(--card))" strokeWidth={1} isAnimationActive={false} />
            </BarChart>
          }
          table={<DataTable head={["GOE", "نظيفة", "نداء أو سقوط"]} rows={hist.map((h) => [<span dir="ltr">{h.from} → {h.to}</span>, h.clean, h.notClean])} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VizCard
          title={`محاولات ${hardLabel} لكل برنامج حر`}
          description={`${DISC[discipline]}، حسب الموسم. أُقيمت بطولات قليلة في موسم 2020/21 بسبب الجائحة.`}
          chart={
            <BarChart data={trends} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="season" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} formatter={(v: number) => [v.toFixed(2), "محاولات لكل برنامج"]} labelFormatter={(s: string, payload) => {
                const t = payload?.[0]?.payload as (typeof trends)[number] | undefined;
                return t ? `${s} – ${t.performances} برنامجًا حرًا` : s;
              }} />
              <Bar dataKey="attemptsPerProgram" fill={VIZ.series[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          }
          table={<DataTable head={["الموسم", "البرامج الحرة", "محاولات / برنامج", "المحاولات", "نظيفة"]} rows={trends.map((t) => [t.season, t.performances, t.attemptsPerProgram?.toFixed(2), t.n, pct(t.cleanRate, 1)])} />}
        />

        <VizCard
          title={`نسبة نظافة ${hardLabel} حسب الموسم`}
          description={`${DISC[discipline]}. المواسم ذات المحاولات القليلة تتذبذب كثيرًا – راجع n في الجدول.`}
          chart={
            <LineChart data={trends.map((t) => ({ ...t, clean: (t.cleanRate ?? 0) * 100 }))} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="season" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "نظيفة"]} labelFormatter={(s: string, payload) => {
                const t = payload?.[0]?.payload as (typeof trends)[number] | undefined;
                return t ? `${s} – n=${t.n}` : s;
              }} />
              <Line dataKey="clean" stroke={VIZ.series[0]} strokeWidth={2} dot={{ r: 4, fill: VIZ.series[0], stroke: "hsl(var(--card))", strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          }
          table={<DataTable head={["الموسم", "المحاولات", "نظيفة"]} rows={trends.map((t) => [t.season, t.n, pct(t.cleanRate, 1)])} />}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">أكثر مجموعات القفز شيوعًا</CardTitle>
          <CardDescription>فردي الكبار، رجال وسيدات معًا. تُعد المجموعة نظيفة فقط إذا كانت كل قفزاتها نظيفة.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[420px] overflow-auto">
          <DataTable
            head={["المجموعة", "المحاولات", "نظيفة", "سقوط", "متوسط GOE"]}
            rows={J.combos.map((c) => [<span className="font-mono" dir="ltr">{c.combo}</span>, c.n, pct(c.cleanRate, 1), pct(c.fallRate, 1), c.meanGoe?.toFixed(2)])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
