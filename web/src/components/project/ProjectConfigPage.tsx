import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { CONTRACT_TYPES } from '../../lib/calculations';
import { useMemo } from 'react';

function Field({ label, value, onChange, type = 'text', step, readOnly, tooltip }: {
  label: string; value: any; onChange?: (v: string) => void;
  type?: string; step?: string; readOnly?: boolean; tooltip?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <input
        type={type} step={step} value={value ?? ''} readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`input ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        title={tooltip}
      />
    </div>
  );
}

export function ProjectConfigPage() {
  const { activeProject } = useUIStore();
  const { getConfig, updateConfig, forex } = useEngagementStore();

  const pid = activeProject?.id ?? '';
  const config = getConfig(pid);

  const endDate = useMemo(() => {
    if (!config.start_date || !config.duration_months) return '—';
    const d = new Date(config.start_date);
    d.setMonth(d.getMonth() + (config.duration_months ?? 0));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [config.start_date, config.duration_months]);

  if (!activeProject) return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Project Configuration</h1>
      <div className="card p-16 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Select a project to configure its engagement settings.</p>
      </div>
    </div>
  );

  const upd = (field: string, value: any) => updateConfig(pid, { [field]: value });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Project Configuration</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeProject.name} · Engagement settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Identity */}
        <div className="card p-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Identity & Client</h3>
          <Field label="Customer Name" value={config.customer_name} onChange={v => upd('customer_name', v)} />
          <Field label="Project Name" value={config.project_name} onChange={v => upd('project_name', v)} />
          <Field label="Project / Opp ID" value={config.project_id_ref} onChange={v => upd('project_id_ref', v)} />
          <div className="space-y-1.5">
            <label className="label">Contract Type</label>
            <select
              value={config.contract_type ?? ''}
              onChange={e => upd('contract_type', e.target.value)}
              className="input"
            >
              {CONTRACT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
            </select>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Timeline & Effort</h3>
          <Field label="Start Date" type="date" value={config.start_date} onChange={v => upd('start_date', v)} />
          <Field label="Duration (Months)" type="number" value={config.duration_months} onChange={v => upd('duration_months', parseInt(v))} />
          <Field label="Hours per Month" type="number" value={config.hours_per_month} onChange={v => upd('hours_per_month', parseInt(v))} />
          <div className="flex justify-between items-center pt-2 border-t border-surface-600">
            <span className="text-sm text-gray-500">End Date (Calc)</span>
            <span className="text-sm font-bold text-white">{endDate}</span>
          </div>
        </div>

        {/* Commercial */}
        <div className="card p-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Commercial Terms</h3>
          <Field
            label="Risk Reserve (%)" type="number" step="0.1"
            value={((config.risk_reserve ?? 0) * 100).toFixed(1)}
            onChange={v => upd('risk_reserve', parseFloat(v) / 100)}
            tooltip="Contingency buffer for unforeseen delivery risks."
          />
          <Field
            label="Global Discount (%)" type="number" step="0.1"
            value={((config.global_discount ?? 0) * 100).toFixed(1)}
            onChange={v => upd('global_discount', parseFloat(v) / 100)}
            tooltip="Negotiated reduction applied across all resource list prices."
          />
          <Field
            label="Global Allowance (%)" type="number" step="0.1"
            value={((config.global_allowance ?? 0) * 100).toFixed(1)}
            onChange={v => upd('global_allowance', parseFloat(v) / 100)}
            tooltip="Contractual uplift for travel, overheads, or management fees."
          />
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-600">
            <div className="space-y-1.5">
              <label className="label text-xs">Cost Currency</label>
              <select value={config.cost_currency ?? 'MYR'} onChange={e => upd('cost_currency', e.target.value)} className="input text-xs py-1.5">
                {forex.map(f => <option key={f.code} value={f.code}>{f.code}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label text-xs">Sell Currency</label>
              <select value={config.sell_currency ?? 'MYR'} onChange={e => upd('sell_currency', e.target.value)} className="input text-xs py-1.5">
                {forex.map(f => <option key={f.code} value={f.code}>{f.code}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
