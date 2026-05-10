import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import type { EngagementResource } from '../../lib/calculations';
import { getMonthLabel, formatPM } from '../../lib/calculations';
import { useState } from 'react';

const DISPLAY_MONTH_OPTIONS = [12, 24, 36, 48, 60];

export function EffortPage() {
  const { activeProject } = useUIStore();
  const { getResources, setResources, getRateCard, getConfig } = useEngagementStore();
  const [numMonths, setNumMonths] = useState(24);

  const pid = activeProject?.id ?? '';
  const resources = getResources(pid);
  const rateCard = getRateCard(pid);
  const config = getConfig(pid);

  const updateResource = (idx: number, updates: Partial<EngagementResource>) => {
    const next = [...resources];
    next[idx] = { ...next[idx], ...updates };
    setResources(pid, next);
  };

  const updateEffort = (resIdx: number, mIdx: number, val: string) => {
    const next = [...resources];
    next[resIdx] = {
      ...next[resIdx],
      effort: next[resIdx].effort.map((v, i) => i === mIdx ? (val === '' ? null : parseFloat(val)) : v),
    };
    setResources(pid, next);
  };

  const addResource = () => {
    setResources(pid, [...resources, {
      id: Date.now().toString(),
      project_id: pid,
      name: '',
      code: '',
      effort: new Array(60).fill(null),
    }]);
  };

  const deleteResource = (idx: number) => {
    setResources(pid, resources.filter((_, i) => i !== idx));
  };

  const monthTotals = useMemo(() =>
    Array.from({ length: numMonths }, (_, i) =>
      resources.reduce((s, r) => s + ((r.effort[i] as number | null) ?? 0), 0)
    ), [resources, numMonths]);

  const grandTotal = resources.reduce((s, r) =>
    s + (r.effort as (number | null)[]).reduce((ss: number, v) => ss + (v ?? 0), 0), 0
  );

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Effort Planning</h1>
        <div className="card p-16 flex flex-col items-center justify-center text-center gap-4">
          <p className="text-gray-400 text-sm">Select a project to manage resource allocation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resource Allocation & Effort Plan</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeProject.name} · Person-Months</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Display:</span>
            <select
              value={numMonths}
              onChange={e => setNumMonths(parseInt(e.target.value))}
              className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand-500"
            >
              {DISPLAY_MONTH_OPTIONS.map(v => <option key={v} value={v}>{v}M</option>)}
            </select>
          </div>
          <button onClick={addResource} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-xs border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-30">
              <tr className="bg-surface-800 border-b border-surface-600 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="px-3 py-3 text-center font-bold border-r border-surface-600 sticky left-0 z-40 bg-surface-800 w-8">#</th>
                <th className="px-3 py-3 text-left font-bold border-r border-surface-600 sticky left-8 z-40 bg-surface-800 min-w-[180px]">Resource Name</th>
                <th className="px-3 py-3 text-left font-bold border-r border-surface-600 sticky left-[220px] z-40 bg-surface-800 min-w-[160px]">Job Code</th>
                <th className="px-2 py-3 text-center font-bold border-r border-surface-600 min-w-[60px]">Per Diem</th>
                <th className="px-2 py-3 text-center font-bold border-r border-surface-600 min-w-[60px]">Travel</th>
                <th className="px-2 py-3 text-center font-bold border-r border-surface-600 min-w-[60px]">Stay</th>
                <th className="px-2 py-3 text-center font-bold border-r border-surface-600 min-w-[60px]">COLA</th>
                {Array.from({ length: numMonths }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-center font-bold border-r border-surface-600 min-w-[60px] whitespace-nowrap">
                    {getMonthLabel(config.start_date ?? '', i)}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-bold bg-emerald-900/30 text-emerald-300 sticky right-0 z-40 min-w-[70px]">PM Total</th>
              </tr>
            </thead>

            <tbody>
              {resources.map((res, idx) => {
                const totalPM = (res.effort as (number | null)[]).reduce((s: number, v) => s + (v ?? 0), 0);
                return (
                  <tr key={res.id ?? idx} className="border-b border-surface-700 hover:bg-surface-750 group transition-colors">
                    <td className="px-3 py-2 text-center text-gray-500 sticky left-0 z-20 bg-surface-800 group-hover:bg-surface-750 border-r border-surface-600">
                      <button onClick={() => deleteResource(idx)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-3 py-2 sticky left-8 z-20 bg-surface-800 group-hover:bg-surface-750 border-r border-surface-600">
                      <input
                        className="bg-transparent outline-none text-gray-200 w-full placeholder-gray-600 focus:text-white"
                        placeholder="Resource name…"
                        value={res.name}
                        onChange={e => updateResource(idx, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 sticky left-[220px] z-20 bg-surface-800 group-hover:bg-surface-750 border-r border-surface-600">
                      <select
                        className="bg-transparent outline-none text-brand-400 font-mono w-full cursor-pointer"
                        value={res.code}
                        onChange={e => updateResource(idx, { code: e.target.value })}
                      >
                        <option value="">— select —</option>
                        {rateCard.map(rc => (
                          <option key={rc.code} value={rc.code}>{rc.code} — {rc.title}</option>
                        ))}
                      </select>
                    </td>
                    {(['per_diem', 'travel', 'stay', 'cola'] as const).map(field => (
                      <td key={field} className="px-1 py-2 border-r border-surface-700 bg-surface-800/50 group-hover:bg-surface-750">
                        <input
                          type="number"
                          step="100"
                          className="w-full bg-transparent text-center outline-none text-gray-400 focus:text-white tabular-nums"
                          value={res[field] ?? ''}
                          placeholder="0"
                          onChange={e => updateResource(idx, { [field]: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                    ))}
                    {Array.from({ length: numMonths }, (_, i) => {
                      const val = res.effort[i];
                      const isOver = (val ?? 0) > 1;
                      return (
                        <td key={i} className="px-1 py-2 border-r border-surface-700">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            className={`w-full bg-transparent text-center outline-none tabular-nums transition-colors
                              ${isOver ? 'text-red-400 font-bold' : 'text-gray-300'}
                              focus:bg-brand-500/10 rounded`}
                            value={val === null ? '' : val}
                            onChange={e => updateEffort(idx, i, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-emerald-300 tabular-nums sticky right-0 bg-emerald-900/20 border-l border-emerald-800/30">
                      {formatPM(totalPM as number)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer totals */}
            <tfoot className="sticky bottom-0 z-30">
              <tr className="bg-surface-700 border-t border-surface-500 text-gray-300 font-bold">
                <td colSpan={7} className="px-4 py-2.5 text-right text-[10px] uppercase tracking-widest text-gray-500 sticky left-0 bg-surface-700">Month Totals</td>
                {monthTotals.map((total, i) => (
                  <td key={i} className="px-2 py-2.5 text-center tabular-nums border-r border-surface-600 text-brand-300">
                    {total > 0 ? total.toFixed(1) : <span className="text-gray-600">—</span>}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center tabular-nums text-emerald-300 sticky right-0 bg-emerald-900/30">
                  {grandTotal.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
