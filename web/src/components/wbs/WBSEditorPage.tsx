import { useState } from 'react';
import { Plus, Search, ChevronRight, ChevronDown, Pencil, Trash2, MessageSquare, ListTree, Download } from 'lucide-react';
import { useUIStore, useToast } from '../../store';
import { useWBSElements, useCreateWBSElement, useUpdateWBSElement, useDeleteWBSElement } from '../../hooks/useWBS';
import { exportWBSPDF } from '../../lib/exportPDF';
import { StatusBadge, StatusSelect } from '../ui/StatusBadge';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Spinner';
import { formatHours, formatDate } from '../../lib/utils';
import type { WBSElement, WBSStatus } from '../../lib/database.types';

// ─── WBS Row (recursive) ─────────────────────────────────────────────────────
interface WBSRowProps {
  element: WBSElement;
  depth: number;
  onEdit: (el: WBSElement) => void;
  onDelete: (el: WBSElement) => void;
  onAddChild: (parentId: string) => void;
}

function WBSRow({ element, depth, onEdit, onDelete, onAddChild }: WBSRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (element.children?.length ?? 0) > 0;
  const updateWBS = useUpdateWBSElement();

  function handleStatusChange(status: WBSStatus) {
    updateWBS.mutate({ id: element.id, status });
  }

  return (
    <>
      <tr className="group">
        <td style={{ paddingLeft: `${depth * 24 + 16}px` }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`w-4 h-4 text-muted-foreground/80 hover:text-foreground transition-colors ${!hasChildren && 'opacity-0 pointer-events-none'}`}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <code className="text-brand-400 text-xs font-mono">{element.wbs_code}</code>
          </div>
        </td>
        <td>
          <span className="text-foreground font-medium">{element.name}</span>
          {element.description && (
            <p className="text-xs text-muted-foreground/80 mt-0.5 truncate max-w-xs">{element.description}</p>
          )}
        </td>
        <td>
          <StatusSelect value={element.status} onChange={handleStatusChange} className="w-36" />
        </td>
        <td className="text-foreground/80">{element.phase ?? '—'}</td>
        <td className="text-foreground/80">{formatHours(element.effort_hours)}</td>
        <td className="text-foreground/80">{formatDate(element.start_date)}</td>
        <td className="text-foreground/80">{formatDate(element.end_date)}</td>
        <td>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onAddChild(element.id)} className="btn btn-ghost btn-sm" title="Add child">
              <Plus className="w-3 h-3" />
            </button>
            <button onClick={() => onEdit(element)} className="btn btn-ghost btn-sm" title="Edit">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(element)} className="btn btn-danger btn-sm" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
            <button className="btn btn-ghost btn-sm" title="Comments">
              <MessageSquare className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && hasChildren && element.children!.map((child) => (
        <WBSRow key={child.id} element={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </>
  );
}

// ─── WBS Form ─────────────────────────────────────────────────────────────────
interface WBSFormProps {
  initial?: Partial<WBSElement>;
  parentId?: string | null;
  projectId: string;
  onClose: () => void;
}

function WBSForm({ initial, parentId, projectId, onClose }: WBSFormProps) {
  const create = useCreateWBSElement();
  const update = useUpdateWBSElement();
  const { success, error: toastError } = useToast();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    wbs_code:    initial?.wbs_code    ?? '',
    name:        initial?.name        ?? '',
    description: initial?.description ?? '',
    phase:       initial?.phase       ?? '',
    level:       initial?.level       ?? 1,
    effort_hours:initial?.effort_hours?.toString() ?? '',
    start_date:  initial?.start_date  ?? '',
    end_date:    initial?.end_date    ?? '',
    status:      (initial?.status ?? 'not_started') as WBSStatus,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wbs_code || !form.name) return;
    const payload: Partial<WBSElement> = {
      ...form,
      project_id:   projectId,
      parent_id:    parentId ?? initial?.parent_id ?? null,
      effort_hours: form.effort_hours ? parseFloat(form.effort_hours) : null,
      start_date:   form.start_date || null,
      end_date:     form.end_date   || null,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial!.id!, ...payload });
        success('WBS element updated');
      } else {
        await create.mutateAsync(payload);
        success('WBS element created');
      }
      onClose();
    } catch (err: unknown) {
      toastError('Failed to save', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">WBS Code *</label>
          <input className="input" placeholder="1.2.3" value={form.wbs_code} onChange={set('wbs_code')} required />
        </div>
        <div>
          <label className="label">Level</label>
          <select className="input" value={form.level} onChange={set('level')}>
            <option value={1}>1 — Phase</option>
            <option value={2}>2 — Deliverable</option>
            <option value={3}>3 — Task</option>
            <option value={4}>4 — Sub-task</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Name *</label>
        <input className="input" placeholder="Element name" value={form.name} onChange={set('name')} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="Optional description" value={form.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Phase / Sprint</label>
          <input className="input" placeholder="e.g. Sprint 1" value={form.phase} onChange={set('phase')} />
        </div>
        <div>
          <label className="label">Effort (hours)</label>
          <input className="input" type="number" min="0" step="0.5" placeholder="e.g. 16" value={form.effort_hours} onChange={set('effort_hours')} />
        </div>
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
        <StatusSelect value={form.status} onChange={(s) => setForm(f => ({ ...f, status: s }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={create.isPending || update.isPending}>
          {isEdit ? 'Update Element' : 'Create Element'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

// ─── Main WBS Page ────────────────────────────────────────────────────────────
export function WBSEditorPage() {
  const { activeProject } = useUIStore();
  const { data, isLoading } = useWBSElements(activeProject?.id ?? null);
  const deleteEl = useDeleteWBSElement();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; edit?: WBSElement; parentId?: string }>({ open: false });

  function openCreate(parentId?: string) { setModal({ open: true, parentId }); }
  function openEdit(el: WBSElement)       { setModal({ open: true, edit: el }); }
  function closeModal()                   { setModal({ open: false }); }

  async function handleDelete(el: WBSElement) {
    if (!confirm(`Delete "${el.name}" and all its children?`)) return;
    try {
      await deleteEl.mutateAsync({ id: el.id, projectId: el.project_id });
      success('Element deleted');
    } catch (err: unknown) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  const tree = data?.tree ?? [];
  const flat = data?.flat ?? [];
  const searchLower = search.toLowerCase();
  const filteredFlat = search
    ? flat.filter(e =>
        e.name.toLowerCase().includes(searchLower) ||
        e.wbs_code.toLowerCase().includes(searchLower)
      )
    : null;

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground/80">Select a project to view its WBS.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <ListTree className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Work Breakdown Structure</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name} · {flat.length} elements</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportWBSPDF(activeProject.name, flat)}
            className="btn-secondary"
            disabled={flat.length === 0}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={() => openCreate()} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Element
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
        <input
          className="input pl-10"
          placeholder="Search WBS elements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Code</th>
                <th>Name</th>
                <th style={{ width: 160 }}>Status</th>
                <th>Phase</th>
                <th>Effort</th>
                <th>Start</th>
                <th>End</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlat ? (
                filteredFlat.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted-foreground/80 py-8">No results for &quot;{search}&quot;</td></tr>
                ) : filteredFlat.map(el => (
                  <tr key={el.id} className="group">
                    <td><code className="text-brand-400 text-xs font-mono">{el.wbs_code}</code></td>
                    <td className="text-foreground">{el.name}</td>
                    <td><StatusBadge status={el.status} /></td>
                    <td className="text-foreground/80">{el.phase ?? '—'}</td>
                    <td className="text-foreground/80">{formatHours(el.effort_hours)}</td>
                    <td className="text-foreground/80">{formatDate(el.start_date)}</td>
                    <td className="text-foreground/80">{formatDate(el.end_date)}</td>
                    <td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(el)} className="btn btn-ghost btn-sm"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(el)} className="btn btn-danger btn-sm"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                tree.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground/80">
                        <p className="font-medium">No WBS elements yet</p>
                        <button onClick={() => openCreate()} className="btn-primary btn-sm">
                          <Plus className="w-3 h-3" /> Add first element
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : tree.map(el => (
                  <WBSRow key={el.id} element={el} depth={0} onEdit={openEdit} onDelete={handleDelete} onAddChild={openCreate} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.edit ? 'Edit WBS Element' : 'New WBS Element'}
        size="lg"
      >
        <WBSForm
          initial={modal.edit}
          parentId={modal.parentId}
          projectId={activeProject.id}
          onClose={closeModal}
        />
      </Modal>
    </div>
  );
}
