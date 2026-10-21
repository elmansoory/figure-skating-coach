import { useState, type ReactElement, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table2, BarChart3 } from "lucide-react";
import { VIZ } from "@/lib/viz";

interface VizCardProps {
  title: string;
  description?: ReactNode;
  height?: number;
  chart: ReactElement;
  table: ReactNode;
  className?: string;
}

/** A chart with a table-view twin, so no value is reachable only by hovering. */
export function VizCard({ title, description, height = 320, chart, table, className }: VizCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? <BarChart3 className="w-4 h-4 mr-1" /> : <Table2 className="w-4 h-4 mr-1" />}
            {showTable ? "Chart" : "Table"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showTable ? (
          <div className="max-h-[420px] overflow-auto">{table}</div>
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-card">
        <tr className="border-b text-muted-foreground">
          {head.map((h, i) => (
            <th key={h} className={`py-2 pr-3 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={`py-1.5 pr-3 ${j === 0 ? "text-left" : "text-right font-mono tabular-nums"}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Horizontal rate bar with a 95% confidence interval whisker, drawn in plain HTML. */
export function RateRow({ label, rate, ci, n, max = 1 }: { label: string; rate: number | null; ci?: [number, number] | null; n: number; max?: number }) {
  const pctOf = (x: number) => `${Math.min(100, (x / max) * 100)}%`;
  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_3fr_auto] items-center gap-3 py-1.5">
      <div className="text-sm text-foreground">{label}</div>
      <div className="relative h-5" aria-hidden>
        <div className="absolute inset-y-1.5 left-0 right-0 rounded" style={{ background: VIZ.grid }} />
        {rate != null && (
          <div className="absolute inset-y-1 left-0 rounded-r" style={{ width: pctOf(rate), background: VIZ.series[0], borderRadius: "0 4px 4px 0" }} />
        )}
        {ci && (
          <div className="absolute top-0 bottom-0" style={{ left: pctOf(ci[0]), width: `calc(${pctOf(ci[1])} - ${pctOf(ci[0])})` }}>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground" />
            <div className="absolute inset-y-0.5 left-0 w-px bg-foreground" />
            <div className="absolute inset-y-0.5 right-0 w-px bg-foreground" />
          </div>
        )}
      </div>
      <div className="text-right text-sm">
        <span className="font-semibold tabular-nums">{rate == null ? "–" : `${(rate * 100).toFixed(1)}%`}</span>
        <span className="ml-2 text-xs text-muted-foreground tabular-nums">
          {ci ? `[${(ci[0] * 100).toFixed(1)}–${(ci[1] * 100).toFixed(1)}] ` : ""}n={n.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
