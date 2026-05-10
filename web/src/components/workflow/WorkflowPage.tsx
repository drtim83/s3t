import { useState } from 'react';
import { Bell, Zap, Mail, CheckCircle2, AlertCircle, ChevronRight, Info } from 'lucide-react';
import { useUIStore } from '../../store';

interface WebhookRule {
  id: string;
  trigger: string;
  condition: string;
  action: string;
  recipient: string;
  enabled: boolean;
}

const TRIGGER_OPTIONS = [
  'WBS Status → completed',
  'WBS Status → blocked',
  'WBS Status → in_progress',
  'WBS Element Created',
  'Approval Gate Signed',
  'Budget Variance > 5%',
];

const ACTION_OPTIONS = [
  'Send Email Notification',
  'Post to Webhook URL',
  'Create Dashboard Alert',
];

const EXAMPLE_RULES: WebhookRule[] = [
  { id: '1', trigger: 'WBS Status → completed', condition: 'Level = 1 (Phase)', action: 'Send Email Notification', recipient: 'pm@company.com', enabled: true },
  { id: '2', trigger: 'WBS Status → blocked',   condition: 'Any element',        action: 'Create Dashboard Alert', recipient: '',                 enabled: true },
  { id: '3', trigger: 'Approval Gate Signed',   condition: 'Both gates signed',  action: 'Send Email Notification', recipient: 'mgmt@company.com', enabled: false },
];

export function WorkflowPage() {
  const { activeProject } = useUIStore();
  const [rules, setRules] = useState<WebhookRule[]>(EXAMPLE_RULES);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [smtpConfigured] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Workflow Automation</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {activeProject ? activeProject.name + ' · ' : ''}Trigger-based notifications and actions
        </p>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap gap-3">
        <div className="card px-4 py-3 flex items-center gap-3">
          <Zap className="w-4 h-4 text-brand-400" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Active Rules</p>
            <p className="text-lg font-black text-white">{activeCount} / {rules.length}</p>
          </div>
        </div>
        <div className={`card px-4 py-3 flex items-center gap-3 ${smtpConfigured ? 'border-emerald-500/30' : 'border-amber-500/20'}`}>
          <Mail className={`w-4 h-4 ${smtpConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Email (SMTP)</p>
            <p className={`text-sm font-bold ${smtpConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {smtpConfigured ? 'Configured' : 'Not connected'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-300">Automation Rules</h3>
            <button
              className="btn-primary btn-sm"
              onClick={() => setRules([...rules, {
                id: Date.now().toString(),
                trigger: TRIGGER_OPTIONS[0],
                condition: 'Any element',
                action: ACTION_OPTIONS[0],
                recipient: '',
                enabled: false,
              }])}
            >
              + Add Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className={`card p-5 transition-all ${rule.enabled ? 'border-brand-500/20' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Trigger */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                        WHEN
                      </span>
                      <select
                        className="bg-surface-700 border border-surface-500 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500"
                        value={rule.trigger}
                        onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, trigger: e.target.value } : r))}
                      >
                        {TRIGGER_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChevronRight className="w-3 h-3 text-gray-600" />
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                        THEN
                      </span>
                      <select
                        className="bg-surface-700 border border-surface-500 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500"
                        value={rule.action}
                        onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, action: e.target.value } : r))}
                      >
                        {ACTION_OPTIONS.map(a => <option key={a}>{a}</option>)}
                      </select>
                      {rule.action === 'Send Email Notification' && (
                        <input
                          className="bg-surface-700 border border-surface-500 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500 w-40"
                          placeholder="recipient@email.com"
                          value={rule.recipient}
                          onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, recipient: e.target.value } : r))}
                        />
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`w-11 h-6 rounded-full relative transition-all border-2 shrink-0 ${rule.enabled ? 'bg-brand-600 border-brand-500' : 'bg-white/10 border-white/20'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${rule.enabled ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration panel */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Webhook Endpoint</h3>
            <input
              className="input text-xs"
              placeholder="https://hooks.yourapp.com/..."
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
            />
            <button className="btn-primary btn-sm w-full justify-center">Test Endpoint</button>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email Setup (Supabase Edge)
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              To enable email notifications, configure the Supabase Edge Function with your SendGrid API key.
            </p>
            <div className="bg-surface-700 rounded-lg p-3 font-mono text-[10px] text-gray-400 space-y-1">
              <p className="text-brand-400"># supabase/.env</p>
              <p>SENDGRID_API_KEY=SG.xxx...</p>
              <p>FROM_EMAIL=noreply@s3t.app</p>
            </div>
            <div className="flex items-start gap-2 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300 leading-relaxed">
                Deploy the <code className="text-amber-400">notify-on-status-change</code> Edge Function from your Supabase dashboard to activate email triggers.
              </p>
            </div>
          </div>

          <div className="glass p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recent Events</h3>
            {[
              { icon: CheckCircle2, msg: 'Status → completed triggered', time: 'Just now', color: 'text-emerald-400' },
              { icon: AlertCircle,  msg: 'Blocked alert suppressed (disabled)', time: '2m ago', color: 'text-gray-500' },
              { icon: Bell,         msg: 'Email sent to pm@company.com', time: '1h ago', color: 'text-brand-400' },
            ].map((ev, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[11px]">
                <ev.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${ev.color}`} />
                <div>
                  <p className="text-gray-300">{ev.msg}</p>
                  <p className="text-gray-600">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
