import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { calcResource, calcTotals, formatCurrency, formatPercent, formatPM } from '../../lib/calculations';
import { useMemo } from 'react';
import { FileCheck, Info, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';

function ApprovalGate({ title, approver, isApproved, refCode, onToggle, onApproverChange }: {
  title: string; approver: string; isApproved: boolean; refCode: string;
  onToggle: () => void; onApproverChange: (v: string) => void;
}) {
  return (
    <div className={cn(
      'p-5 rounded-2xl border transition-all duration-300',
      isApproved
        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
        : 'bg-white/5 border-white/10'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-0.5 flex-1">
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{title}</p>
          <input
            type="text"
            placeholder="Assign Approver Name"
            className="bg-transparent border-none text-sm font-black text-foreground w-full outline-none placeholder:text-foreground/20"
            value={approver}
            onChange={e => onApproverChange(e.target.value)}
          />
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'w-12 h-7 rounded-full relative transition-all border-2 shrink-0 ml-3',
            isApproved ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 border-white/20'
          )}
        >
          <div className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
            isApproved ? 'right-1' : 'left-1'
          )} />
        </button>
      </div>
      {isApproved ? (
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-[10px] text-emerald-400 font-black flex items-center gap-1.5">
            <FileCheck className="w-3 h-3" /> DIGITALLY SIGNED
          </p>
          <span className="text-[8px] text-foreground/30 font-mono italic">{refCode}</span>
        </div>
      ) : (
        <div className="pt-3 border-t border-white/10">
          <p className="text-[10px] text-foreground/20 italic">Awaiting signature…</p>
        </div>
      )}
    </div>
  );
}

export function ApprovalPage() {
  const { activeProject } = useUIStore();
  const { getResources, getRateCard, getConfig, getExpenses, updateConfig } = useEngagementStore();

  const pid = activeProject?.id ?? '';
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);
  const expenses = getExpenses(pid);

  const calcResources = useMemo(() =>
    resources.filter(r => r.code).map(r => calcResource(r, config, rateCard)),
    [resources, config, rateCard]
  );
  const totals = useMemo(() => calcTotals(calcResources, expenses), [calcResources, expenses]);
  const marginPct = totals.revenue > 0 ? totals.margin / totals.revenue : 0;

  if (!activeProject) return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Approval & Governance</h1>
      <div className="card p-16 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a project first.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Brief & Governance Approval</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Contract Value', value: `RM ${formatCurrency(totals.revenue)}`, color: 'text-brand-400', bg: 'bg-brand-500/10' },
              { label: 'Estimated Margin', value: formatPercent(marginPct), color: marginPct > 0.3 ? 'text-emerald-400' : 'text-amber-400', bg: marginPct > 0.3 ? 'bg-emerald-500/10' : 'bg-amber-500/10' },
              { label: 'Resource Volume', value: `${formatPM(totals.pm)} PM`, color: 'text-foreground', bg: 'bg-white/5' },
              { label: 'Other Costs Total', value: `RM ${formatCurrency(totals.expenseCost)}`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group`}>
                <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest mb-2">{kpi.label}</p>
                <p className={`text-2xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Business Case */}
          <div className="card p-6 space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-foreground/80 uppercase tracking-widest">
                <div className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg"><Info className="w-3.5 h-3.5" /></div>
                Business Case & Painpoints
              </label>
              <textarea
                rows={6}
                className="input resize-none text-sm leading-relaxed"
                placeholder="Detail the customer's current challenges and why this engagement is strategic…"
                value={config.background ?? ''}
                onChange={e => updateConfig(pid, { background: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-foreground/80 uppercase tracking-widest">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"><LayoutDashboard className="w-3.5 h-3.5" /></div>
                Proposed Solution & Strategic Delivery Model
              </label>
              <textarea
                rows={6}
                className="input resize-none text-sm leading-relaxed"
                placeholder="Explain how we solve the problems and the core delivery model…"
                value={config.solution ?? ''}
                onChange={e => updateConfig(pid, { solution: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Approval Gates */}
        <div className="space-y-4">
          <div className="glass p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/3 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Approval Gates</h3>
                <span className="text-[10px] px-2 py-1 bg-brand-500/20 text-brand-400 rounded-full font-bold">V1.0</span>
              </div>
              <div className="space-y-4">
                <ApprovalGate
                  title="Delivery Lead"
                  approver={config.approver1 ?? ''}
                  isApproved={config.is_approved1 ?? false}
                  refCode="REF: AUTH_01X"
                  onToggle={() => updateConfig(pid, { is_approved1: !config.is_approved1 })}
                  onApproverChange={v => updateConfig(pid, { approver1: v })}
                />
                <ApprovalGate
                  title="Commercial Ops"
                  approver={config.approver2 ?? ''}
                  isApproved={config.is_approved2 ?? false}
                  refCode="REF: AUTH_02X"
                  onToggle={() => updateConfig(pid, { is_approved2: !config.is_approved2 })}
                  onApproverChange={v => updateConfig(pid, { approver2: v })}
                />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic text-center">
              Re-approval required if budget varies by &gt;5%. Final TCV and margin are calculated from the combined resource effort and procurement items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
