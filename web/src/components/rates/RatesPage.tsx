import { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import type { RateCardItem } from '../../lib/calculations';
import { formatPercent } from '../../lib/calculations';

const CATEGORIES = ['Technology', 'Consulting', 'Development', 'Architecture', 'Management', 'Other'];

export function RatesPage() {
  const { activeProject } = useUIStore();
  const { getRateCard, setRateCard } = useEngagementStore();
  const [search, setSearch] = useState('');

  const pid = activeProject?.id ?? '';
  const rateCard = getRateCard(pid);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return rateCard.filter(r =>
      r.code.toLowerCase().includes(s) ||
      r.title.toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s)
    );
  }, [rateCard, search]);

  const update = (idx: number, field: keyof RateCardItem, val: any) => {
    const orig = rateCard.findIndex(r => r.code === filtered[idx].code);
    const next = [...rateCard];
    (next[orig] as any)[field] = val;
    setRateCard(pid, next);
  };

  const addRole = () => {
    setRateCard(pid, [...rateCard, {
      code: `NEW-${Date.now().toString().slice(-4)}`,
      title: 'New Role',
      category: 'Technology',
      list_price: 0,
      cost_price: 0,
      project_id: pid,
    }]);
  };

  const deleteRole = (code: string) => {
    setRateCard(pid, rateCard.filter(r => r.code !== code));
  };

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Rate Card</h1>
        <div className="card p-16 flex flex-col items-center justify-center text-center gap-4">
          <p className="text-gray-400 text-sm">Select a project to manage its rate card.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Standard Rate Card</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeProject.name} · MYR / hr</p>
        </div>
        <button onClick={addRole} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-surface-600">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
            placeholder="Search by code, title or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="text-xs text-gray-500 shrink-0">{filtered.length} roles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Role Title</th>
                <th>Category</th>
                <th className="text-right">List Price (MYR/hr)</th>
                <th className="text-right">Cost Price (MYR/hr)</th>
                <th className="text-right">Margin %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const margin = item.list_price > 0 ? (item.list_price - item.cost_price) / item.list_price : 0;
                return (
                  <tr key={item.code}>
                    <td>
                      <span className="font-mono text-brand-400 text-xs font-bold">{item.code}</span>
                    </td>
                    <td>
                      <input
                        className="bg-transparent border-b border-transparent hover:border-surface-500 focus:border-brand-500 outline-none text-white text-sm w-full transition-colors py-0.5"
                        value={item.title}
                        onChange={e => update(i, 'title', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="bg-surface-700 border border-surface-500 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500"
                        value={item.category}
                        onChange={e => update(i, 'category', e.target.value)}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-right text-white outline-none focus:border-brand-500 w-24 tabular-nums"
                        value={item.list_price}
                        onChange={e => update(i, 'list_price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-right text-white outline-none focus:border-brand-500 w-24 tabular-nums"
                        value={item.cost_price}
                        onChange={e => update(i, 'cost_price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="text-right">
                      <span className={`font-bold text-sm tabular-nums ${margin >= 0.4 ? 'text-emerald-400' : margin >= 0.2 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPercent(margin)}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => deleteRole(item.code)}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            {search ? 'No roles match your search.' : 'No roles in rate card. Click "Add Role" to start.'}
          </div>
        )}
      </div>
    </div>
  );
}
