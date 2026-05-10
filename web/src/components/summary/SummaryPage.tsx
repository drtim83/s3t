import { useMemo } from 'react';
import { TrendingUp, Users, Briefcase, Calculator } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import {
  calcResource, calcTotals, formatCurrency, formatPM, formatPercent
} from '../../lib/calculations';

function StatCard({ label, value, secondary, icon: Icon, color }: {
  label: string; value: string; secondary: string; icon: any; color: string;
}) {
  const colors: Record<string, string> = {
    blue:    'bg-brand-500/20 text-brand-300 border-brand-500/20',
    green:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
    orange:  'bg-amber-500/20 text-amber-300 border-amber-500/20',
    emerald: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  };
  return (
    <div className="card p-5 flex items-center gap-4 hover:border-brand-500/30 transition-all duration-200 group">
      <div className={`p-3 rounded-xl border ${colors[color]} group-hover:scale-105 transition-transform duration-200`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">{secondary}</p>
      </div>
    </div>
  );
}

export function SummaryPage() {
  const { activeProject } = useUIStore();
  const { getResources, getRateCard, getConfig, getExpenses, secondaryCurrency, forex } = useEngagementStore();

  const pid = activeProject?.id ?? '';
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);
  const expenses = getExpenses(pid);

  const fxEntry = forex.find(f => f.code === secondaryCurrency);
  const fxRate = fxEntry?.rate ?? 1;

  const calcResources = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, config, rateCard)),
    [resources, config, rateCard]
  );

  const totals = useMemo(() => calcTotals(calcResources, expenses), [calcResources, expenses]);
  const marginPct = totals.revenue > 0 ? totals.margin / totals.revenue : 0;

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">P&L Summary</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Select a project to view its P&L summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Profit & Loss Summary</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProject.name} · Auto-calculated from Rate Card × Effort</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`RM ${formatCurrency(totals.revenue)}`} secondary={`${secondaryCurrency} ${formatCurrency(totals.revenue, secondaryCurrency, fxRate)}`} icon={TrendingUp} color="blue" />
        <StatCard label="Total Effort" value={`${formatPM(totals.pm)} PM`} secondary={`${totals.hours.toLocaleString()} Hours`} icon={Users} color="green" />
        <StatCard label="Other Costs" value={`RM ${formatCurrency(totals.expenseCost)}`} secondary="Procurement & Expenses" icon={Briefcase} color="orange" />
        <StatCard label="Net Margin" value={formatPercent(marginPct)} secondary={`RM ${formatCurrency(totals.margin)}`} icon={Calculator} color="emerald" />
      </div>

      {/* Resource Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-600 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Resource & Additional Yield</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Resource / Item</th>
                <th>Code / Category</th>
                <th className="text-center">PM / Qty</th>
                <th className="text-right">Revenue (MYR)</th>
                <th className="text-right">Cost (MYR)</th>
                <th className="text-right text-emerald-400">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {calcResources.map((res, i) => (
                <tr key={i}>
                  <td className="font-semibold text-white">{res.name}</td>
                  <td>
                    <span className="font-mono text-brand-400 text-xs mr-2">{res.code}</span>
                    <span className="text-gray-500 text-xs">{res.title}</span>
                  </td>
                  <td className="text-center tabular-nums">{formatPM(res.totalPM)}</td>
                  <td className="text-right tabular-nums font-medium text-white">{formatCurrency(res.revenue)}</td>
                  <td className="text-right tabular-nums text-gray-400">
                    {formatCurrency(res.costTotal)}
                    {res.extraCost > 0 && (
                      <span className="block text-[10px] text-amber-400">incl. RM{res.extraCost.toLocaleString()} extras</span>
                    )}
                  </td>
                  <td className={`text-right tabular-nums font-bold ${res.marginPct >= 0.4 ? 'text-emerald-400' : res.marginPct >= 0.2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {formatPercent(res.marginPct)}
                  </td>
                </tr>
              ))}
              {expenses.map(exp => (
                <tr key={exp.id} className="bg-amber-500/5">
                  <td className="font-semibold text-amber-300 italic">{exp.description}</td>
                  <td><span className="badge-amber text-[10px] uppercase">{exp.category}</span></td>
                  <td className="text-center text-gray-500">—</td>
                  <td className="text-right tabular-nums text-white">{formatCurrency(exp.sell)}</td>
                  <td className="text-right tabular-nums text-gray-400">{formatCurrency(exp.cost)}</td>
                  <td className="text-right tabular-nums font-bold text-emerald-400">
                    {formatPercent(exp.sell > 0 ? (exp.sell - exp.cost) / exp.sell : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-700 font-bold border-t border-surface-500">
                <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-widest text-gray-500">Combined Totals</td>
                <td className="px-4 py-3 text-right text-white tabular-nums">{formatCurrency(totals.revenue)}</td>
                <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{formatCurrency(totals.cost)}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-black ${marginPct >= 0.3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatPercent(marginPct)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
