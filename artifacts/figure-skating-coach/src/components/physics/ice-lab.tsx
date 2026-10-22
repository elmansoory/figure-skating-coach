import { useMemo, useState } from "react";
import { edgeLeanAngleDeg, frictionalMeltFilm, pressureMelting, simulateGlide } from "@workspace/skating-physics";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VIZ, axisProps, tooltipStyle } from "@/lib/viz";
import { Formula, ParamSlider, Stat, fmt } from "./controls";
import { ChartCard } from "./jump-lab";

export function IceLab() {
  const [mass, setMass] = useState(55);
  const [speed, setSpeed] = useState(5);
  const [friction, setFriction] = useState(0.006);
  const [dragArea, setDragArea] = useState(0.35);
  const [contactWidthMm, setContactWidthMm] = useState(1);
  const [contactLengthCm, setContactLengthCm] = useState(3);
  const [iceTemp, setIceTemp] = useState(-4);
  const [radius, setRadius] = useState(4);

  const glide = useMemo(() => simulateGlide({ massKg: mass, initialSpeed: speed, friction, dragArea }), [mass, speed, friction, dragArea]);
  const melt = pressureMelting({ massKg: mass, contactWidth: contactWidthMm / 1000, contactLength: contactLengthCm / 100, iceTemperatureC: iceTemp });
  const film = frictionalMeltFilm(mass, friction, contactWidthMm / 1000);
  const lean = edgeLeanAngleDeg(speed, radius);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>متغيرات الشفرة والجليد</CardTitle>
          <CardDescription>تلامس الفولاذ مع الجليد من أقل أنواع التلامس احتكاكًا في الرياضة (μ ≈ 0.003–0.01).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ParamSlider id="i-mass" label="كتلة الجسم" unit="كجم" digits={0} min={35} max={90} step={1} value={mass} onChange={setMass} />
          <ParamSlider id="i-v" label="سرعة التزلج" unit="م/ث" digits={1} min={0.5} max={10} step={0.1} value={speed} onChange={setSpeed} hint={`${fmt(speed * 3.6, 1)} كم/س`} />
          <ParamSlider id="i-mu" label="معامل الاحتكاك μ" digits={3} min={0.002} max={0.03} step={0.001} value={friction} onChange={setFriction} />
          <ParamSlider id="i-cda" label="مساحة المقاومة C_d·A" unit="م²" min={0} max={0.8} step={0.01} value={dragArea} onChange={setDragArea} hint="≈0.25 في وضع الانحناء، ≈0.5 في الوضع القائم مع مدّ الذراعين" />
          <ParamSlider id="i-w" label="عرض تلامس الشفرة" unit="مم" digits={1} min={0.5} max={4.5} step={0.1} value={contactWidthMm} onChange={setContactWidthMm} hint="≈4 مم على الحافتين معًا، ≈1 مم على حافة واحدة" />
          <ParamSlider id="i-l" label="طول الجزء المتلامس من انحناء الشفرة" unit="سم" digits={1} min={1} max={10} step={0.5} value={contactLengthCm} onChange={setContactLengthCm} />
          <ParamSlider id="i-t" label="درجة حرارة الجليد" unit="°م" digits={1} min={-10} max={0} step={0.5} value={iceTemp} onChange={setIceTemp} />
          <ParamSlider id="i-r" label="نصف قطر المنحنى" unit="م" digits={1} min={1} max={15} step={0.5} value={radius} onChange={setRadius} />
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="مسافة الانزلاق" value={`${fmt(glide.stopDistance, 0)} م`} sub={`بالاحتكاك وحده: ${fmt(glide.frictionOnlyDistance, 0)} م`} />
          <Stat label="زمن الانزلاق" value={`${fmt(glide.stopTime, 0)} ث`} />
          <Stat label="ضغط الشفرة" value={`${fmt(melt.pressureAtm, 0)} ضغط جوي`} sub={`${fmt(melt.pressurePa / 1e6, 1)} ميغاباسكال`} />
          <Stat
            label="نقطة الانصهار تحت الشفرة"
            value={`${fmt(melt.meltingPointC)} °م`}
            sub={<Badge variant={melt.meltsByPressureAlone ? "default" : "secondary"}>{melt.meltsByPressureAlone ? "الضغط وحده يذيب هذا الجليد" : "الضغط وحده لا يذيب هذا الجليد"}</Badge>}
          />
          <Stat label="طبقة الماء الذائب (حد أعلى)" value={`${fmt(film.filmThicknessM * 1e6, 1)} ميكرومتر`} sub={`${fmt(film.heatPerMetre, 1)} جول من الحرارة لكل متر`} />
          <Stat label="ميل الحافة على المنحنى" value={`${fmt(lean, 0)}°`} sub="عن الخط الرأسي" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="الانزلاق: السرعة مقابل المسافة" description="انزلاق بلا دفع: الاحتكاك ومقاومة الهواء فقط.">
            <LineChart data={glide.samples} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="distance" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(0)} {...axisProps} unit=" م" />
              <YAxis {...axisProps} unit=" م/ث" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} م/ث`, "السرعة"]} labelFormatter={(d: number) => `${d.toFixed(1)} م`} />
              <Line dataKey="speed" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">لماذا الجليد زلق؟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                الإجابة الشائعة في الكتب – الذوبان بالضغط – لا تصمد أمام الأرقام: الشفرة تخفض نقطة الانصهار هنا بمقدار {fmt(Math.abs(melt.meltingPointC))} °م فقط، وهذا لا يكفي لجليد حلبة درجة حرارته {fmt(iceTemp, 1)} °م.
              </p>
              <p>
                التفسيرات الحالية تجمع بين طبقة رقيقة شبه سائلة موجودة على سطح الجليد حتى تحت 0 °م، والتسخين الناتج عن الاحتكاك الذي يمكنه في أقصى حد تكوين طبقة سُمكها نحو {fmt(film.filmThicknessM * 1e6, 1)} ميكرومتر لو ذهب كل جول منه إلى الإذابة.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعادلات والقيم الحالية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Formula name="الاحتكاك الحركي" formula="F_f = μ·N = μ·m·g" evaluated={`${fmt(friction, 3)} × ${mass} × 9.81 = ${fmt(friction * mass * 9.81)} N`} />
            <Formula name="معادلة الحركة (الانزلاق)" formula="m·dv/dt = −μ·m·g − ½ρ·C_dA·v²" />
            <Formula name="مسافة التوقف" formula="d = ln(1 + b·v₀²/a) / (2b),  a = μg, b = ρC_dA/2m" evaluated={`d = ${fmt(glide.stopDistance, 1)} m  (friction only v₀²/2μg = ${fmt(glide.frictionOnlyDistance, 1)} m)`} />
            <Formula name="ضغط التلامس" formula="p = m·g / (w·l)" evaluated={`${mass} × 9.81 / (${fmt(contactWidthMm / 1000, 4)} × ${fmt(contactLengthCm / 100, 3)}) = ${fmt(melt.pressurePa / 1e6, 2)} MPa`} />
            <Formula name="معادلة كلاوزيوس–كلابيرون (الجليد)" formula="ΔT_m = (dT/dp)·p ≈ −7.4×10⁻⁸ K/Pa · p" evaluated={`ΔT_m = ${fmt(melt.meltingPointC, 2)} K`} />
            <Formula name="طبقة الذوبان بالاحتكاك (حد أعلى)" formula="h = μ·m·g / (L_f·ρ_w·w)" evaluated={`h = ${fmt(film.filmThicknessM * 1e6, 2)} µm   (L_f = 334 kJ/kg)`} />
            <Formula name="ميل الحافة على منحنى" formula="tan θ = v² / (g·R)" evaluated={`θ = atan(${fmt(speed, 1)}² / (9.81 × ${fmt(radius, 1)})) = ${fmt(lean, 1)}°`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
