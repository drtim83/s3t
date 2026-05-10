import { useMemo, useRef, useState } from 'react';
import type { WBSElement } from '../../lib/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GanttTask {
  id: string;
  code: string;
  name: string;
  level: number;
  start: Date;
  end: Date;
  effort: number;
  status: string;
  phase: string;
}

interface GanttChartProps {
  elements: WBSElement[];
  projectStart?: string | null;
  projectEnd?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#6b7280',
  in_progress:  '#6366f1',
  blocked:      '#ef4444',
  completed:    '#10b981',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Component ────────────────────────────────────────────────────────────────
export function GanttChart({ elements, projectStart, projectEnd }: GanttChartProps) {
  const [tooltip, setTooltip] = useState<{ task: GanttTask; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter elements that have dates
  const tasks: GanttTask[] = useMemo(() => {
    const dated = elements.filter(e => e.start_date && e.end_date);
    if (dated.length === 0) return [];
    return dated.map(e => ({
      id: e.id,
      code: e.wbs_code,
      name: e.name,
      level: e.level ?? 1,
      start: new Date(e.start_date!),
      end: new Date(e.end_date!),
      effort: e.effort_hours ?? 0,
      status: e.status,
      phase: e.phase ?? '—',
    }));
  }, [elements]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: addDays(now, 90), totalDays: 90 };
    }
    const starts = tasks.map(t => t.start);
    const ends   = tasks.map(t => t.end);
    const min = projectStart ? new Date(projectStart) : new Date(Math.min(...starts.map(d => d.getTime())));
    const max = projectEnd   ? new Date(projectEnd)   : new Date(Math.max(...ends.map(d => d.getTime())));
    // Pad a bit
    const padded = addDays(max, 14);
    return { minDate: min, maxDate: padded, totalDays: Math.max(diffDays(min, padded), 30) };
  }, [tasks, projectStart, projectEnd]);

  const ROW_H = 36;
  const LABEL_W = 260;
  const CHART_W = 900;
  const DAY_W = CHART_W / totalDays;
  const HEADER_H = 52;
  const totalH = HEADER_H + tasks.length * ROW_H + 20;

  // Build month tick marks
  const monthTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      const x = diffDays(minDate, cur) * DAY_W;
      ticks.push({ x, label: `${MONTH_LABELS[cur.getMonth()]} ${cur.getFullYear()}` });
      cur.setMonth(cur.getMonth() + 1);
    }
    return ticks;
  }, [minDate, maxDate, DAY_W]);

  const todayX = diffDays(minDate, new Date()) * DAY_W;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
        <p className="text-sm">No WBS elements have start/end dates set.</p>
        <p className="text-xs text-gray-600">Add dates to WBS elements in the WBS Editor to see the Gantt chart.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={LABEL_W + CHART_W + 20}
          height={totalH}
          className="select-none"
        >
          <defs>
            <linearGradient id="barGrad-progress" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width={LABEL_W + CHART_W + 20} height={totalH} fill="#0f0f17" rx="12" />

          {/* Month headers */}
          {monthTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={LABEL_W + tick.x} y1={0}
                x2={LABEL_W + tick.x} y2={totalH}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              />
              <text
                x={LABEL_W + tick.x + 6} y={20}
                fill="#6b7280" fontSize={9} fontWeight="bold"
                textAnchor="start" fontFamily="monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Today line */}
          {todayX >= 0 && todayX <= CHART_W && (
            <g>
              <line
                x1={LABEL_W + todayX} y1={0}
                x2={LABEL_W + todayX} y2={totalH}
                stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3"
              />
              <text x={LABEL_W + todayX + 4} y={34} fill="#f59e0b" fontSize={8} fontWeight="bold">TODAY</text>
            </g>
          )}

          {/* Header divider */}
          <line x1={0} y1={HEADER_H} x2={LABEL_W + CHART_W + 20} y2={HEADER_H} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

          {/* Row labels + bars */}
          {tasks.map((task, i) => {
            const y = HEADER_H + i * ROW_H;
            const barX = Math.max(0, diffDays(minDate, task.start) * DAY_W);
            const barW = Math.max(8, diffDays(task.start, task.end) * DAY_W);
            const barColor = STATUS_COLORS[task.status] ?? '#6b7280';
            const isEven = i % 2 === 0;

            return (
              <g key={task.id}
                onMouseEnter={e => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ task, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Row background */}
                <rect
                  x={0} y={y} width={LABEL_W + CHART_W + 20} height={ROW_H}
                  fill={isEven ? 'rgba(255,255,255,0.015)' : 'transparent'}
                />

                {/* Label */}
                <text
                  x={task.level * 10} y={y + ROW_H / 2 + 4}
                  fill={task.level === 1 ? '#e5e7eb' : '#9ca3af'}
                  fontSize={task.level === 1 ? 11 : 10}
                  fontWeight={task.level === 1 ? 'bold' : 'normal'}
                  fontFamily="Inter, sans-serif"
                >
                  {task.code} {task.name.length > 28 ? task.name.slice(0, 26) + '…' : task.name}
                </text>

                {/* Gantt bar */}
                <rect
                  x={LABEL_W + barX} y={y + 8}
                  width={barW} height={ROW_H - 16}
                  rx={4}
                  fill={task.status === 'in_progress' ? 'url(#barGrad-progress)' : barColor}
                  fillOpacity={task.status === 'completed' ? 0.9 : 0.75}
                />

                {/* % complete label if bar is wide enough */}
                {barW > 40 && task.status === 'in_progress' && (
                  <text
                    x={LABEL_W + barX + 6} y={y + ROW_H / 2 + 4}
                    fill="white" fontSize={8} fontWeight="bold"
                  >
                    In Progress
                  </text>
                )}
                {barW > 50 && task.status === 'completed' && (
                  <text
                    x={LABEL_W + barX + 6} y={y + ROW_H / 2 + 4}
                    fill="white" fontSize={8} fontWeight="bold"
                  >
                    ✓ Done
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-surface-800 border border-surface-600 rounded-xl shadow-xl p-3 text-xs min-w-[180px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-bold text-white mb-1">{tooltip.task.name}</p>
          <div className="space-y-0.5 text-gray-400">
            <p>Code: <span className="text-brand-400 font-mono">{tooltip.task.code}</span></p>
            <p>Phase: {tooltip.task.phase}</p>
            <p>Status: <span className="capitalize">{tooltip.task.status.replace('_', ' ')}</span></p>
            <p>Effort: {tooltip.task.effort > 0 ? `${tooltip.task.effort}h` : '—'}</p>
            <p>Start: {tooltip.task.start.toLocaleDateString()}</p>
            <p>End: {tooltip.task.end.toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-gray-500">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />
            {s.replace('_', ' ')}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-amber-400 inline-block" />Today
        </span>
      </div>
    </div>
  );
}
