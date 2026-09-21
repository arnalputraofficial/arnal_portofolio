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
import { useSiteText } from "@/content/ContentProvider";
import { useEntries } from "@/entries/EntriesProvider";
import { chartValue } from "@/entries/chartSeries";
import { humanDuration } from "@/lib/utils";

/**
 * Role turnover per year: stacked bars that separate time spent as an
 * individual contributor from time spent leading a team.
 * The point is to show trajectory, not just a list of dates.
 *
 * The bars come from the "career-tenure" chart, which is the counts worked out
 * from the job history until the panel stores something else. One chained role
 * is one bar in both cases. The positions named in the tooltip are looked up
 * from the job history, so a year the history does not mention simply has none.
 */
export function CareerTenureChart() {
  const t = useSiteText();
  const { career, chartRows } = useEntries();

  const rolesByYear = React.useMemo(() => {
    const map = new Map<number, string[]>();

    career.forEach((role) => {
      const startYear = Number(role.start.slice(0, 4));
      const endYear = role.end ? Number(role.end.slice(0, 4)) : new Date().getFullYear();
      if (!Number.isFinite(startYear)) return;

      for (let year = startYear; year <= endYear; year++) {
        const held = map.get(year) ?? [];
        if (!held.includes(role.title)) held.push(role.title);
        map.set(year, held);
      }
    });

    return map;
  }, [career]);

  const data = React.useMemo(
    () =>
      chartRows("career-tenure")
        .map((row) => {
          const year = Number(row.name);
          return {
            name: row.name,
            year,
            ic: chartValue(row, "ic"),
            lead: chartValue(row, "lead"),
            positions: rolesByYear.get(year) ?? [],
          };
        })
        .sort((a, b) => a.year - b.year),
    [chartRows, rolesByYear],
  );

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
                title={t("career.chart.tenure.yearTitle", { year: String(label) })}
                rows={[
                  {
                    label: t("career.chart.tenure.row.ic"),
                    value: t("career.chart.value.roles", { count: row.ic }),
                    color: CHART_COLORS.dim,
                  },
                  {
                    label: t("career.chart.tenure.row.lead"),
                    value: t("career.chart.value.roles", { count: row.lead }),
                    color: CHART_COLORS.rust,
                  },
                  { label: t("career.chart.tenure.row.positions"), value: row.positions.join(", ") },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="ic"
          stackId="a"
          fill={CHART_COLORS.dim}
          radius={[3, 3, 0, 0]}
          name={t("career.chart.series.ic")}
        />
        <Bar
          dataKey="lead"
          stackId="a"
          fill={CHART_COLORS.rust}
          radius={[3, 3, 0, 0]}
          name={t("career.chart.series.lead")}
        >
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
 *
 * The months come from the "role-scope" chart, worked out from the dates on
 * each role until the panel stores something else. The company, duration in
 * words, and headcount stay attached per role, so a hand set month count
 * changes the bar without erasing what the row is.
 */
export function RoleScopeScatter() {
  const t = useSiteText();
  const { career, chartRows } = useEntries();

  const factsByName = React.useMemo(() => {
    const map = new Map<string, { company: string; headcount: number }>();

    career.forEach((role) => {
      map.set(role.title, { company: role.company, headcount: role.headcount });
    });

    return map;
  }, [career]);

  const data = React.useMemo(
    () =>
      chartRows("role-scope").map((row) => {
        const months = chartValue(row, "months");
        const known = factsByName.get(row.name);

        return {
          name: row.name,
          months,
          company: known?.company ?? "",
          headcount: known?.headcount ?? 0,
          durationLabel: humanDuration(months),
        };
      }),
    [chartRows, factsByName],
  );

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
            value: t("career.chart.scope.axis.months"),
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
                  { label: t("career.chart.scope.row.company"), value: row.company },
                  { label: t("career.chart.scope.row.duration"), value: row.durationLabel },
                  {
                    label: t("career.chart.scope.row.team"),
                    value:
                      row.headcount > 0
                        ? t("career.chart.value.people", { count: row.headcount })
                        : t("career.chart.value.noReports"),
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
