import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, TooltipShell, AxisTick } from "@/components/charts/ChartFrame";
import { career } from "@/data/portfolio";
import { humanDuration, monthsBetween } from "@/lib/utils";

/**
 * Role turnover per year: stacked bars that separate time spent as an
 * individual contributor from time spent leading a team.
 * The point is to show trajectory, not just a list of dates.
 */
export function CareerTenureChart() {
  const data = React.useMemo(() => {
    const years = new Map<number, { year: number; ic: number; lead: number; roles: string[] }>();

    career.forEach((role) => {
      const startYear = Number(role.start.slice(0, 4));
      const endYear = role.end ? Number(role.end.slice(0, 4)) : new Date().getFullYear();
      const isLead = role.level !== "IC";

      for (let y = startYear; y <= endYear; y++) {
        const entry = years.get(y) ?? { year: y, ic: 0, lead: 0, roles: [] };
        if (isLead) entry.lead += 1;
        else entry.ic += 1;
        if (!entry.roles.includes(role.title)) entry.roles.push(role.title);
        years.set(y, entry);
      }
    });

    return [...years.values()].sort((a, b) => a.year - b.year);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={22}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          allowDecimals={false}
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
                  { label: "Technical roles", value: `${row.ic} roles`, color: CHART_COLORS.dim },
                  { label: "Leadership roles", value: `${row.lead} roles`, color: CHART_COLORS.rust },
                  { label: "Positions", value: row.roles.join(", ") },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="ic" stackId="a" fill={CHART_COLORS.dim} radius={[3, 3, 0, 0]} name="Technical roles" />
        <Bar dataKey="lead" stackId="a" fill={CHART_COLORS.rust} radius={[3, 3, 0, 0]} name="Leadership roles">
          {data.map((d) => (
            <Cell key={d.year} fillOpacity={d.lead > 0 ? 1 : 0.2} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Scatter map: tenure length versus the size of the team led.
 * The X axis is deliberately tenure, not the year, so the comparison is fair.
 */
export function RoleScopeScatter() {
  const data = career.map((role) => ({
    name: role.title,
    company: role.company,
    months: monthsBetween(role.start, role.end),
    headcount: role.headcount,
    durationLabel: humanDuration(monthsBetween(role.start, role.end)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
        barSize={18}
      >
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
          label={{
            value: "months in role",
            position: "insideBottomRight",
            offset: -2,
            fill: CHART_COLORS.axis,
            fontSize: 10,
            fontFamily: "JetBrains Mono",
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={168}
          tickLine={false}
          axisLine={false}
          tick={<AxisTick />}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={row.name}
                rows={[
                  { label: "Company", value: row.company },
                  { label: "Duration", value: row.durationLabel },
                  {
                    label: "Team",
                    value: row.headcount > 0 ? `${row.headcount} people` : "no direct reports",
                    color: CHART_COLORS.moss,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="months" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.headcount > 0 ? CHART_COLORS.rust : CHART_COLORS.moss} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
