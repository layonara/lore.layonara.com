"use client";

// XP timeline chart. ag-charts is canvas-based and a hard client-only
// component, so this is the second JS island on the detail page (after
// the search box on the list page).
//
// ag-charts v13 made modules opt-in: nothing renders unless we explicitly
// register the chart type, series, and axes we use. We do it once at module
// scope so the registration happens before <AgCharts> ever mounts.

// ag-charts-community v13 ships its styles inline via the JS bundle;
// no separate CSS import is needed (and there is no styles/ subpath).
import { AgCharts } from "ag-charts-react";
import {
  AreaSeriesModule,
  CartesianChartModule,
  ModuleRegistry,
  NumberAxisModule,
  TimeAxisModule,
  type AgCartesianChartOptions,
} from "ag-charts-community";
import { useMemo } from "react";

// Module registration is global + idempotent — the registry de-dupes — so
// running it on every import is safe and just no-ops after the first call.
ModuleRegistry.registerModules([
  CartesianChartModule,
  AreaSeriesModule,
  TimeAxisModule,
  NumberAxisModule,
]);

interface XpChartProps {
  samples: Array<{ t: number; xp: number }>;
}

export function XpChart({ samples }: XpChartProps) {
  // Memoize the options object — ag-charts redraws on identity change.
  const options = useMemo<AgCartesianChartOptions>(() => {
    const data = samples.map((s) => ({ date: new Date(s.t * 1000), xp: s.xp }));
    return {
      data,
      background: { fill: "transparent" },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      series: [
        {
          type: "area",
          xKey: "date",
          yKey: "xp",
          yName: "Experience",
          fillOpacity: 0.18,
          stroke: "var(--forge-accent)",
          fill: "var(--forge-accent)",
          strokeWidth: 1.5,
          marker: { enabled: false },
          tooltip: {
            renderer: ({ datum }) => ({
              content: `${(datum.xp as number).toLocaleString()} XP`,
              title: (datum.date as Date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
            }),
          },
        },
      ],
      // ag-charts v13 expects axes as a record keyed by direction (x/y)
      // rather than the v12 array form. Same content, different shape.
      axes: {
        x: {
          type: "time",
          position: "bottom",
          label: {
            color: "var(--forge-text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
          },
          line: { stroke: "var(--forge-border)" },
          tick: { stroke: "var(--forge-border)" },
        },
        y: {
          type: "number",
          position: "left",
          label: {
            color: "var(--forge-text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            formatter: ({ value }) => {
              const v = value as number;
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
              return String(v);
            },
          },
          line: { stroke: "var(--forge-border)" },
          tick: { stroke: "var(--forge-border)" },
          gridLine: {
            style: [{ stroke: "var(--forge-border)", lineDash: [3, 3] }],
          },
        },
      },
      legend: { enabled: false },
    };
  }, [samples]);

  if (samples.length < 2) {
    return (
      <p className="text-sm text-forge-text-secondary">
        Not enough XP samples to draw a timeline yet.
      </p>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <AgCharts options={options} />
    </div>
  );
}
