import * as React from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ComposedChart,
  Bar,
  Line,
} from "recharts";
import { CHART_COLORS, TooltipShell } from "@/components/charts/ChartFrame";
import { useEntries } from "@/entries/EntriesProvider";
import type { Project, ProjectKind } from "@/data/portfolio";
import { nf } from "@/lib/utils";

const KINDS: ProjectKind[] = [
  "Infrastructure",
  "Internal Systems",
  "Integration",
  "Security",
  "Data & Monitoring",
  "ERP Rollout",
];

const KIND_COLOR: Record<ProjectKind, string> = {
  Infrastructure: CHART_COLORS.rust,
  "Internal Systems": CHART_COLORS.moss,
  Integration: "#c9a227",
  Security: "#8b5cf6",
  "Data & Monitoring": "#2f9e8f",
  "ERP Rollout": "#a9714b",
};

/**
 * Project map: X axis is time, Y axis is the kind of work.
 * Bubble size is the impact score, so the highest-leverage projects
 * stand out immediately without reading the table.
 */
export function ProjectMap({ projects }: { projects: Project[] }) {
  const data = React.useMemo(
    () =>
      projects.map((p) => ({
        x: p.year + (p.months % 12) / 12,
        y: KINDS.indexOf(p.kind),
        z: p.impact,
        ...p,
      })),
    [projects],
  );

  return (
    <ResponsiveContainer width="100%" height={330}>
      <ScatterChart margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="x"
          name="Year"
          domain={[2017.5, 2025.5]}
          tickCount={9}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickFormatter={(v: number) => String(Math.floor(v))}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          type="category"
          dataKey="y"
          domain={[-0.5, KINDS.length - 0.5]}
          tickLine={false}
          axisLine={false}
          width={132}
          tickFormatter={(v: number) => KINDS[v] ?? ""}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: "JetBrains Mono" }}
        />
        <ZAxis type="number" dataKey="z" range={[60, 340]} />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.rust, strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={row.name}
                rows={[
                  { label: "Role", value: row.role },
                  { label: "Status", value: row.status, color: KIND_COLOR[row.kind] },
                  { label: "Impact", value: `${row.impact}/100`, color: CHART_COLORS.rust },
                  { label: "Budget", value: row.budgetM ? `Rp ${nf(row.budgetM)}m` : "internal" },
                  { label: "Duration", value: `${row.months} months` },
                ]}
              />
            );
          }}
        />
        <Scatter data={data} shape="circle">
          {data.map((d) => (
            <Cell
              key={d.id}
              fill={KIND_COLOR[d.kind]}
              fillOpacity={d.status === "on-hold" ? 0.28 : 0.62}
              stroke={KIND_COLOR[d.kind]}
              strokeWidth={d.featured ? 2 : 1}
              strokeOpacity={0.9}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/**
 * Budget against impact per year.
 * Bars are total budget, the line is the average impact score.
 * Shows whether a rise in spending actually produced results.
 */
export function BudgetImpactChart() {
  const { projects } = useEntries();

  const data = React.useMemo(() => {
    const map = new Map<number, { year: number; budget: number; impact: number[]; count: number }>();
    projects.forEach((p) => {
      const cur = map.get(p.year) ?? { year: p.year, budget: 0, impact: [], count: 0 };
      cur.budget += p.budgetM;
      cur.impact.push(p.impact);
      cur.count += 1;
      map.set(p.year, cur);
    });
    return [...map.values()]
      .sort((a, b) => a.year - b.year)
      .map((d) => ({
        year: d.year,
        budget: d.budget,
        avgImpact: Math.round(d.impact.reduce((a, b) => a + b, 0) / d.impact.length),
        count: d.count,
      }));
  }, [projects]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${nf(v / 1000, 1)}B`}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={`Year ${label}`}
                rows={[
                  { label: "Total budget", value: `Rp ${nf(row.budget)}m`, color: CHART_COLORS.dim },
                  { label: "Average impact", value: `${row.avgImpact}/100`, color: CHART_COLORS.rust },
                  { label: "Project count", value: `${row.count}` },
                ]}
              />
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="budget"
          fill={CHART_COLORS.dim}
          fillOpacity={0.55}
          radius={[3, 3, 0, 0]}
          barSize={30}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgImpact"
          stroke={CHART_COLORS.rust}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.rust, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Budget against impact spread, bubbles sized by team. */
export function BudgetImpactScatter() {
  const { projects } = useEntries();

  const data = React.useMemo(
    () =>
      projects
        .filter((p) => p.budgetM > 0)
        .map((p) => ({
          x: p.budgetM,
          y: p.impact,
          z: p.teamSize,
          ...p,
        })),
    [projects],
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 12, right: 18, left: -6, bottom: 6 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="x"
          name="Budget (IDR millions)"
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickFormatter={(v: number) => `${nf(v)}m`}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Impact score"
          domain={[50, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <ZAxis type="number" dataKey="z" range={[70, 400]} />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.rust, strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={row.name}
                rows={[
                  { label: "Budget", value: `$${nf(row.budgetM)}k`, color: CHART_COLORS.dim },
                  { label: "Impact", value: `${row.impact}/100`, color: CHART_COLORS.rust },
                  { label: "Team size", value: `${row.teamSize} people`, color: CHART_COLORS.moss },
                ]}
              />
            );
          }}
        />
        <Scatter data={data} fill={CHART_COLORS.moss} fillOpacity={0.5} stroke={CHART_COLORS.moss} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export { KIND_COLOR, KINDS };
