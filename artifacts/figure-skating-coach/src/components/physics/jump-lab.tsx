import { useMemo, useState } from "react";
import {
  POSTURES,
  simulateJump,
  type JumpParams,
  type JumpType,
  type RotationCall,
} from "@workspace/skating-physics";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VIZ, axisProps, tooltipStyle } from "@/lib/viz";
import { Formula, ParamSlider, Stat, fmt } from "./controls";

const JUMPS: { code: string; revolutions: number; type: JumpType; vz: number; omega: number }[] = [
  { code: "3T", revolutions: 3, type: "T", vz: 2.9, omega: 2.2 },
  { code: "3S", revolutions: 3, type: "S", vz: 2.9, omega: 2.2 },
  { code: "3Lo", revolutions: 3, type: "Lo", vz: 2.9, omega: 2.2 },
  { code: "3F", revolutions: 3, type: "F", vz: 2.9, omega: 2.2 },
  { code: "3Lz", revolutions: 3, type: "Lz", vz: 2.9, omega: 2.2 },
  { code: "3A", revolutions: 3, type: "A", vz: 3.0, omega: 2.5 },
  { code: "4T", revolutions: 4, type: "T", vz: 3.25, omega: 2.5 },
  { code: "4S", revolutions: 4, type: "S", vz: 3.25, omega: 2.5 },
  { code: "4Lo", revolutions: 4, type: "Lo", vz: 3.25, omega: 2.55 },
  { code: "4F", revolutions: 4, type: "F", vz: 3.25, omega: 2.55 },
  { code: "4Lz", revolutions: 4, type: "Lz", vz: 3.3, omega: 2.55 },
  { code: "4A", revolutions: 4, type: "A", vz: 3.35, omega: 2.9 },
];

const GRAVITY_PRESETS = [
  { label: "الأرض", g: 9.81 },
  { label: "المريخ", g: 3.71 },
  { label: "القمر", g: 1.62 },
];

const CALL_LABEL: Record<RotationCall, string> = {
  clean: "مكتملة الدوران",
  q: "q – هبوط على ربع لفة",
  "<": "< ناقصة الدوران",
  "<<": "<< مخفّضة",
  over: "زائدة الدوران",
};

type SweepKey = "verticalVelocity" | "takeoffOmega" | "airArm" | "pullInTime" | "gravity";
const SWEEPS: Record<SweepKey, { label: string; unit: string; min: number; max: number }> = {
  verticalVelocity: { label: "السرعة الرأسية عند الارتقاء", unit: "م/ث", min: 1.5, max: 4.5 },
  takeoffOmega: { label: "سرعة الدوران عند الارتقاء", unit: "لفة/ث", min: 0.8, max: 4 },
  airArm: { label: "امتداد الذراعين في الهواء", unit: "", min: 0, max: 1 },
  pullInTime: { label: "زمن ضم الذراعين", unit: "ث", min: 0.04, max: 0.3 },
  gravity: { label: "الجاذبية", unit: "م/ث²", min: 1.6, max: 15 },
};

interface State {
  jump: string;
  mass: number;
  height: number;
  verticalVelocity: number;
  horizontalVelocity: number;
  takeoffOmega: number;
  preRotation: number;
  airArm: number;
  pullInTime: number;
  openOutTime: number;
  gravity: number;
}

const initial: State = {
  jump: "4T",
  mass: 55,
  height: 1.65,
  verticalVelocity: 3.25,
  horizontalVelocity: 4,
  takeoffOmega: 2.5,
  preRotation: 0.25,
  airArm: 0,
  pullInTime: 0.12,
  openOutTime: 0.1,
  gravity: 9.81,
};

function toParams(s: State, dt?: number): JumpParams {
  const jump = JUMPS.find((j) => j.code === s.jump)!;
  return {
    body: { massKg: s.mass, heightM: s.height },
    revolutions: jump.revolutions,
    type: jump.type,
    verticalVelocity: s.verticalVelocity,
    horizontalVelocity: s.horizontalVelocity,
    takeoffOmega: s.takeoffOmega,
    takeoffPosture: POSTURES.takeoff,
    airPosture: { ...POSTURES.airTight, armExtension: s.airArm },
    landingPosture: POSTURES.landing,
    pullInTime: s.pullInTime,
    openOutTime: s.openOutTime,
    preRotation: s.preRotation,
    gravity: s.gravity,
    dt,
  };
}

