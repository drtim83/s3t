import { useState } from 'react';
import {
  Sparkles, CheckCircle2, AlertCircle,
  ChevronRight, Loader2, Trash2, Plus, Wand2,
} from 'lucide-react';
import { useUIStore, useToast } from '../../store';
import { useCreateWBSElement } from '../../hooks/useWBS';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AIWBSItem {
  wbs_code: string;
  level: number;
  name: string;
  description: string;
  phase: string;
  effort_hours: number;
  status: 'not_started';
}

// ─── Mock AI Parser (replace with real API call when key available) ────────────
async function parseSOWWithAI(sowText: string): Promise<AIWBSItem[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 2200));

  // Simple rule-based extraction for demo — replace with Gemini/OpenAI call
  const lines = sowText.split('\n').filter(l => l.trim().length > 10);
  const items: AIWBSItem[] = [];
  let phaseCount = 0;
  let taskCount = 0;

  const phaseKeywords = /\b(phase|stage|milestone|deliverable|section)\b/i;
  const taskKeywords = /\b(develop|implement|design|build|configure|test|deploy|create|integrate|analyse|review|document|setup|install|migrate)\b/i;

  lines.slice(0, 30).forEach(line => {
    const clean = line.replace(/^[\d.\-*#]+\s*/, '').trim();
    if (!clean || clean.length < 8) return;

    if (phaseKeywords.test(clean) || clean.length < 50) {
      phaseCount++;
      items.push({
        wbs_code: String(phaseCount),
        level: 1,
        name: clean.slice(0, 60),
        description: '',
        phase: `Phase ${phaseCount}`,
        effort_hours: 0,
        status: 'not_started',
      });
    } else if (taskKeywords.test(clean) && phaseCount > 0) {
      taskCount++;
      items.push({
        wbs_code: `${phaseCount}.${taskCount}`,
        level: 2,
        name: clean.slice(0, 80),
        description: clean,
        phase: `Phase ${phaseCount}`,
        effort_hours: Math.round((Math.random() * 40 + 8) * 2) / 2,
        status: 'not_started',
      });
    }
  });

  // If nothing matched, create a basic structure from paragraphs
  if (items.length === 0) {
    const paragraphs = sowText.split(/\n\n+/).filter(p => p.trim().length > 20).slice(0, 8);
    paragraphs.forEach((para, i) => {
      items.push({
        wbs_code: String(i + 1),
        level: 1,
        name: para.trim().slice(0, 70),
        description: para.trim(),
        phase: `Phase ${i + 1}`,
        effort_hours: Math.round((Math.random() * 80 + 16) * 2) / 2,
        status: 'not_started',
      });
    });
  }

  return items;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AISOWParserPage() {
  const { activeProject } = useUIStore();
  const { success, error: toastError } = useToast();
  const createWBS = useCreateWBSElement();

  const [step, setStep] = useState<'input' | 'parsing' | 'review' | 'done'>('input');
  const [sowText, setSowText] = useState('');
  const [draftItems, setDraftItems] = useState<AIWBSItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const SAMPLE_SOW = `Project: Digital Banking Platform Modernisation

Phase 1: Discovery & Requirements
The project will begin with a comprehensive discovery phase. The consultant team will conduct stakeholder interviews with all key business units, analyse the existing core banking system architecture, and document the current state process flows.

Phase 2: Solution Design
Design the target state architecture for the new digital banking platform. This includes designing the API gateway layer, the microservices architecture, and the mobile-first user experience. Develop detailed technical specifications and obtain design approval.

Phase 3: Development & Integration
Implement the core platform components including customer onboarding module, account management services, and transaction processing engine. Integrate with the existing core banking system via RESTful APIs. Build the mobile application for iOS and Android platforms.

Phase 4: Testing & Quality Assurance
Conduct comprehensive testing including unit testing, integration testing, performance testing, and user acceptance testing (UAT). Review security posture and perform penetration testing. Resolve all critical and high-severity defects.

Phase 5: Deployment & Go-Live
Deploy the solution to production environment. Configure monitoring and alerting. Conduct end-user training. Provide hypercare support for 30 days post go-live.`;

  async function handleParse() {
    if (!sowText.trim()) return;
    setStep('parsing');
    try {
      const items = await parseSOWWithAI(sowText);
      setDraftItems(items);
      setSelected(new Set(items.map((_, i) => i)));
      setStep('review');
    } catch {
      toastError('Parse failed', 'Could not analyse the SOW text. Try again.');
      setStep('input');
    }
  }

  async function handleImport() {
    if (!activeProject) return;
    setImporting(true);
    let created = 0;
    try {
      for (const idx of Array.from(selected)) {
        const item = draftItems[idx];
        await createWBS.mutateAsync({
          project_id: activeProject.id,
          wbs_code: item.wbs_code,
          level: item.level,
          name: item.name,
          description: item.description || null,
          phase: item.phase || null,
          effort_hours: item.effort_hours || null,
          status: item.status,
        });
        created++;
      }
      success(`${created} WBS elements imported`, 'Go to the WBS Editor to review and refine.');
      setStep('done');
    } catch (err: unknown) {
      toastError('Import failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  }

  function toggleItem(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  function updateItem(i: number, field: keyof AIWBSItem, value: string | number) {
    setDraftItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function removeItem(i: number) {
    setDraftItems(prev => prev.filter((_, idx) => idx !== i));
    setSelected(prev => {
      const next = new Set<number>();
      prev.forEach(idx => { if (idx !== i) next.add(idx > i ? idx - 1 : idx); });
      return next;
    });
  }

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">AI SOW Parser</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a project first to use the AI SOW Parser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0">
          <Sparkles className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI SOW Parser</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste your Statement of Work → AI extracts a structured WBS draft → Review & import
          </p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs">
        {(['input', 'parsing', 'review', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${
              step === s ? 'bg-brand-600 text-foreground' :
              ['input','parsing','review','done'].indexOf(step) > i ? 'bg-emerald-600 text-foreground' :
              'bg-secondary text-muted-foreground/80'
            }`}>
              {['input','parsing','review','done'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={step === s ? 'text-foreground font-semibold' : 'text-muted-foreground/80'}>
              {['Input SOW', 'AI Parsing', 'Review Draft', 'Done'][i]}
            </span>
            {i < 3 && <ChevronRight className="w-3 h-3 text-gray-600" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Input ── */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Statement of Work (SOW) Text</label>
              <button onClick={() => setSowText(SAMPLE_SOW)} className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                Load sample SOW →
              </button>
            </div>
            <textarea
              className="input resize-none font-mono text-xs leading-relaxed"
              rows={16}
              placeholder={`Paste your full SOW, project brief, or scope document here...\n\nThe AI will:\n• Identify phases, deliverables and tasks\n• Estimate effort hours per item\n• Generate WBS codes automatically\n• Structure everything as a WBS hierarchy`}
              value={sowText}
              onChange={e => setSowText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground/80">{sowText.length} characters · {sowText.split('\n').filter(l => l.trim()).length} lines</p>
              <button
                onClick={handleParse}
                disabled={sowText.trim().length < 50}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                Parse with AI
              </button>
            </div>
          </div>

          <div className="glass p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              <span className="font-bold">Note:</span> The AI parser currently uses rule-based extraction. Connect a Gemini or OpenAI API key in Settings to enable full AI parsing with natural language understanding.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Parsing ── */}
      {step === 'parsing' && (
        <div className="card p-16 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-foreground animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-500/30 animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-foreground font-semibold">Analysing your SOW…</p>
            <p className="text-muted-foreground/80 text-sm">Identifying phases, deliverables, and effort estimates</p>
          </div>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Review AI-Generated WBS Draft</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {draftItems.length} elements generated · {selected.size} selected for import.
                Edit names, effort, or uncheck items to exclude them.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set(draftItems.map((_, i) => i)))} className="btn-ghost btn-sm text-xs">Select all</button>
              <button onClick={() => setSelected(new Set())} className="btn-ghost btn-sm text-xs">None</button>
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {draftItems.map((item, i) => (
              <div
                key={i}
                className={`card p-4 transition-all ${selected.has(i) ? 'border-brand-500/30' : 'opacity-50 border-border'}`}
                style={{ marginLeft: `${(item.level - 1) * 20}px` }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleItem(i)}
                    className="mt-1 accent-brand-500"
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                          {item.wbs_code}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${item.level === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary/50 text-muted-foreground'}`}>
                          L{item.level} {item.level === 1 ? 'Phase' : 'Task'}
                        </span>
                      </div>
                      <input
                        className="input input-sm text-xs"
                        value={item.name}
                        onChange={e => updateItem(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-muted-foreground/80 uppercase font-bold">Hours</label>
                        <input
                          type="number"
                          className="input input-sm text-xs"
                          value={item.effort_hours}
                          min={0}
                          step={4}
                          onChange={e => updateItem(i, 'effort_hours', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <button
                        onClick={() => removeItem(i)}
                        className="mt-4 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button onClick={() => setStep('input')} className="btn-secondary">← Back</button>
            <div className="flex-1" />
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="btn-primary disabled:opacity-40"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {importing ? 'Importing…' : `Import ${selected.size} elements to WBS`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="card p-16 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-xl font-bold">WBS Imported Successfully</p>
            <p className="text-muted-foreground text-sm">Your WBS elements are now in the project. Go to the WBS Editor to add dates, assign resources, and refine effort estimates.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep('input'); setSowText(''); setDraftItems([]); }} className="btn-secondary">
              Parse another SOW
            </button>
            <a href="/wbs" className="btn-primary">Go to WBS Editor →</a>
          </div>
        </div>
      )}
    </div>
  );
}
