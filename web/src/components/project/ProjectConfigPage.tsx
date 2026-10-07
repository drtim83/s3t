import { useMemo, useState } from 'react';
import { Copy, Save, Share2, Check } from 'lucide-react';
import { useUIStore, useToast } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import { CONTRACT_TYPES, type ProjectEngagementConfig } from '../../lib/calculations';
import { useCloneProject, useUpdateProject } from '../../hooks/useProjects';

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function Field({ label, value, onChange, type = 'text', step, readOnly, tooltip }: {
  label: string; value: string | number | null | undefined; onChange?: (v: string) => void;
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
  const { activeProject, setActiveProject } = useUIStore();
  const { getConfig, updateConfig, forex } = useEngagementStore();
  const clone = useCloneProject();
  const updateProject = useUpdateProject();
  const { success, error: toastError } = useToast();

  const [cloning, setCloning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      <h1 className="text-2xl font-bold text-foreground">Project Configuration</h1>
      <div className="card p-16 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a project to configure its engagement settings.</p>
      </div>
    </div>
  );

  const upd = <K extends keyof ProjectEngagementConfig>(field: K, value: ProjectEngagementConfig[K]) =>
    updateConfig(pid, { [field]: value } as Partial<ProjectEngagementConfig>);

  async function handleClone(isTemplate: boolean) {
    if (!activeProject) return;
    setCloning(true);
    try {
      const newName = isTemplate ? `${activeProject.name} (Template)` : `${activeProject.name} (Scenario B)`;
      await clone.mutateAsync({
        sourceId: activeProject.id,
        newName,
        isTemplate
      });
      success(isTemplate ? 'Template created' : 'Scenario duplicated', newName);
    } catch (err: unknown) {
      toastError('Failed to duplicate', errMsg(err));
    } finally {
      setCloning(false);
    }
  }

  async function handleShare() {
    if (!activeProject) return;
    setSharing(true);
    try {
      let project = activeProject;
      // get_shared_project() only returns projects with is_shared = true,
      // so the link is dead until sharing is switched on.
      if (!project.is_shared) {
        project = await updateProject.mutateAsync({ id: project.id, is_shared: true });
        setActiveProject(project);
      }
      if (!project.share_token) {
        toastError('Cannot share', 'Share token missing — apply migration 003 in Supabase.');
        return;
      }
      const url = `${window.location.origin}/share/${project.share_token}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      success('Link copied', 'Client share link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err: unknown) {
      toastError('Could not create share link', errMsg(err));
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Configuration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name} · Engagement settings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleClone(false)} disabled={cloning} className="btn-secondary">
            <Copy className="w-4 h-4" />
            Duplicate as Scenario
          </button>
          <button onClick={() => handleClone(true)} disabled={cloning} className="btn-secondary text-brand-400">
            <Save className="w-4 h-4" />
            Save as Template
          </button>
          <button onClick={handleShare} disabled={sharing} className="btn-primary">
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? 'Copied!' : 'Share with Client'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Identity */}
        <div className="card p-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Identity & Client</h3>
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
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Timeline & Effort</h3>
          <Field label="Start Date" type="date" value={config.start_date} onChange={v => upd('start_date', v)} />
          <Field label="Duration (Months)" type="number" value={config.duration_months} onChange={v => upd('duration_months', parseInt(v))} />
          <Field label="Hours per Month" type="number" value={config.hours_per_month} onChange={v => upd('hours_per_month', parseInt(v))} />
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground/80">End Date (Calc)</span>
            <span className="text-sm font-bold text-foreground">{endDate}</span>
          </div>
        </div>

        {/* Commercial */}
        <div className="card p-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Commercial Terms</h3>
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
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
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
