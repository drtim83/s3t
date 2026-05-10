import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useUIStore } from '../../store';
import { useWBSElements } from '../../hooks/useWBS';
import { useEngagementStore } from '../../store/engagementStore';
import { calcResource, calcTotals, formatPercent } from '../../lib/calculations';

const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: '#e5e7eb', fontSize: '11px',
};

const STATUS_PIE_COLORS: Record<string, string> = {
  not_started: '#6b7280',
  in_progress:  '#6366f1',
  blocked:      '#ef4444',
  completed:    '#10b981',
};

export function WBSAnalyticsPage() {
  const { activeProject } = useUIStore();
  const { data } = useWBSElements(activeProject?.id ?? null);
  const { getResources, getRateCard, getConfig, getExpenses } = useEngagementStore();

  const pid = activeProject?.id ?? '';
  const flat = data?.flat ?? [];

  // S3T Financial data
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);
  const expenses = getExpenses(pid);

  const calcResources = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, config, rateCard)),
    [resources, config, rateCard]
  );
  const s3tTotals = useMemo(() => calcTotals(calcResources, expenses), [calcResources, expenses]);
  const marginPct = s3tTotals.revenue > 0 ? s3tTotals.margin / s3tTotals.revenue : 0;

  // WBS: Effort by Level
  const effortByLevel = useMemo(() => {
    const groups: Record<number, number> = {};
    flat.forEach(e => {
      const lvl = e.level ?? 1;
      groups[lvl] = (groups[lvl] ?? 0) + (e.effort_hours ?? 0);
    });
    return Object.entries(groups).map(([lvl, hours]) => ({
      name: `Level ${lvl}`, hours: Math.round(hours),
    }));
  }, [flat]);

  // WBS: Effort by Phase
  const effortByPhase = useMemo(() => {
    const groups: Record<string, number> = {};
    flat.forEach(e => {
      const phase = e.phase ?? 'Unassigned';
      groups[phase] = (groups[phase] ?? 0) + (e.effort_hours ?? 0);
    });
    return Object.entries(groups)
      .map(([name, hours]) => ({ name, hours: Math.round(hours) }))
      .sort((a, b) => b.hours - a.hours);
  }, [flat]);

  // WBS: Status distribution for pie
  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    flat.forEach(e => { counts[e.status] = (counts[e.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: STATUS_PIE_COLORS[status] ?? '#6b7280',
    }));
  }, [flat]);

  // WBS: Elements by completion
  const totalHours = flat.reduce((s, e) => s + (e.effort_hours ?? 0), 0);
  const completedHours = flat.filter(e => e.status === 'completed').reduce((s, e) => s + (e.effort_hours ?? 0), 0);
  const overdue = flat.filter(e => e.end_date && new Date(e.end_date) < new Date() && e.status !== 'completed').length;

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Select a project to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProject.name} · WBS + Financial overview</p>
      </div>

      {/* Combined KPI banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'WBS Elements',   value: flat.length,                                   color: 'text-brand-400' },
          { label: 'Completed',      value: `${flat.filter(e => e.status === 'completed').length}/${flat.length}`, color: 'text-emerald-400' },
          { label: 'Total Effort',   value: `${Math.round(totalHours)}h`,                  color: 'text-cyan-400' },
          { label: 'Overdue Items',  value: overdue,                                        color: overdue > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'TCV (MYR)',      value: `RM ${s3tTotals.revenue > 0 ? (s3tTotals.revenue/1000).toFixed(0) + 'k' : '—'}`, color: 'text-brand-400' },
          { label: 'Net Margin',     value: s3tTotals.revenue > 0 ? formatPercent(marginPct) : '—', color: marginPct >= 0.3 ? 'text-emerald-400' : 'text-amber-400' },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color} tabular-nums`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Effort by Phase */}
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Effort by Phase / Sprint</h3>
          {effortByPhase.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No phase data. Add phases in the WBS Editor.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortByPhase} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" unit="h" fontSize={9} tick={{ fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" fontSize={9} width={80} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v)}h`} />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Effort by Level */}
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Effort by WBS Level</h3>
          {effortByLevel.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No effort data. Set effort hours in the WBS Editor.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortByLevel} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={9} tick={{ fill: '#6b7280' }} unit="h" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v)}h`} />
                  <Bar dataKey="hours" name="Hours" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution Pie */}
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget burn / completion */}
        <div className="glass p-8 flex flex-col justify-center space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Budget & Delivery Health</h3>
          {[
            { label: 'Hours Completed', pct: totalHours > 0 ? completedHours / totalHours : 0, color: 'bg-emerald-500', fmt: `${Math.round(completedHours)}h / ${Math.round(totalHours)}h` },
            { label: 'On-Time Delivery', pct: flat.length > 0 ? (flat.length - overdue) / flat.length : 1, color: overdue > 0 ? 'bg-red-500' : 'bg-emerald-500', fmt: `${flat.length - overdue} / ${flat.length} on track` },
            { label: 'Revenue vs Target', pct: s3tTotals.revenue > 0 ? Math.min(1, marginPct / 0.4) : 0, color: marginPct >= 0.4 ? 'bg-emerald-500' : 'bg-amber-500', fmt: marginPct > 0 ? formatPercent(marginPct) + ' margin' : 'No S3T data' },
          ].map(item => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-white font-bold">{item.fmt}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, item.pct * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
