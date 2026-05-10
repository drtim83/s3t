import { useState } from 'react';
import { Plus, FolderKanban, ChevronDown, Check, Calendar } from 'lucide-react';
import { useUIStore, useAuthStore, useToast } from '../../store';
import { useMyProjects, useCreateProject } from '../../hooks/useProjects';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { Project } from '../../lib/database.types';

// ─── Create Project Modal ─────────────────────────────────────────────────────
function CreateProjectModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const create = useCreateProject();
  const { setActiveProject } = useUIStore();
  const { success, error: toastError } = useToast();
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active' as Project['status'],
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const project = await create.mutateAsync({
        name: form.name.trim(),
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        org_id: orgId,
        created_by: user?.id ?? null,
      } as any);
      success('Project created', form.name);
      setActiveProject(project);
      onClose();
    } catch (err: unknown) {
      toastError('Failed to create project', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Project Name *</label>
        <input className="input" placeholder="e.g. S3T Digital Transformation" value={form.name} onChange={set('name')} required autoFocus />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="Brief overview of the engagement…" value={form.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input className="input" type="date" value={form.start_date} onChange={set('start_date')} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input className="input" type="date" value={form.end_date} onChange={set('end_date')} />
        </div>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={set('status')}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create Project'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

// ─── Project Switcher ─────────────────────────────────────────────────────────
export function ProjectSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeProject, setActiveProject } = useUIStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects = [] } = useMyProjects();
  const orgId = (user as any)?.org_id ?? '';

  if (collapsed) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex justify-center py-2 text-gray-400 hover:text-white transition-colors"
          title={activeProject?.name ?? 'Select project'}
        >
          <FolderKanban className="w-5 h-5" />
        </button>
        {open && (
          <ProjectDropdown
            projects={projects}
            active={activeProject}
            orgId={orgId ?? ''}
            onSelect={p => { setActiveProject(p); setOpen(false); }}
            onClose={() => setOpen(false)}
            onNew={() => { setOpen(false); setShowCreate(true); }}
          />
        )}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
          <CreateProjectModal orgId={orgId ?? ''} onClose={() => setShowCreate(false)} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="px-2 py-2 border-b border-surface-600">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 px-2 mb-1">Active Project</p>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-700 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-brand-600/30 flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {activeProject?.name ?? 'Select a project'}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {activeProject ? (activeProject.status) : 'No project active'}
            </p>
          </div>
          <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <ProjectDropdown
            projects={projects}
            active={activeProject}
            orgId={orgId ?? ''}
            onSelect={p => { setActiveProject(p); setOpen(false); }}
            onClose={() => setOpen(false)}
            onNew={() => { setOpen(false); setShowCreate(true); }}
          />
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
        <CreateProjectModal orgId={orgId ?? ''} onClose={() => setShowCreate(false)} />
      </Modal>
    </>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function ProjectDropdown({ projects, active, onSelect, onClose, onNew }: {
  projects: Project[];
  active: Project | null;
  orgId: string;
  onSelect: (p: Project) => void;
  onClose: () => void;
  onNew: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-2 right-2 mt-1 z-50 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="max-h-64 overflow-y-auto py-1">
          {projects.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-3 text-center">No projects yet</p>
          ) : (
            projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-700 transition-colors text-left"
              >
                <div className="w-5 h-5 rounded bg-brand-600/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{p.status}</p>
                </div>
                {active?.id === p.id && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-surface-600 p-1">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-600/20 text-brand-400 hover:text-brand-300 transition-colors text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new project
          </button>
        </div>
      </div>
    </>
  );
}
