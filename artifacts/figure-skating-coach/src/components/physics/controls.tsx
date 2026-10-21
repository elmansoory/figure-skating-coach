import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ParamSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
  hint?: string;
  onChange: (value: number) => void;
}

export function ParamSlider({ id, label, value, min, max, step, unit, digits = 2, hint, onChange }: ParamSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {value.toFixed(digits)}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}

export function Stat({ label, value, sub, className }: StatProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

interface FormulaProps {
  name: string;
  formula: string;
  /** The formula with the current numbers substituted */
  evaluated?: string;
  note?: string;
}

export function Formula({ name, formula, evaluated, note }: FormulaProps) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{name}</div>
      <div className="font-mono text-sm text-foreground" dir="ltr">{formula}</div>
      {evaluated && <div className="font-mono text-xs text-muted-foreground" dir="ltr">{evaluated}</div>}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "–");
