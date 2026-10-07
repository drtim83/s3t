import { useState } from 'react';
import { Plus, FolderKanban, ChevronDown, Check, Calendar, Trash2 } from 'lucide-react';
import { useUIStore, useAuthStore, useToast } from '../../store';
import { useMyProjects, useCreateProject, useDeleteProject } from '../../hooks/useProjects';
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
    name: '', description: '', start_date: '', end_date: '',
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
        org_id: orgId || undefined,
        created_by: user?.id ?? null,
      });
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
        <input className="input" placeholder="e.g. Digital Transformation" value={form.name} onChange={set('name')} required autoFocus />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="Brief overview…" value={form.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={set('start_date')} /></div>
        <div><label className="label">End Date</label><input className="input" type="date" value={form.end_date} onChange={set('end_date')} /></div>
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

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const deleteProject = useDeleteProject();
  const { activeProject, setActiveProject } = useUIStore();
  const { success, error: toastError } = useToast();
  const [confirm, setConfirm] = useState('');

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(project.id);
      if (activeProject?.id === project.id) setActiveProject(null);
      success('Project deleted', project.name);
      onClose();
    } catch (err: unknown) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm text-red-300 font-semibold">⚠️ This will permanently delete:</p>
        <ul className="text-xs text-red-400 mt-2 space-y-1 list-disc list-inside">
          <li>All WBS elements and their data</li>
          <li>All discussions and attachments</li>
          <li>All approval records and scope documents</li>
          <li>All milestones and webhooks</li>
        </ul>
      </div>
      <div>
        <label className="label">Type <span className="text-red-400 font-mono">{project.name}</span> to confirm</label>
        <input className="input" placeholder={project.name} value={confirm} onChange={e => setConfirm(e.target.value)} autoFocus />
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={confirm !== project.name || deleteProject.isPending}
          className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-foreground text-sm font-semibold transition-colors justify-center flex"
        >
          {deleteProject.isPending ? 'Deleting…' : 'Delete Project'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}

// ─── Project Switcher ─────────────────────────────────────────────────────────
export function ProjectSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeProject, setActiveProject } = useUIStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data: projects = [] } = useMyProjects();
  const orgId = user?.org_id ?? '';

  if (collapsed) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="w-full flex justify-center py-2 text-muted-foreground hover:text-foreground transition-colors" title={activeProject?.name ?? 'Select project'}>
          <FolderKanban className="w-5 h-5" />
        </button>
        {open && <ProjectDropdown projects={projects} active={activeProject} orgId={orgId} onSelect={p => { setActiveProject(p); setOpen(false); }} onClose={() => setOpen(false)} onNew={() => { setOpen(false); setShowCreate(true); }} onDelete={p => { setOpen(false); setDeleteTarget(p); }} />}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
          <CreateProjectModal orgId={orgId} onClose={() => setShowCreate(false)} />
        </Modal>
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="md">
          {deleteTarget && <DeleteProjectModal project={deleteTarget} onClose={() => setDeleteTarget(null)} />}
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="px-2 py-2 border-b border-border relative">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 px-2 mb-1">Active Project</p>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary transition-colors group">
          <div className="w-6 h-6 rounded-md bg-brand-600/30 flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">{activeProject?.name ?? 'Select a project'}</p>
            <p className="text-[10px] text-muted-foreground/80 truncate capitalize">{activeProject ? activeProject.status : 'No project active'}</p>
          </div>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground/80 transition-transform shrink-0', open && 'rotate-180')} />
        </button>

        {open && <ProjectDropdown projects={projects} active={activeProject} orgId={orgId} onSelect={p => { setActiveProject(p); setOpen(false); }} onClose={() => setOpen(false)} onNew={() => { setOpen(false); setShowCreate(true); }} onDelete={p => { setOpen(false); setDeleteTarget(p); }} />}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
        <CreateProjectModal orgId={orgId} onClose={() => setShowCreate(false)} />
      </Modal>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="md">
        {deleteTarget && <DeleteProjectModal project={deleteTarget} onClose={() => setDeleteTarget(null)} />}
      </Modal>
    </>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function ProjectDropdown({ projects, active, onSelect, onClose, onNew, onDelete }: {
  projects: Project[]; active: Project | null; orgId: string;
  onSelect: (p: Project) => void; onClose: () => void;
  onNew: () => void; onDelete: (p: Project) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-2 right-2 mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="max-h-64 overflow-y-auto py-1">
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground/80 px-3 py-4 text-center">No projects yet.<br/>Click below to create one.</p>
          ) : projects.map(p => (
            <div key={p.id} className="flex items-center group hover:bg-secondary transition-colors" onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)}>
              {/* Select area — takes up most of the row */}
              <button onClick={() => onSelect(p)} className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-left min-w-0">
                <div className="w-5 h-5 rounded bg-brand-600/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground/80 capitalize">{p.status}</p>
                </div>
                {active?.id === p.id && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0 mr-1" />}
              </button>
              {/* Delete — far right column, separated by a gap, only visible on hover */}
              <div className="shrink-0 pr-2 pl-1 border-l border-border">
                <button
                  onClick={e => { e.stopPropagation(); onDelete(p); }}
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-150 text-red-400',
                    'hover:bg-red-500/30 hover:text-red-300',
                    hoverId === p.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  )}
                  title="Delete project"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-1">
          <button onClick={onNew} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-600/20 text-brand-400 hover:text-brand-300 transition-colors text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" />
            Create new project
          </button>
        </div>
      </div>
    </>
  );
}
