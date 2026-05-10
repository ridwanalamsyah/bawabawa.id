"use client";

import { useMemo } from "react";

export function MiniAreaChart({
  data,
  width = 600,
  height = 180,
  strokeColor = "hsl(var(--sage-700))",
  fillFrom = "hsl(var(--sage-500) / 0.35)",
  fillTo = "hsl(var(--sage-500) / 0)",
}: {
  data: { day: string; value: number }[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillFrom?: string;
  fillTo?: string;
}) {
  const { path, fillPath, max, min, points, ticks } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    const padX = 32;
    const padY = 18;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const stepX = innerW / Math.max(1, data.length - 1);

    const points = data.map((d, i) => {
      const x = padX + stepX * i;
      const y = padY + innerH - ((d.value - min) / Math.max(1, max - min)) * innerH;
      return { x, y };
    });

    const cmd = points
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
      })
      .join(" ");
    const path = cmd;
    const fillPath =
      cmd +
      ` L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`;

    const ticks = [0, 0.5, 1].map((t) => padY + innerH * (1 - t));
    return { path, fillPath, max, min, points, ticks };
  }, [data, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      {ticks.map((y) => (
        <line key={y} x1={28} y1={y} x2={width - 28} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />
      ))}
      <path d={fillPath} fill="url(#areaFill)" />
      <path d={path} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="hsl(var(--surface))" stroke={strokeColor} strokeWidth="2" />
        </g>
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 4}
          textAnchor="middle"
          className="fill-[hsl(var(--muted-foreground))]"
          style={{ fontSize: 10 }}
        >
          {d.day}
        </text>
      ))}
      <text x={4} y={ticks[0] + 4} className="fill-[hsl(var(--muted-foreground))]" style={{ fontSize: 10 }}>
        {Math.round(max / 1_000_000)}M
      </text>
      <text x={4} y={ticks[2] + 4} className="fill-[hsl(var(--muted-foreground))]" style={{ fontSize: 10 }}>
        {Math.round(min / 1_000_000)}M
      </text>
    </svg>
  );
}

export function MiniDonut({
  data,
  size = 200,
}: {
  data: { name: string; value: number; color?: string }[];
  size?: number;
}) {
  const palette = [
    "hsl(var(--sage-700))",
    "hsl(var(--olive-500))",
    "hsl(var(--emerald-500))",
    "hsl(var(--sage-400))",
    "hsl(var(--sage-300))",
    "hsl(var(--olive-300))",
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  // Pre-compute cumulative sums functionally so we don't reassign during render.
  const cumulative = data.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] ?? 0) + d.value);
    return acc;
  }, []);
  const arcs = data.map((d, i) => {
    const before = i === 0 ? 0 : cumulative[i - 1];
    const start = (before / total) * Math.PI * 2 - Math.PI / 2;
    const end = (cumulative[i] / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    return {
      path,
      color: d.color ?? palette[i % palette.length],
      name: d.name,
      value: d.value,
    };
  });

  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} className="shrink-0" style={{ width: size, height: size }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="20" strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-[hsl(var(--muted-foreground))]" style={{ fontSize: 11 }}>
          Total kategori
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[hsl(var(--foreground))]" style={{ fontSize: 18, fontWeight: 600 }}>
          {total}
        </text>
      </svg>
      <ul className="text-sm space-y-2 flex-1 min-w-0">
        {arcs.map((a, i) => (
          <li key={i} className="flex items-center justify-between gap-2 min-w-0">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
              <span className="truncate">{a.name}</span>
            </span>
            <span className="tabular-nums text-[hsl(var(--muted-foreground))]">{a.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
