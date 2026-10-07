import {
  BarChart3, Clock, CheckCircle2, AlertCircle, TrendingUp,
  Users, FolderKanban, Milestone, DollarSign, Percent, Zap,
} from 'lucide-react';
import { useUIStore } from '../../store';
import { useMyProjects } from '../../hooks/useProjects';
import { useWBSElements } from '../../hooks/useWBS';
import { useEngagementStore } from '../../store/engagementStore';
import { Skeleton } from '../ui/Spinner';
import { formatDate, formatHours } from '../../lib/utils';
import { calcResource, calcTotals, formatCurrency, formatPercent } from '../../lib/calculations';
import { useMemo } from 'react';
import type { WBSStatus } from '../../lib/database.types';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon, label, value, sub, color = 'brand', onClick }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    brand:   'bg-brand-500/20 text-brand-400',
    cyan:    'bg-cyan-500/20 text-cyan-400',
    green:   'bg-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/20 text-amber-400',
    red:     'bg-red-500/20 text-red-400',
    purple:  'bg-purple-500/20 text-purple-400',
  };
  return (
    <div
      onClick={onClick}
      className={`card-hover p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:border-brand-500/30' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
        <p className="text-2xl font-black text-foreground mt-0.5 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground/80 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { activeProject } = useUIStore();
  const { data, isLoading } = useWBSElements(activeProject?.id ?? null);
  const { getResources, getRateCard, getConfig, getExpenses } = useEngagementStore();
  const navigate = useNavigate();

  const pid = activeProject?.id ?? '';
  const flat = data?.flat ?? [];

  // WBS metrics
  const byStatus = flat.reduce<Record<WBSStatus, number>>(
    (acc, el) => { acc[el.status] = (acc[el.status] ?? 0) + 1; return acc; },
    {} as Record<WBSStatus, number>
  );
  const totalHours = flat.reduce((s, el) => s + (el.effort_hours ?? 0), 0);
  const completedHours = flat.filter(e => e.status === 'completed').reduce((s, e) => s + (e.effort_hours ?? 0), 0);
  const completionPct = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;
  const overdue = flat.filter(e => e.end_date && new Date(e.end_date) < new Date() && e.status !== 'completed').length;

  // S3T financial metrics
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

  const { data: allProjects = [] } = useMyProjects();
  const templates = allProjects.filter(p => p.is_template);

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to S3T</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a project or start from a template.</p>
        </div>

        {templates.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-4">Your Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <div key={t.id} className="card p-5 space-y-3 cursor-pointer hover:border-brand-500/30 transition-colors" onClick={() => useUIStore.getState().setActiveProject(t)}>
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-brand-400" />
                    </div>
                    <span className="badge badge-gray text-[10px]">Template</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.name.replace(' (Template)', '')}</h4>
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">{t.description || 'No description provided.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {templates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-muted-foreground/80" />
            </div>
            <div>
              <p className="text-foreground font-semibold">No project selected</p>
              <p className="text-muted-foreground/80 text-sm mt-1">Select a project from the sidebar to view its dashboard</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{activeProject.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeProject.description ?? 'No description'} ·{' '}
            {activeProject.start_date ? `${formatDate(activeProject.start_date)} → ${formatDate(activeProject.end_date)}` : 'No dates set'}
          </p>
        </div>
        <span className={`badge ${activeProject.status === 'active' ? 'badge-green' : 'badge-gray'} capitalize`}>
          {activeProject.status}
        </span>
      </div>

      {/* WBS KPIs */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">WBS & Delivery</p>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3 className="w-5 h-5" />}  label="WBS Elements"  value={flat.length}             color="brand" onClick={() => navigate('/wbs')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed"   value={byStatus.completed ?? 0}   sub={`of ${flat.length}`} color="green" />
            <StatCard icon={<Clock className="w-5 h-5" />}      label="Total Effort"  value={formatHours(totalHours)}  sub={`${completionPct}% done`} color="cyan" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Overdue"      value={overdue}                  sub="past end date" color={overdue > 0 ? 'red' : 'green'} />
          </div>
        )}
      </div>

      {/* S3T Financial KPIs */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">S3T Financial Summary</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign className="w-5 h-5" />}  label="Total Rev (MYR)"   value={s3tTotals.revenue > 0 ? `RM ${formatCurrency(s3tTotals.revenue)}` : '—'} color="brand" onClick={() => navigate('/summary')} />
          <StatCard icon={<Percent className="w-5 h-5" />}      label="Net Margin"         value={s3tTotals.revenue > 0 ? formatPercent(marginPct) : '—'} color={marginPct >= 0.3 ? 'green' : 'amber'} />
          <StatCard icon={<Users className="w-5 h-5" />}        label="Resources"           value={resources.filter(r => r.code).length} sub={`${s3tTotals.pm.toFixed(1)} PM total`} color="purple" onClick={() => navigate('/effort')} />
          <StatCard icon={<Zap className="w-5 h-5" />}          label="Other Costs"          value={s3tTotals.expenseCost > 0 ? `RM ${formatCurrency(s3tTotals.expenseCost)}` : '—'} color="amber" onClick={() => navigate('/procurement')} />
        </div>
      </div>

      {/* Progress + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion progress */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-foreground">Overall Completion</h3>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{formatHours(completedHours)} completed</span>
              <span className="text-foreground font-semibold">{completionPct}%</span>
            </div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground/80 mt-2">{formatHours(totalHours - completedHours)} remaining</p>
          </div>
          {s3tTotals.revenue > 0 && (
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Margin health</span>
                <span className={`font-semibold ${marginPct >= 0.3 ? 'text-emerald-400' : 'text-amber-400'}`}>{formatPercent(marginPct)}</span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${marginPct >= 0.3 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, marginPct * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Milestone className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-foreground">Status Breakdown</h3>
          </div>
          <div className="space-y-2.5">
            {([
              ['not_started', 'Not Started', 'bg-gray-500'],
              ['in_progress', 'In Progress', 'bg-brand-500'],
              ['blocked',     'Blocked',     'bg-red-500'],
              ['completed',   'Completed',   'bg-emerald-500'],
            ] as [WBSStatus, string, string][]).map(([s, label, color]) => {
              const count = byStatus[s] ?? 0;
              const pct = flat.length > 0 ? Math.round((count / flat.length) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-foreground/80 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent WBS elements */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
          <button onClick={() => navigate('/wbs')} className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
            View all →
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : flat.length === 0 ? (
          <p className="text-muted-foreground/80 text-sm">No WBS elements yet. Go to the WBS Editor to add some.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th>Code</th><th>Name</th><th>Status</th><th>Effort</th><th>Due</th>
              </tr></thead>
              <tbody>
                {flat.slice(0, 8).map(el => (
                  <tr key={el.id}>
                    <td><code className="text-brand-400 text-xs">{el.wbs_code}</code></td>
                    <td className="text-foreground font-medium">{el.name}</td>
                    <td><span className={`badge text-xs ${el.status === 'completed' ? 'badge-green' : el.status === 'blocked' ? 'badge-red' : el.status === 'in_progress' ? 'badge-brand' : 'badge-gray'}`}>{el.status.replace('_', ' ')}</span></td>
                    <td>{formatHours(el.effort_hours)}</td>
                    <td>{formatDate(el.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