export function JumpLab() {
  const [s, setS] = useState<State>(initial);
  const [sweep, setSweep] = useState<SweepKey>("verticalVelocity");
  const set = <K extends keyof State>(key: K) => (value: State[K]) => setS((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => simulateJump(toParams(s)), [s]);

  const path = useMemo(
    () => result.samples.map((p) => ({ t: p.t, x: s.horizontalVelocity * p.t, height: p.heightM, omega: p.omegaRevPerSec, revs: p.revolutions })),
    [result, s.horizontalVelocity],
  );

  const sweepData = useMemo(() => {
    const range = SWEEPS[sweep];
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const v = range.min + ((range.max - range.min) * i) / 40;
      const r = simulateJump(toParams({ ...s, [sweep]: v }, 0.002));
      points.push({ x: v, revs: r.totalRevolutions });
    }
    return points;
  }, [s, sweep]);

  const chooseJump = (code: string) => {
    const j = JUMPS.find((x) => x.code === code)!;
    setS((prev) => ({ ...prev, jump: code, verticalVelocity: j.vz, takeoffOmega: j.omega }));
  };

  const callVariant = result.call === "clean" ? "default" : result.call === "q" || result.call === "over" ? "secondary" : "destructive";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>متغيرات القفزة</CardTitle>
          <CardDescription>غيّر أي متغير وستتحدث كل النتائج فورًا.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="jump-type">القفزة</Label>
              <Select value={s.jump} onValueChange={chooseJump}>
                <SelectTrigger id="jump-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JUMPS.map((j) => <SelectItem key={j.code} value={j.code}>{j.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gravity-preset">الجاذبية</Label>
              <Select
                value={GRAVITY_PRESETS.find((p) => p.g === s.gravity)?.label ?? "custom"}
                onValueChange={(v) => { const p = GRAVITY_PRESETS.find((x) => x.label === v); if (p) set("gravity")(p.g); }}
              >
                <SelectTrigger id="gravity-preset"><SelectValue placeholder="مخصصة" /></SelectTrigger>
                <SelectContent>
                  {GRAVITY_PRESETS.map((p) => <SelectItem key={p.label} value={p.label}>{p.label} ({p.g})</SelectItem>)}
                  <SelectItem value="custom" disabled>مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">المتزلج</h3>
            <ParamSlider id="j-mass" label="كتلة الجسم" unit="كجم" digits={0} min={35} max={90} step={1} value={s.mass} onChange={set("mass")} />
            <ParamSlider id="j-height" label="الطول" unit="م" min={1.4} max={1.95} step={0.01} value={s.height} onChange={set("height")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">الارتقاء</h3>
            <ParamSlider id="j-vz" label="السرعة الرأسية" unit="م/ث" min={1.5} max={4.5} step={0.05} value={s.verticalVelocity} onChange={set("verticalVelocity")} hint={`ارتفاع القفزة ${fmt(result.peakHeight)} م`} />
            <ParamSlider id="j-vh" label="السرعة الأفقية" unit="م/ث" min={0} max={8} step={0.1} value={s.horizontalVelocity} onChange={set("horizontalVelocity")} />
            <ParamSlider id="j-w0" label="سرعة الدوران عند الارتقاء ω₀" unit="لفة/ث" min={0.8} max={4} step={0.05} value={s.takeoffOmega} onChange={set("takeoffOmega")} hint={`المطلوب لإكمال ${result.required} لفة: ${fmt(result.requiredTakeoffOmega)} لفة/ث`} />
            <ParamSlider id="j-pre" label="الدوران على الجليد قبل الارتقاء" unit="لفة" min={0} max={0.5} step={0.05} value={s.preRotation} onChange={set("preRotation")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">الوضع في الهواء</h3>
            <ParamSlider id="j-arm" label="امتداد الذراعين في الهواء" min={0} max={1} step={0.05} value={s.airArm} onChange={set("airArm")} hint="0 = الذراعان مضمومتان بإحكام، 1 = الذراعان ممدودتان تمامًا" />
            <ParamSlider id="j-in" label="زمن ضم الذراعين" unit="ث" min={0.04} max={0.3} step={0.01} value={s.pullInTime} onChange={set("pullInTime")} />
            <ParamSlider id="j-out" label="الانفتاح قبل الهبوط" unit="ث" min={0} max={0.2} step={0.01} value={s.openOutTime} onChange={set("openOutTime")} />
            <ParamSlider id="j-g" label="الجاذبية g" unit="م/ث²" min={1} max={20} step={0.01} value={s.gravity} onChange={set("gravity")} />
          </div>

          <Button variant="outline" className="w-full" onClick={() => setS(initial)}>إعادة الضبط</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="الدوران عند الهبوط" value={`${fmt(result.totalRevolutions)} لفة`} sub={<Badge variant={callVariant}>{CALL_LABEL[result.call]}</Badge>} />
          <Stat label="زمن الطيران" value={`${fmt(result.flightTime, 3)} ث`} />
          <Stat label="ارتفاع القفزة (مركز الكتلة)" value={`${fmt(result.peakHeight)} م`} />
          <Stat label="أقصى سرعة دوران" value={`${fmt(result.maxOmegaRevPerSec)} لفة/ث`} sub={`${fmt(result.maxOmegaRevPerSec * 60, 0)} لفة/دقيقة`} />
          <Stat label="المسافة" value={`${fmt(result.distance)} م`} sub={`زاوية الارتقاء ${fmt(result.takeoffAngleDeg, 0)}°`} />
          <Stat label="الزخم الزاوي L" value={`${fmt(result.angularMomentum, 1)}`} sub="كجم·م²/ث" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="الدوران المكتمل" description={`عدد اللفات مقابل الزمن. المطلوب ${result.required} لفة؛ وتحت ${result.required - 0.25} تحصل القفزة على نداء من اللجنة الفنية.`}>
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(2)} {...axisProps} unit=" ث" />
              <YAxis {...axisProps} domain={[0, Math.ceil(result.required + 0.5)]} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} لفة`, "الدوران"]} labelFormatter={(t: number) => `t = ${t.toFixed(3)} ث`} />
              <ReferenceLine y={result.required} stroke={VIZ.axis} label={{ value: `${result.required} لفة`, position: "insideTopLeft", fill: VIZ.axis, fontSize: 11 }} />
              <ReferenceLine y={result.required - 0.25} stroke={VIZ.grid} />
              <Line dataKey="revs" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="سرعة الدوران" description="ω = L / I(t): تزداد عند ضم الذراعين وتنخفض عندما ينفتح المتزلج.">
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(2)} {...axisProps} unit=" ث" />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} لفة/ث`, "ω"]} labelFormatter={(t: number) => `t = ${t.toFixed(3)} ث`} />
              <Line dataKey="omega" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="مسار الطيران" description="ارتفاع مركز الكتلة مقابل المسافة المقطوعة (قطع مكافئ تحت تأثير الجاذبية).">
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(1)} {...axisProps} unit=" م" />
              <YAxis {...axisProps} domain={[0, "auto"]} tickFormatter={(v) => v.toFixed(2)} unit=" م" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)} م`, "الارتفاع"]} labelFormatter={(x: number) => `${x.toFixed(2)} م أفقيًا`} />
              <Line dataKey="height" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard
            title="ماذا لو"
            description="الدوران عند الهبوط عند تغيير متغير واحد مع تثبيت كل ما عداه."
            action={
              <Select value={sweep} onValueChange={(v) => setSweep(v as SweepKey)}>
                <SelectTrigger className="h-8 w-full" aria-label="المتغير المراد تغييره"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SWEEPS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            }
          >
            <LineChart data={sweepData} margin={{ top: 20, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => v.toFixed(1)} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} لفة`, "الدوران"]} labelFormatter={(x: number) => `${SWEEPS[sweep].label}: ${x.toFixed(2)} ${SWEEPS[sweep].unit}`} />
              <ReferenceLine y={result.required} stroke={VIZ.axis} label={{ value: `${result.required} لفة`, position: "insideTopLeft", fill: VIZ.axis, fontSize: 11 }} />
              <ReferenceLine x={s[sweep]} stroke={VIZ.axis} label={{ value: "الآن", position: "top", fill: VIZ.axis, fontSize: 11 }} />
              <Line dataKey="revs" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعادلات والقيم الحالية</CardTitle>
            <CardDescription>
              كتلة الجسم وطوله يغيّران كل عزوم القصور الذاتي بالنسبة نفسها، لذلك لا يغيّران الدوران عند سرعة ارتقاء معيّنة – بل يغيّران مقدار الزخم الزاوي الذي يجب أن يولّده الارتقاء.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Formula name="زمن الطيران" formula="t = 2·v_z / g" evaluated={`t = 2 × ${fmt(s.verticalVelocity)} / ${fmt(s.gravity)} = ${fmt(result.flightTime, 3)} s`} />
            <Formula name="ارتفاع القفزة" formula="h = v_z² / (2g)" evaluated={`h = ${fmt(s.verticalVelocity)}² / (2 × ${fmt(s.gravity)}) = ${fmt(result.peakHeight, 3)} m`} />
            <Formula name="عزم القصور الذاتي" formula="I = Σ mᵢ·kᵢ²  (trunk, arms, legs)" evaluated={`I_take-off = ${fmt(result.inertiaTakeoff)}, I_air = ${fmt(result.inertiaAir)}, I_landing = ${fmt(result.inertiaLanding)} kg·m²`} note="كتل أجزاء الجسم وفق نسب Dempster، والأطراف ممثلة كقضبان." />
            <Formula name="حفظ الزخم الزاوي" formula="L = I₀·ω₀ = I_air·ω_air" evaluated={`${fmt(result.inertiaTakeoff)} × ${fmt(s.takeoffOmega)} rev/s → ω_air = ${fmt(result.maxOmegaRevPerSec)} rev/s`} note="تؤثر الجاذبية في مركز الكتلة فلا تُحدث عزم دوران، لذا يبقى L ثابتًا في الهواء." />
            <Formula name="الدوران" formula="θ = θ_ice + ∫₀ᵗ L / I(t) dt" evaluated={`${fmt(s.preRotation)} + ${fmt(result.airRevolutions)} = ${fmt(result.totalRevolutions)} rev (المطلوب ${result.required})`} />
            <Formula name="الطاقة الحركية الدورانية" formula="E = L² / (2I)" evaluated={`${fmt(result.rotationalEnergyTakeoff, 0)} J → ${fmt(result.rotationalEnergyAir, 0)} J`} note="الطاقة الإضافية هي شغل العضلات المبذول لضم الذراعين ضد الأثر الطارد المركزي." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action && <div className="pt-2">{action}</div>}
      </CardHeader>
      <CardContent>
        <div className="h-[240px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCard };
