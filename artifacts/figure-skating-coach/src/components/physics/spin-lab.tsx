import { useMemo, useState } from "react";
import { POSTURES, momentOfInertia, simulateSpin, type Posture, type PostureName } from "@workspace/skating-physics";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { VIZ, axisProps, tooltipStyle } from "@/lib/viz";
import { Formula, ParamSlider, Stat, fmt } from "./controls";
import { ChartCard } from "./jump-lab";

const POSTURE_LABELS: Partial<Record<PostureName, string>> = {
  uprightEntry: "دخول بوضع قائم (الذراعان والساق ممدودة)",
  armsOut: "وضع قائم، الذراعان ممدودتان",
  scratch: "دوران Scratch (الذراعان والساق مضمومتان)",
  sit: "دوران الجلوس",
  camel: "دوران الجمل (Camel)",
};
const postureOptions = Object.keys(POSTURE_LABELS) as PostureName[];

interface State {
  mass: number;
  height: number;
  entry: PostureName;
  final: Posture;
  finalPreset: PostureName;
  entryOmega: number;
  entryHold: number;
  transitionTime: number;
  duration: number;
  friction: number;
  contactRadius: number;
  airDrag: boolean;
}

const initial: State = {
  mass: 55,
  height: 1.65,
  entry: "uprightEntry",
  final: POSTURES.scratch,
  finalPreset: "scratch",
  entryOmega: 1.6,
  entryHold: 1.5,
  transitionTime: 1,
  duration: 8,
  friction: 0.006,
  contactRadius: 0.02,
  airDrag: true,
};

const SEGMENTS = [
  { key: "trunk", label: "الجذع والرأس" },
  { key: "arms", label: "الذراعان" },
  { key: "freeLeg", label: "الساق الحرة" },
  { key: "skatingLeg", label: "ساق الارتكاز" },
] as const;

export function SpinLab() {
  const [s, setS] = useState<State>(initial);
  const set = <K extends keyof State>(key: K) => (value: State[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const setFinal = (key: keyof Posture) => (value: number) => setS((prev) => ({ ...prev, final: { ...prev.final, [key]: value } }));
  const body = { massKg: s.mass, heightM: s.height };

  const result = useMemo(
    () =>
      simulateSpin({
        body,
        entryPosture: POSTURES[s.entry],
        finalPosture: s.final,
        entryOmega: s.entryOmega,
        entryHold: s.entryHold,
        transitionTime: s.transitionTime,
        duration: s.duration,
        friction: s.friction,
        contactRadius: s.contactRadius,
        airDrag: s.airDrag,
      }),
    [s],
  );

  const inertiaBars = useMemo(() => {
    const entry = momentOfInertia(body, POSTURES[s.entry]);
    const final = momentOfInertia(body, s.final);
    return [
      { position: "البداية", ...entry },
      { position: "النهاية", ...final },
    ];
  }, [s]);

  const series = result.samples.map((p) => ({ t: p.t, omega: p.omegaRevPerSec, L: p.angularMomentum }));
  const endOmega = result.samples.at(-1)!.omegaRevPerSec;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>متغيرات الدوران المغزلي</CardTitle>
          <CardDescription>ادخل الدوران بوضع ما ثم انتقل إلى وضع آخر.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">المتزلج</h3>
            <ParamSlider id="s-mass" label="كتلة الجسم" unit="كجم" digits={0} min={35} max={90} step={1} value={s.mass} onChange={set("mass")} />
            <ParamSlider id="s-height" label="الطول" unit="م" min={1.4} max={1.95} step={0.01} value={s.height} onChange={set("height")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">الأوضاع</h3>
            <div className="space-y-2">
              <Label htmlFor="s-entry">وضع البداية</Label>
              <Select value={s.entry} onValueChange={(v) => set("entry")(v as PostureName)}>
                <SelectTrigger id="s-entry"><SelectValue /></SelectTrigger>
                <SelectContent>{postureOptions.map((p) => <SelectItem key={p} value={p}>{POSTURE_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-final">الوضع النهائي</Label>
              <Select value={s.finalPreset} onValueChange={(v) => setS((prev) => ({ ...prev, finalPreset: v as PostureName, final: POSTURES[v as PostureName] }))}>
                <SelectTrigger id="s-final"><SelectValue /></SelectTrigger>
                <SelectContent>{postureOptions.map((p) => <SelectItem key={p} value={p}>{POSTURE_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <ParamSlider id="s-arm" label="امتداد الذراعين في الوضع النهائي" min={0} max={1} step={0.05} value={s.final.armExtension} onChange={setFinal("armExtension")} />
            <ParamSlider id="s-leg" label="زاوية الساق الحرة في الوضع النهائي" unit="°" digits={0} min={0} max={90} step={5} value={s.final.freeLegAngleDeg} onChange={setFinal("freeLegAngleDeg")} />
            <ParamSlider id="s-lean" label="ميل الجذع في الوضع النهائي" unit="°" digits={0} min={0} max={90} step={5} value={s.final.torsoLeanDeg} onChange={setFinal("torsoLeanDeg")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">التوقيت</h3>
            <ParamSlider id="s-w0" label="سرعة الدوران عند الدخول ω" unit="لفة/ث" min={0.5} max={4} step={0.05} value={s.entryOmega} onChange={set("entryOmega")} />
            <ParamSlider id="s-hold" label="الزمن قبل ضم الذراعين" unit="ث" digits={1} min={0} max={5} step={0.1} value={s.entryHold} onChange={set("entryHold")} />
            <ParamSlider id="s-trans" label="مدة تغيير الوضع" unit="ث" digits={1} min={0.1} max={3} step={0.1} value={s.transitionTime} onChange={set("transitionTime")} />
            <ParamSlider id="s-dur" label="زمن المحاكاة" unit="ث" digits={0} min={2} max={20} step={1} value={s.duration} onChange={set("duration")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">الفواقد</h3>
            <ParamSlider id="s-mu" label="معامل احتكاك الشفرة بالجليد μ" digits={3} min={0} max={0.03} step={0.001} value={s.friction} onChange={set("friction")} />
            <ParamSlider id="s-rc" label="ذراع عزم التلامس r_c" unit="سم" digits={1} min={0} max={5} step={0.1} value={s.contactRadius * 100} onChange={(v) => set("contactRadius")(v / 100)} />
            <div className="flex items-center justify-between">
              <Label htmlFor="s-drag">مقاومة الهواء على الأطراف</Label>
              <Switch id="s-drag" checked={s.airDrag} onCheckedChange={set("airDrag")} />
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setS(initial)}>إعادة الضبط</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="أقصى سرعة" value={`${fmt(result.peakOmegaRevPerSec)} لفة/ث`} sub={`${fmt(result.peakRpm, 0)} لفة/دقيقة`} />
          <Stat label="التسارع دون فواقد" value={`× ${fmt(result.idealSpeedUp)}`} sub="= I_entry / I_final" />
          <Stat label="عدد اللفات" value={fmt(result.totalRevolutions, 1)} sub={result.stopTime != null ? `يتوقف عند ${fmt(result.stopTime, 1)} ث` : `ما زال ${fmt(endOmega)} لفة/ث عند ${s.duration} ث`} />
          <Stat label="عزم القصور الذاتي" value={<span dir="ltr">{`${fmt(result.inertiaEntry)} → ${fmt(result.inertiaFinal)}`}</span>} sub="كجم·م²" />
          <Stat label="شغل ضم الذراعين" value={`${fmt(result.pullInWork, 0)} جول`} sub="شغل العضلات، بإهمال الفواقد" />
          <Stat label="عزم الاحتكاك" value={`${fmt(result.frictionTorque, 3)} نيوتن·م`} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="سرعة الدوران" description="ضم الأطراف مع ثبات L يسرّع الدوران، ثم يبطئه الاحتكاك ومقاومة الهواء.">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(0)} {...axisProps} unit=" ث" />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} لفة/ث`, "ω"]} labelFormatter={(t: number) => `t = ${t.toFixed(2)} ث`} />
              <Line dataKey="omega" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="الزخم الزاوي" description="ثابت إلا بتأثير عزوم الدوران الخارجية: احتكاك الشفرة ومقاومة الهواء.">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(0)} {...axisProps} unit=" ث" />
              <YAxis {...axisProps} domain={[0, "auto"]} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} كجم·م²/ث`, "L"]} labelFormatter={(t: number) => `t = ${t.toFixed(2)} ث`} />
              <Line dataKey="L" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>
        </div>

        <ChartCard title="من أين يأتي عزم القصور الذاتي" description="مساهمة كل جزء من الجسم، I = Σ m·k²، بوحدة كجم·م².">
          <BarChart data={inertiaBars} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 8 }} barCategoryGap={12}>
            <CartesianGrid stroke={VIZ.grid} horizontal={false} />
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="position" {...axisProps} width={60} />
            <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`${v.toFixed(2)} كجم·م²`, name]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span className="text-foreground">{value}</span>} />
            {SEGMENTS.map((seg, i) => (
              <Bar key={seg.key} dataKey={seg.key} name={seg.label} stackId="I" fill={VIZ.series[i]} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false} />
            ))}
          </BarChart>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>المعادلات والقيم الحالية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Formula name="حفظ الزخم الزاوي" formula="I_entry·ω_entry = I_final·ω_final" evaluated={`${fmt(result.inertiaEntry)} × ${fmt(s.entryOmega)} = ${fmt(result.inertiaFinal)} × ω  →  ω = ${fmt(s.entryOmega * result.idealSpeedUp)} rev/s (دون فواقد)`} />
            <Formula name="نسبة التسارع" formula="ω_final / ω_entry = I_entry / I_final" evaluated={`${fmt(result.inertiaEntry)} / ${fmt(result.inertiaFinal)} = ${fmt(result.idealSpeedUp)}`} />
            <Formula name="عزم احتكاك الشفرة" formula="τ_f = μ·m·g·r_c" evaluated={`${fmt(s.friction, 3)} × ${s.mass} × 9.81 × ${fmt(s.contactRadius, 3)} = ${fmt(result.frictionTorque, 3)} N·m`} />
            <Formula name="عزم مقاومة الهواء" formula="τ_d = c·ω²,  c = ½ρC_d·Σ w·(r₂⁴ − r₁⁴)/4" note="يزداد مع القوة الرابعة لمدى امتداد الأطراف، ولهذا تتباطأ الأوضاع المفتوحة بسرعة." />
            <Formula name="تباطؤ الدوران" formula="dL/dt = −τ_f − c·ω²" />
            <Formula name="الشغل المبذول في ضم الأطراف" formula="W = L²/2 · (1/I_final − 1/I_entry)" evaluated={`W = ${fmt(result.pullInWork, 0)} J`} note="الطاقة الحركية لا تُحفظ عندما يضم المتزلج أطرافه – فالعضلات هي التي تمدّها." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
