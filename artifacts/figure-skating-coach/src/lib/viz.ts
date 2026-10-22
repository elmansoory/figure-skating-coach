// Chart colours and chrome, resolved from the --viz-* tokens in index.css.
export const VIZ = {
  series: ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"],
  good: "var(--viz-good)",
  critical: "var(--viz-critical)",
  grid: "var(--viz-grid)",
  axis: "var(--viz-axis)",
} as const;

export const axisProps = {
  stroke: VIZ.axis,
  fontSize: 12,
  tickLine: false,
  axisLine: { stroke: VIZ.grid },
} as const;

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--foreground))" },
  itemStyle: { color: "hsl(var(--foreground))" },
} as const;

export const pct = (x: number | null | undefined, digits = 0) =>
  x == null ? "–" : `${(x * 100).toFixed(digits)}%`;
