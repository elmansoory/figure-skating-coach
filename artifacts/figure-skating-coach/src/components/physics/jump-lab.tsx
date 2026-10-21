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
  { label: "Earth", g: 9.81 },
  { label: "Mars", g: 3.71 },
  { label: "Moon", g: 1.62 },
];

const CALL_LABEL: Record<RotationCall, string> = {
  clean: "Fully rotated",
  q: "q – landed on the quarter",
  "<": "< under-rotated",
  "<<": "<< downgraded",
  over: "Over-rotated",
};

type SweepKey = "verticalVelocity" | "takeoffOmega" | "airArm" | "pullInTime" | "gravity";
const SWEEPS: Record<SweepKey, { label: string; unit: string; min: number; max: number }> = {
  verticalVelocity: { label: "Take-off vertical velocity", unit: "m/s", min: 1.5, max: 4.5 },
  takeoffOmega: { label: "Take-off spin", unit: "rev/s", min: 0.8, max: 4 },
  airArm: { label: "Arm extension in the air", unit: "", min: 0, max: 1 },
  pullInTime: { label: "Pull-in time", unit: "s", min: 0.04, max: 0.3 },
  gravity: { label: "Gravity", unit: "m/s²", min: 1.6, max: 15 },
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
          <CardTitle>Jump parameters</CardTitle>
          <CardDescription>Change any input and every result updates instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="jump-type">Jump</Label>
              <Select value={s.jump} onValueChange={chooseJump}>
                <SelectTrigger id="jump-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JUMPS.map((j) => <SelectItem key={j.code} value={j.code}>{j.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gravity-preset">Gravity</Label>
              <Select
                value={GRAVITY_PRESETS.find((p) => p.g === s.gravity)?.label ?? "custom"}
                onValueChange={(v) => { const p = GRAVITY_PRESETS.find((x) => x.label === v); if (p) set("gravity")(p.g); }}
              >
                <SelectTrigger id="gravity-preset"><SelectValue placeholder="Custom" /></SelectTrigger>
                <SelectContent>
                  {GRAVITY_PRESETS.map((p) => <SelectItem key={p.label} value={p.label}>{p.label} ({p.g})</SelectItem>)}
                  <SelectItem value="custom" disabled>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Skater</h3>
            <ParamSlider id="j-mass" label="Body mass" unit="kg" digits={0} min={35} max={90} step={1} value={s.mass} onChange={set("mass")} />
            <ParamSlider id="j-height" label="Height" unit="m" min={1.4} max={1.95} step={0.01} value={s.height} onChange={set("height")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Take-off</h3>
            <ParamSlider id="j-vz" label="Vertical velocity" unit="m/s" min={1.5} max={4.5} step={0.05} value={s.verticalVelocity} onChange={set("verticalVelocity")} hint={`Jump height ${fmt(result.peakHeight)} m`} />
            <ParamSlider id="j-vh" label="Horizontal speed" unit="m/s" min={0} max={8} step={0.1} value={s.horizontalVelocity} onChange={set("horizontalVelocity")} />
            <ParamSlider id="j-w0" label="Take-off spin ω₀" unit="rev/s" min={0.8} max={4} step={0.05} value={s.takeoffOmega} onChange={set("takeoffOmega")} hint={`Needed for a full ${result.required} rev: ${fmt(result.requiredTakeoffOmega)} rev/s`} />
            <ParamSlider id="j-pre" label="Rotation on the ice" unit="rev" min={0} max={0.5} step={0.05} value={s.preRotation} onChange={set("preRotation")} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Air position</h3>
            <ParamSlider id="j-arm" label="Arm extension in the air" min={0} max={1} step={0.05} value={s.airArm} onChange={set("airArm")} hint="0 = arms crossed tight, 1 = arms straight out" />
            <ParamSlider id="j-in" label="Pull-in time" unit="s" min={0.04} max={0.3} step={0.01} value={s.pullInTime} onChange={set("pullInTime")} />
            <ParamSlider id="j-out" label="Open-out before landing" unit="s" min={0} max={0.2} step={0.01} value={s.openOutTime} onChange={set("openOutTime")} />
            <ParamSlider id="j-g" label="Gravity g" unit="m/s²" min={1} max={20} step={0.01} value={s.gravity} onChange={set("gravity")} />
          </div>

          <Button variant="outline" className="w-full" onClick={() => setS(initial)}>Reset</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Rotation on landing" value={`${fmt(result.totalRevolutions)} rev`} sub={<Badge variant={callVariant}>{CALL_LABEL[result.call]}</Badge>} />
          <Stat label="Flight time" value={`${fmt(result.flightTime, 3)} s`} />
          <Stat label="Jump height (centre of mass)" value={`${fmt(result.peakHeight)} m`} />
          <Stat label="Peak rotation speed" value={`${fmt(result.maxOmegaRevPerSec)} rev/s`} sub={`${fmt(result.maxOmegaRevPerSec * 60, 0)} rpm`} />
          <Stat label="Distance" value={`${fmt(result.distance)} m`} sub={`Take-off angle ${fmt(result.takeoffAngleDeg, 0)}°`} />
          <Stat label="Angular momentum L" value={`${fmt(result.angularMomentum, 1)}`} sub="kg·m²/s" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Rotation completed" description={`Revolutions vs time. Needs ${result.required} rev; below ${result.required - 0.25} the jump gets a call.`}>
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(2)} {...axisProps} unit=" s" />
              <YAxis {...axisProps} domain={[0, Math.ceil(result.required + 0.5)]} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} rev`, "Rotation"]} labelFormatter={(t: number) => `t = ${t.toFixed(3)} s`} />
              <ReferenceLine y={result.required} stroke={VIZ.axis} label={{ value: `${result.required} rev`, position: "insideTopLeft", fill: VIZ.axis, fontSize: 11 }} />
              <ReferenceLine y={result.required - 0.25} stroke={VIZ.grid} />
              <Line dataKey="revs" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Rotation speed" description="ω = L / I(t): it rises as the arms pull in and drops as the skater opens out.">
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="t" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(2)} {...axisProps} unit=" s" />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} rev/s`, "ω"]} labelFormatter={(t: number) => `t = ${t.toFixed(3)} s`} />
              <Line dataKey="omega" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Flight path" description="Height of the centre of mass against distance travelled (a parabola under gravity).">
            <LineChart data={path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={VIZ.grid} vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, "dataMax"]} tickFormatter={(v) => v.toFixed(1)} {...axisProps} unit=" m" />
              <YAxis {...axisProps} domain={[0, "auto"]} tickFormatter={(v) => v.toFixed(2)} unit=" m" />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)} m`, "Height"]} labelFormatter={(x: number) => `${x.toFixed(2)} m across`} />
              <Line dataKey="height" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>

          <ChartCard
            title="What-if"
            description="Rotation on landing as one input changes, everything else held fixed."
            action={
              <Select value={sweep} onValueChange={(v) => setSweep(v as SweepKey)}>
                <SelectTrigger className="h-8 w-full" aria-label="Variable to vary"><SelectValue /></SelectTrigger>
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
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} rev`, "Rotation"]} labelFormatter={(x: number) => `${SWEEPS[sweep].label}: ${x.toFixed(2)} ${SWEEPS[sweep].unit}`} />
              <ReferenceLine y={result.required} stroke={VIZ.axis} label={{ value: `${result.required} rev`, position: "insideTopLeft", fill: VIZ.axis, fontSize: 11 }} />
              <ReferenceLine x={s[sweep]} stroke={VIZ.axis} label={{ value: "now", position: "top", fill: VIZ.axis, fontSize: 11 }} />
              <Line dataKey="revs" stroke={VIZ.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equations and current values</CardTitle>
            <CardDescription>
              Body mass and height scale every moment of inertia equally, so for a given take-off spin they don't change the rotation – they change how much angular momentum the take-off must generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Formula name="Flight time" formula="t = 2·v_z / g" evaluated={`t = 2 × ${fmt(s.verticalVelocity)} / ${fmt(s.gravity)} = ${fmt(result.flightTime, 3)} s`} />
            <Formula name="Jump height" formula="h = v_z² / (2g)" evaluated={`h = ${fmt(s.verticalVelocity)}² / (2 × ${fmt(s.gravity)}) = ${fmt(result.peakHeight, 3)} m`} />
            <Formula name="Moment of inertia" formula="I = Σ mᵢ·kᵢ²  (trunk, arms, legs)" evaluated={`I_take-off = ${fmt(result.inertiaTakeoff)}, I_air = ${fmt(result.inertiaAir)}, I_landing = ${fmt(result.inertiaLanding)} kg·m²`} note="Segment masses from Dempster's proportions; limbs modelled as rods." />
            <Formula name="Conservation of angular momentum" formula="L = I₀·ω₀ = I_air·ω_air" evaluated={`${fmt(result.inertiaTakeoff)} × ${fmt(s.takeoffOmega)} rev/s → ω_air = ${fmt(result.maxOmegaRevPerSec)} rev/s`} note="Gravity acts through the centre of mass, so it exerts no torque: L is constant in the air." />
            <Formula name="Rotation" formula="θ = θ_ice + ∫₀ᵗ L / I(t) dt" evaluated={`${fmt(s.preRotation)} + ${fmt(result.airRevolutions)} = ${fmt(result.totalRevolutions)} rev (need ${result.required})`} />
            <Formula name="Rotational energy" formula="E = L² / (2I)" evaluated={`${fmt(result.rotationalEnergyTakeoff, 0)} J → ${fmt(result.rotationalEnergyAir, 0)} J`} note="The extra energy is muscle work done pulling the arms in against the centrifugal effect." />
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
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCard };
