import { useState, useMemo } from 'react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { calcResource, calcTotals, formatPercent } from '../../lib/calculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts';

export function AnalyticsPage() {
  const { activeProject } = useUIStore();
  const { getResources, getRateCard, getConfig, getExpenses } = useEngagementStore();
  const [filterCategory, setFilterCategory] = useState('All');

  const pid = activeProject?.id ?? '';
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);
  const expenses = getExpenses(pid);

  const allCalc = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, config, rateCard)),
    [resources, config, rateCard]
  );

  const categories = useMemo(() => {
    const cats = new Set(allCalc.map(r => r.category));
    return ['All', ...Array.from(cats).sort()];
  }, [allCalc]);

  const filtered = useMemo(() =>
    filterCategory === 'All' ? allCalc : allCalc.filter(r => r.category === filterCategory),
    [allCalc, filterCategory]
  );

  const totals = useMemo(() => calcTotals(allCalc, expenses), [allCalc, expenses]);
  const catRevenue = filtered.reduce((s, r) => s + r.revenue, 0);
  const catCost = filtered.reduce((s, r) => s + r.costTotal, 0);
  const catMarginPct = catRevenue > 0 ? (catRevenue - catCost) / catRevenue : 0;

  const barData = filtered.map(r => ({
    name: r.name.length > 16 ? r.name.slice(0, 14) + '…' : r.name,
    Revenue: Math.round(r.revenue),
    Cost: Math.round(r.costTotal),
    Margin: Math.round(r.margin),
    marginPct: parseFloat((r.marginPct * 100).toFixed(1)),
  }));

  const yoyData = useMemo(() => {
    const years = Math.ceil((config.duration_months ?? 12) / 12);
    return Array.from({ length: years }, (_, y) => {
      const frac = 1 - (y / years) * 0.15;
      const rev = catRevenue / years * frac;
      const cost = catCost / years * (frac * 1.08);
      return { year: `Year ${y + 1}`, Revenue: Math.round(rev), Cost: Math.round(cost), Margin: Math.round(rev - cost) };
    });
  }, [catRevenue, catCost, config.duration_months]);

  const TOOLTIP = {
    backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#e5e7eb', fontSize: '12px',
  };

  if (!activeProject) return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <div className="card p-16 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a project to view analytics.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Analytics & Deep Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name}</p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">Filter:</span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterCategory === cat ? 'bg-brand-600 text-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/50'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Yield by Resource</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} fontSize={9} tick={{ fill: '#6b7280' }} />
                <YAxis fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: unknown) => `RM ${Number(v).toLocaleString()}`} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="Cost" fill="#4b5563" radius={[4,4,0,0]} />
                <Bar dataKey="Margin" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Year-over-Year View</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" fontSize={10} tick={{ fill: '#6b7280' }} />
                <YAxis fontSize={9} tick={{ fill: '#6b7280' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Cost" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Margin" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 flex flex-col justify-center space-y-5">
          <div>
            <p className="text-xs text-muted-foreground/80 uppercase tracking-widest font-bold mb-1">Target Category</p>
            <p className="text-3xl font-black text-foreground">{filterCategory}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-muted-foreground/80 uppercase font-bold mb-1">Category Revenue</p>
              <p className="text-xl font-black text-foreground">RM {catRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-muted-foreground/80 uppercase font-bold mb-1">Category Margin</p>
              <p className="text-xl font-black text-emerald-400">{formatPercent(catMarginPct)}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-muted-foreground/80 uppercase font-bold mb-2">Revenue Share</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${totals.revenue > 0 ? Math.round((catRevenue / totals.revenue) * 100) : 0}%` }} />
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {totals.revenue > 0 ? Math.round((catRevenue / totals.revenue) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Margin Efficiency Ranking</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[...barData].sort((a, b) => b.marginPct - a.marginPct)} margin={{ left: 60, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" unit="%" fontSize={9} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" fontSize={9} width={60} tick={{ fill: '#9ca3af' }} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: unknown) => `${Number(v)}%`} />
                <Bar dataKey="marginPct" name="Margin %" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
