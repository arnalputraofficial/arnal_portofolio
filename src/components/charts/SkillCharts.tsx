import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, TooltipShell } from "@/components/charts/ChartFrame";
import { useSiteText } from "@/content/ContentProvider";
import { useEntries } from "@/entries/EntriesProvider";
import type { Skill } from "@/data/portfolio";

/** Levels are a 1 to 10 self rating, where 10 is the strongest. */
const SKILL_SCALE_MAX = 10;

/**
 * Competency balance radar.
 * Self-rating is compared against the number of project evidence items,
 * so the areas backed by real proof, and the thin ones, both show up.
 *
 * Levels are a 1 to 10 self rating while evidence is a 0 to 100 count, so the
 * rating is drawn as its share of the scale. That keeps one axis for both
 * series; the labels still speak in tenths.
 */
export function SkillBalanceRadar({ data }: { data: Skill[] }) {
  const t = useSiteText();
  const grouped = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number; evidence: number }>();
    data.forEach((s) => {
      const cur = map.get(s.category) ?? { total: 0, count: 0, evidence: 0 };
      cur.total += s.level;
      cur.count += 1;
      cur.evidence += s.evidence.length;
      map.set(s.category, cur);
    });
    return [...map.entries()].map(([category, v]) => {
      const level = v.total / v.count;
      return {
        category,
        level: Math.round((level / SKILL_SCALE_MAX) * 100),
        /** The same rating on the 1 to 10 scale, for the tooltip. */
        levelOf10: Math.round(level * 10) / 10,
        // evidence normalized to a 0-100 scale so both series share one chart
        evidence: Math.min(100, Math.round((v.evidence / 9) * 100)),
      };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={grouped} outerRadius="72%">
        <PolarGrid stroke={CHART_COLORS.grid} strokeDasharray="2 3" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={false}
          axisLine={false}
          tickCount={5}
        />
        <Radar
          name={t("skills.chart.radar.series.rating")}
          dataKey="level"
          stroke={CHART_COLORS.rust}
          fill={CHART_COLORS.rust}
          fillOpacity={0.22}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.rust, strokeWidth: 0 }}
        />
        <Radar
          name={t("skills.chart.radar.series.evidence")}
          dataKey="evidence"
          stroke={CHART_COLORS.moss}
          fill={CHART_COLORS.moss}
          fillOpacity={0.14}
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 2.5, fill: CHART_COLORS.moss, strokeWidth: 0 }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as { levelOf10: number };
            return (
              <TooltipShell
                title={label as string}
                rows={payload.map((p) => ({
                  label: p.name as string,
                  value:
                    p.dataKey === "level"
                      ? t("skills.chart.value.score", { value: String(row.levelOf10) })
                      : t("skills.chart.value.percent", { value: String(p.value) }),
                  color: p.stroke as string,
                }))}
              />
            );
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** The ten skills with the highest self rating. */
export function TopSkillsBar({ data, limit = 10 }: { data: Skill[]; limit?: number }) {
  const t = useSiteText();
  const top = React.useMemo(
    () => [...data].sort((a, b) => b.level - a.level).slice(0, limit),
    [data, limit],
  );

  return (
    <ResponsiveContainer width="100%" height={top.length * 34 + 20}>
      <BarChart layout="vertical" data={top} margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barSize={14}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, SKILL_SCALE_MAX]}
          ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tickLine={false}
          axisLine={false}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as Skill;
            return (
              <TooltipShell
                title={row.name}
                rows={[
                  {
                    label: t("skills.chart.top.row.level"),
                    value: t("skills.chart.value.score", { value: row.level }),
                    color: CHART_COLORS.rust,
                  },
                  {
                    label: t("skills.chart.top.row.experience"),
                    value: t("skills.chart.value.years", { count: row.years }),
                  },
                  { label: t("skills.chart.top.row.since"), value: String(row.since) },
                  {
                    label: t("skills.chart.top.row.evidence"),
                    value: t("skills.chart.value.items", { count: row.evidence.length }),
                    color: CHART_COLORS.moss,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="level" radius={[0, 3, 3, 0]}>
          {top.map((s) => (
            <Cell
              key={s.id}
              fill={s.level >= 8 ? CHART_COLORS.rustDeep : s.level >= 5 ? CHART_COLORS.rust : CHART_COLORS.moss}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Skills against projects: which tools each kind of project actually needs.
 * Helps show where a technology is genuinely used, not just mentioned.
 */
export function StackUsageChart() {
  const t = useSiteText();
  const { projects } = useEntries();

  const data = React.useMemo(() => {
    const counts = new Map<string, { stack: string; count: number; newness: number }>();
    projects.forEach((p) => {
      p.stack.forEach((s) => {
        const cur = counts.get(s) ?? { stack: s, count: 0, newness: 0 };
        cur.count += 1;
        counts.set(s, cur);
      });
    });
    return [...counts.values()]
      .filter((d) => d.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [projects]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 42 }} barSize={20}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="stack"
          angle={-38}
          textAnchor="end"
          interval={0}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: "JetBrains Mono" }}
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
            return (
              <TooltipShell
                title={label as string}
                rows={[
                  {
                    label: t("skills.chart.stack.row.usedIn"),
                    value: t("skills.chart.stack.value.projects", { count: String(payload[0].value ?? 0) }),
                    color: CHART_COLORS.rust,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={d.stack}
              fill={i === 0 ? CHART_COLORS.rustDeep : i < 4 ? CHART_COLORS.rust : CHART_COLORS.dim}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Distribution of years of experience per skill category. */
export function ExperienceSpreadChart() {
  const t = useSiteText();
  const { skills } = useEntries();

  const data = React.useMemo(() => {
    const map = new Map<string, { category: string; years: number; count: number }>();
    skills.forEach((s) => {
      const cur = map.get(s.category) ?? { category: s.category, years: 0, count: 0 };
      cur.years = Math.max(cur.years, s.years);
      cur.count += 1;
      map.set(s.category, cur);
    });
    return [...map.values()].sort((a, b) => b.years - a.years);
  }, [skills]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }} barSize={26}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: "JetBrains Mono" }}
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
                title={label as string}
                rows={[
                  {
                    label: t("skills.chart.spread.row.longest"),
                    value: t("skills.chart.value.years", { count: row.years }),
                    color: CHART_COLORS.rust,
                  },
                  {
                    label: t("skills.chart.spread.row.count"),
                    value: t("skills.chart.value.items", { count: row.count }),
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="years" radius={[3, 3, 0, 0]} fill={CHART_COLORS.moss} />
      </BarChart>
    </ResponsiveContainer>
  );
}
