import { useEffect, useMemo, useCallback } from 'react';
import { Globe, RotateCcw } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { formatCurrency, calcResource, calcTotals } from '../../lib/calculations';

export function ForexPage() {
  const { activeProject } = useUIStore();
  const {
    forex, setForex, setForexLoading, isForexLoading, secondaryCurrency, setSecondaryCurrency,
    getResources, getRateCard, getConfig, getExpenses,
  } = useEngagementStore();

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

  const fetchRates = useCallback(async () => {
    setForexLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/MYR');
      const data = await res.json();
      if (data?.rates) {
        setForex(forex.map(f => data.rates[f.code]
          ? { ...f, rate: data.rates[f.code], is_auto: true }
          : f
        ));
      }
    } catch (err) {
      console.error('Forex fetch failed:', err);
    } finally {
      setForexLoading(false);
    }
  }, [forex, setForex, setForexLoading]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Currency & Forex Exchange</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live rates · MYR base · open.er-api.com</p>
        </div>
        <div className="flex items-center gap-3">
          {isForexLoading ? (
            <span className="flex items-center gap-2 text-xs text-brand-400 font-bold animate-pulse">
              <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Fetching rates…
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <Globe className="w-3.5 h-3.5" /> Live rates active
            </span>
          )}
          <button onClick={fetchRates} className="btn-secondary btn-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Secondary:</span>
            <select
              value={secondaryCurrency}
              onChange={e => setSecondaryCurrency(e.target.value)}
              className="bg-secondary border border-input rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-brand-500"
            >
              {forex.filter(f => f.code !== 'MYR').map(f => (
                <option key={f.code} value={f.code}>{f.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Card Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Currency Name</th>
                  <th className="text-right">Rate (per 1 MYR)</th>
                  <th className="text-center">Source</th>
                </tr>
              </thead>
              <tbody>
                {forex.map((fx, idx) => (
                  <tr key={fx.code}>
                    <td>
                      <span className="font-mono font-bold text-brand-400">{fx.code}</span>
                      {fx.is_auto && <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" title="Auto-fetched" />}
                    </td>
                    <td className="text-muted-foreground">{fx.name}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        step="0.0001"
                        className="bg-secondary border border-border rounded px-2 py-1 text-xs text-right text-foreground outline-none focus:border-brand-500 w-28 tabular-nums"
                        value={fx.rate}
                        onChange={e => {
                          const next = [...forex];
                          next[idx] = { ...next[idx], rate: parseFloat(e.target.value) || 0, is_auto: false };
                          setForex(next);
                        }}
                      />
                    </td>
                    <td className="text-center">
                      <span className={`badge ${fx.is_auto ? 'badge-green' : 'badge-gray'}`}>
                        {fx.is_auto ? 'Live' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TCV Conversion Panel */}
        <div className="glass p-8 flex flex-col space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/3 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-foreground">Total Project Value</h3>
            </div>
            <div className="space-y-4">
              {forex.filter(f => f.code !== 'MYR').map(fx => (
                <div key={fx.code} className="flex justify-between items-end border-b border-white/8 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 mb-1">In {fx.name}</p>
                    <p className="text-2xl font-black text-emerald-400 tabular-nums">
                      {fx.code} {formatCurrency(totals.revenue * fx.rate, fx.code)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-600">Rate: {fx.rate.toFixed(4)}</p>
                  </div>
                </div>
              ))}
              {totals.revenue === 0 && (
                <p className="text-sm text-gray-600 italic">No revenue calculated yet. Add resources to the Effort plan.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
