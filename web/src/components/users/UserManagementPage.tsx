import { useState } from 'react';
import { Users, Eye, Edit3, Trash2, UserPlus, Mail, Search, Crown, AlertCircle, type LucideIcon } from 'lucide-react';
import { useUIStore, useAuthStore, useToast } from '../../store';
import {
  fetchProjectMembers,
  updateMemberRole,
  removeMember,
  addMemberByEmail,
} from '../../lib/firestoreService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { ProjectRole } from '../../lib/database.types';

const ROLE_CONFIG: Record<ProjectRole, { icon: LucideIcon; color: string; desc: string }> = {
  Admin:       { icon: Crown,  color: 'text-amber-400 bg-amber-400/10',  desc: 'Full access — manage members, edit everything' },
  PM:          { icon: Crown,  color: 'text-blue-400 bg-blue-400/10',    desc: 'Project Manager — plan, assign, schedule' },
  Contributor: { icon: Edit3,  color: 'text-brand-400 bg-brand-400/10',  desc: 'Can edit WBS, rates, effort and submit approvals' },
  Viewer:      { icon: Eye,    color: 'text-muted-foreground bg-gray-400/10',    desc: 'Read-only access to all project data' },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ['project-members', projectId],
    enabled: !!projectId,
    queryFn: async () => fetchProjectMembers(projectId!),
  });
}

function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectRole }) => {
      await updateMemberRole(projectId, userId, role);
    },
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ['project-members', projectId] }),
  });
}

function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await removeMember(projectId, userId);
    },
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ['project-members', projectId] }),
  });
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('Contributor');
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();
  const qc = useQueryClient();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addMemberByEmail(projectId, email.trim(), role);
      success('Member added', `${email} added as ${role}`);
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      onClose();
    } catch (err: unknown) {
      toastError('Could not add member', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <p className="text-xs text-brand-300">The user must have an existing S3T account with this email address.</p>
      </div>
      <div>
        <label className="label">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
          <input className="input pl-9" type="email" placeholder="user@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
      </div>
      <div>
        <label className="label">Role</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_CONFIG) as ProjectRole[]).map(r => (
            <button
              key={r} type="button"
              onClick={() => setRole(r)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                role === r
                  ? 'border-brand-500/50 bg-brand-500/10'
                  : 'border-border hover:border-input bg-card'
              )}
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', ROLE_CONFIG[r].color)}>
                {(() => { const Icon = ROLE_CONFIG[r].icon; return <Icon className="w-3.5 h-3.5" />; })()}
              </div>
              <p className="text-xs font-bold text-foreground">{r}</p>
              <p className="text-[9px] text-muted-foreground/80 mt-0.5 leading-relaxed">{ROLE_CONFIG[r].desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Adding…' : 'Add to Project'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function UserManagementPage() {
  const { activeProject } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingRole, setEditingRole] = useState<{ userId: string; current: ProjectRole } | null>(null);

  const { data: members = [], isLoading } = useProjectMembers(activeProject?.id ?? null);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const filtered = members.filter(m =>
    !search ||
    (m.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleRoleChange(userId: string, role: ProjectRole) {
    if (!activeProject) return;
    try {
      await updateRole.mutateAsync({ projectId: activeProject.id, userId, role });
      success('Role updated', `Changed to ${role}`);
      setEditingRole(null);
    } catch (err: unknown) {
      toastError('Update failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!activeProject) return;
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await removeMember.mutateAsync({ projectId: activeProject.id, userId });
      success('Member removed', name);
    } catch (err: unknown) {
      toastError('Remove failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a project to manage its members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(ROLE_CONFIG) as [ProjectRole, typeof ROLE_CONFIG[ProjectRole]][]).map(([role, cfg]) => (
          <div key={role} className="glass p-3 rounded-xl flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
              {(() => { const Icon = cfg.icon; return <Icon className="w-4 h-4" />; })()}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{role}</p>
              <p className="text-[9px] text-muted-foreground/80 leading-relaxed">{cfg.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
        <input className="input pl-9" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Members list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Members</p>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground/80 text-sm">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground/80 text-sm">
            {search ? 'No members match your search.' : 'No members yet. Click "Add Member" to get started.'}
          </div>
        ) : (
          <div className="divide-y divide-surface-600">
            {filtered.map(member => {
              const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.Viewer;
              const Icon = cfg.icon;
              const name = member.profiles?.full_name ?? 'Unknown User';
              const isCurrentUser = member.user_id === currentUser?.id;

              return (
                <div key={member.user_id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-400 bg-brand-400/10 px-1.5 py-0.5 rounded">You</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 truncate">{member.profiles?.job_title ?? 'No title set'}</p>
                  </div>

                  {/* Role */}
                  <div className="shrink-0">
                    {editingRole?.userId === member.user_id ? (
                      <div className="flex gap-1">
                        {(Object.keys(ROLE_CONFIG) as ProjectRole[]).map(r => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member.user_id, r)}
                            className={cn(
                              'px-2 py-1 rounded-lg text-[10px] font-bold transition-colors',
                              r === member.role ? 'bg-brand-600 text-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/50'
                            )}
                          >
                            {r}
                          </button>
                        ))}
                        <button onClick={() => setEditingRole(null)} className="px-2 py-1 rounded-lg text-[10px] text-gray-600 hover:text-muted-foreground">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !isCurrentUser && setEditingRole({ userId: member.user_id, current: member.role })}
                        disabled={isCurrentUser}
                        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors', cfg.color,
                          !isCurrentUser && 'hover:ring-1 hover:ring-white/10 cursor-pointer',
                          isCurrentUser && 'cursor-default opacity-70'
                        )}
                        title={isCurrentUser ? "Can't change your own role" : 'Click to change role'}
                      >
                        <Icon className="w-3 h-3" />
                        {member.role}
                      </button>
                    )}
                  </div>

                  {/* Remove */}
                  {!isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.user_id, name)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Remove from project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Add Project Member" size="lg">
        <InviteModal projectId={activeProject.id} onClose={() => setShowInvite(false)} />
      </Modal>
    </div>
  );
}
