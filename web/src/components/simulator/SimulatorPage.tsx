import { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { calcResource, calcTotals, formatCurrency, formatPercent } from '../../lib/calculations';
import type { ProjectEngagementConfig } from '../../lib/calculations';

function Slider({ label, value, min, max, step, color, onChange }: {
  label: string; value: number; min: number; max: number; step: number; color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-muted-foreground">
        <span className="uppercase tracking-widest">{label}</span>
        <span className="text-foreground">{(value * 100).toFixed(1)}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

export function SimulatorPage() {
  const { activeProject } = useUIStore();
  const { getResources, getRateCard, getConfig, getExpenses } = useEngagementStore();

  const pid = activeProject?.id ?? '';
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);
  const expenses = getExpenses(pid);

  const [simConfig, setSimConfig] = useState<ProjectEngagementConfig>({ ...config });

  const calcBase = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, config, rateCard)),
    [resources, config, rateCard]
  );
  const baseTotals = useMemo(() => calcTotals(calcBase, expenses), [calcBase, expenses]);

  const calcSim = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, simConfig, rateCard)),
    [resources, simConfig, rateCard]
  );
  const simTotals = useMemo(() => calcTotals(calcSim, expenses), [calcSim, expenses]);

  const simMarginPct = simTotals.revenue > 0 ? simTotals.margin / simTotals.revenue : 0;
  const revDelta = simTotals.revenue - baseTotals.revenue;
  const margDelta = simMarginPct - (baseTotals.revenue > 0 ? baseTotals.margin / baseTotals.revenue : 0);

  if (!activeProject) return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Simulator</h1>
      <div className="card p-16 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a project to run the simulator.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Engagement Simulator & Impact Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name} · Adjust variables to see P&L impact</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adjust Variables</h3>
            <div className="space-y-6">
              <Slider label="Global Discount" value={simConfig.global_discount ?? 0} min={0} max={0.5} step={0.005}
                color="#6366f1" onChange={v => setSimConfig(s => ({ ...s, global_discount: v }))} />
              <Slider label="Global Allowance" value={simConfig.global_allowance ?? 0} min={0} max={0.5} step={0.005}
                color="#10b981" onChange={v => setSimConfig(s => ({ ...s, global_allowance: v }))} />
              <Slider label="Risk Reserve" value={simConfig.risk_reserve ?? 0} min={0} max={0.3} step={0.005}
                color="#f59e0b" onChange={v => setSimConfig(s => ({ ...s, risk_reserve: v }))} />
            </div>
            <button onClick={() => setSimConfig({ ...config })}
              className="btn-ghost btn-sm w-full flex items-center justify-center gap-2 border border-border">
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
            </button>
          </div>

          <div className="glass p-5 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Simulation Tip</p>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "Lowering the global discount by 2% can significantly impact TCV. Use risk reserve to see how contingency affects the net margin buffer."
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Simulated Revenue</p>
              <p className="text-4xl font-black text-brand-400 tracking-tighter tabular-nums">
                RM {formatCurrency(simTotals.revenue)}
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground/80">Delta from actual</span>
                <span className={`font-bold tabular-nums ${revDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {revDelta >= 0 ? '+' : ''}RM {formatCurrency(Math.abs(revDelta))}
                </span>
              </div>
            </div>

            <div className="card p-6 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Simulated Margin</p>
              <p className={`text-4xl font-black tracking-tighter tabular-nums ${simMarginPct >= 0.3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatPercent(simMarginPct)}
              </p>
              <div className="pt-2 border-t border-border">
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${simMarginPct >= 0.3 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, simMarginPct * 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 font-bold ${margDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {margDelta >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(margDelta))} vs actual
                </p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resource Impact</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th className="text-right">Sim. Revenue</th>
                    <th className="text-right">Sim. Margin</th>
                    <th className="text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {calcSim.map((res, i) => (
                    <tr key={i}>
                      <td className="text-foreground font-medium">{res.name}</td>
                      <td className="text-right tabular-nums">{formatCurrency(res.revenue)}</td>
                      <td className="text-right tabular-nums text-foreground">{formatCurrency(res.margin)}</td>
                      <td className={`text-right tabular-nums font-bold ${res.marginPct >= 0.4 ? 'text-emerald-400' : res.marginPct >= 0.2 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPercent(res.marginPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
