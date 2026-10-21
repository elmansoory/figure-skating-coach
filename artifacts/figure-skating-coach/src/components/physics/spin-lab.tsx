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
  uprightEntry: "Upright entry (arms and leg out)",
  armsOut: "Upright, arms out",
  scratch: "Scratch (arms and leg tight)",
  sit: "Sit spin",
  camel: "Camel spin",
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
  { key: "trunk", label: "Trunk & head" },
  { key: "arms", label: "Arms" },
  { key: "freeLeg", label: "Free leg" },
  { key: "skatingLeg", label: "Skating leg" },
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
      { position: "Entry", ...entry },
      { position: "Final", ...final },
    ];
  }, [s]);

  const series = result.samples.map((p) => ({ t: p.t, omega: p.omegaRevPerSec, L: p.angularMomentum }));
  const endOmega = result.samples.at(-1)!.omegaRevPerSec;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spin parameters</CardTitle>
          <CardDescription>Enter in one position, then change to another.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Skater</h3>
            <ParamSlider id="s-mass" label="Body mass" unit="kg" digits={0} min={35} max={90} step={1} value={s.mass} onChange={set("mass")} />
            <ParamSlider id="s-height" label="Height" unit="m" min={1.4} max={1.95} step={0.01} value={s.height} onChange={set("height")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Positions</h3>
            <div className="space-y-2">
              <Label htmlFor="s-entry">Entry position</Label>
              <Select value={s.entry} onValueChange={(v) => set("entry")(v as PostureName)}>
                <SelectTrigger id="s-entry"><SelectValue /></SelectTrigger>
                <SelectContent>{postureOptions.map((p) => <SelectItem key={p} value={p}>{POSTURE_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-final">Final position</Label>
              <Select value={s.finalPreset} onValueChange={(v) => setS((prev) => ({ ...prev, finalPreset: v as PostureName, final: POSTURES[v as PostureName] }))}>
                <SelectTrigger id="s-final"><SelectValue /></SelectTrigger>
                <SelectContent>{postureOptions.map((p) => <SelectItem key={p} value={p}>{POSTURE_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <ParamSlider id="s-arm" label="Final arm extension" min={0} max={1} step={0.05} value={s.final.armExtension} onChange={setFinal("armExtension")} />
            <ParamSlider id="s-leg" label="Final free-leg angle" unit="°" digits={0} min={0} max={90} step={5} value={s.final.freeLegAngleDeg} onChange={setFinal("freeLegAngleDeg")} />
            <ParamSlider id="s-lean" label="Final torso lean" unit="°" digits={0} min={0} max={90} step={5} value={s.final.torsoLeanDeg} onChange={setFinal("torsoLeanDeg")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Timing</h3>
            <ParamSlider id="s-w0" label="Entry spin ω" unit="rev/s" min={0.5} max={4} step={0.05} value={s.entryOmega} onChange={set("entryOmega")} />
            <ParamSlider id="s-hold" label="Time before pulling in" unit="s" digits={1} min={0} max={5} step={0.1} value={s.entryHold} onChange={set("entryHold")} />
            <ParamSlider id="s-trans" label="Change of position" unit="s" digits={1} min={0.1} max={3} step={0.1} value={s.transitionTime} onChange={set("transitionTime")} />
            <ParamSlider id="s-dur" label="Simulated time" unit="s" digits={0} min={2} max={20} step={1} value={s.duration} onChange={set("duration")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Losses</h3>
            <ParamSlider id="s-mu" label="Blade–ice friction μ" digits={3} min={0} max={0.03} step={0.001} value={s.friction} onChange={set("friction")} />
            <ParamSlider id="s-rc" label="Contact lever arm r_c" unit="cm" digits={1} min={0} max={5} step={0.1} value={s.contactRadius * 100} onChange={(v) => set("contactRadius")(v / 100)} />
            <div className="flex items-center justify-between">
              <Label htmlFor="s-drag">Air drag on limbs</Label>
              <Switch id="s-drag" checked={s.airDrag} onCheckedChange={set("airDrag")} />
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setS(initial)}>Reset</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Peak speed" value={`${fmt(result.peakOmegaRevPerSec)} rev/s`} sub={`${fmt(result.peakRpm, 0)} rpm`} />
          <Stat label="Speed-up if lossless" value={`× ${fmt(result.idealSpeedUp)}`} sub="= I_entry / I_final" />
          <Stat label="Revolutions" value={fmt(result.totalRevolutions, 1)} sub={result.stopTime != null ? `stops at ${fmt(result.stopTime, 1)} s` : `still ${fmt(endOmega)} rev/s at ${s.duration} s`} />
          <Stat label="Moment of inertia" value={`${fmt(result.inertiaEntry)} → ${fmt(result.inertiaFinal)}`} sub="kg·m²" />
          <Stat label="Work to pull in" value={`${fmt(result.pullInWork, 0)} J`} sub="muscle work, ignoring losses" />
          <Stat label="Friction torque" value={`${fmt(result.frictionTorque, 3)} N·m`} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Rotation speed" description="Pulling in at constant L speeds the spin up; friction and drag then slow it.">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(0)} {...axisProps} unit=" s" />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} rev/s`, "ω"]} labelFormatter={(t: number) => `t = ${t.toFixed(2)} s`} />
              <Line dataKey="omega" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Angular momentum" description="Constant except for the external torques: blade friction and air drag.">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(0)} {...axisProps} unit=" s" />
              <YAxis {...axisProps} domain={[0, "auto"]} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} kg·m²/s`, "L"]} labelFormatter={(t: number) => `t = ${t.toFixed(2)} s`} />
              <Line dataKey="L" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>
        </div>

        <ChartCard title="Where the inertia comes from" description="Contribution of each body segment, I = Σ m·k², in kg·m².">
          <BarChart data={inertiaBars} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 8 }} barCategoryGap={12}>
            <CartesianGrid stroke={VIZ.grid} horizontal={false} />
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="position" {...axisProps} width={50} />
            <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`${v.toFixed(2)} kg·m²`, name]} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span className="text-foreground">{value}</span>} />
            {SEGMENTS.map((seg, i) => (
              <Bar key={seg.key} dataKey={seg.key} name={seg.label} stackId="I" fill={VIZ.series[i]} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false} />
            ))}
          </BarChart>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Equations and current values</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Formula name="Conservation of angular momentum" formula="I_entry·ω_entry = I_final·ω_final" evaluated={`${fmt(result.inertiaEntry)} × ${fmt(s.entryOmega)} = ${fmt(result.inertiaFinal)} × ω  →  ω = ${fmt(s.entryOmega * result.idealSpeedUp)} rev/s (lossless)`} />
            <Formula name="Speed-up ratio" formula="ω_final / ω_entry = I_entry / I_final" evaluated={`${fmt(result.inertiaEntry)} / ${fmt(result.inertiaFinal)} = ${fmt(result.idealSpeedUp)}`} />
            <Formula name="Blade friction torque" formula="τ_f = μ·m·g·r_c" evaluated={`${fmt(s.friction, 3)} × ${s.mass} × 9.81 × ${fmt(s.contactRadius, 3)} = ${fmt(result.frictionTorque, 3)} N·m`} />
            <Formula name="Air drag torque" formula="τ_d = c·ω²,  c = ½ρC_d·Σ w·(r₂⁴ − r₁⁴)/4" note="Grows with the fourth power of how far the limbs reach, which is why open positions slow down quickly." />
            <Formula name="Spin decay" formula="dL/dt = −τ_f − c·ω²" />
            <Formula name="Work done pulling in" formula="W = L²/2 · (1/I_final − 1/I_entry)" evaluated={`W = ${fmt(result.pullInWork, 0)} J`} note="Kinetic energy is not conserved when the skater pulls in – the muscles supply it." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
