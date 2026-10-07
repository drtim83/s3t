import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { SharedProject, SharedWBSElement } from '../lib/database.types';
import { Zap, Clock, TrendingUp, Users } from 'lucide-react';

export function SharedProjectView() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const { data, error: err } = await supabase.rpc('get_shared_project', { p_token: token });
        if (err) throw err;
        if (!data) throw new Error('Project not found or link has expired');
        setProject(data as unknown as SharedProject);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  const stats = useMemo(() => {
    if (!project?.wbs) return { totalHours: 0, count: 0 };
    const wbs = project.wbs;
    return {
      totalHours: wbs.reduce((acc, el) => acc + (el.effort_hours || 0), 0),
      count: wbs.length
    };
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse shadow-xl shadow-brand-500/20 mb-6">
          <Zap className="w-6 h-6 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Loading Proposal...</h2>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">{error || 'This link is invalid or has expired.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-500/30">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Zap className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-tight">S3T Scope Viewer</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Client Portal</p>
            </div>
          </div>
          <div className="badge badge-brand">
            Shared Proposal
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{project.name}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            {project.description || 'Review the scope of work and deliverables proposed for this engagement.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total Effort</p>
              <p className="text-3xl font-black mt-1">{stats.totalHours.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">hrs</span></p>
            </div>
          </div>
          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">WBS Elements</p>
              <p className="text-3xl font-black mt-1">{stats.count}</p>
            </div>
          </div>
          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Status</p>
              <p className="text-xl font-bold mt-2 capitalize">{project.status}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Scope Breakdown</h2>
          <div className="card overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="table w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">WBS Code</th>
                    <th className="px-6 py-4 font-semibold">Phase & Activity</th>
                    <th className="px-6 py-4 font-semibold text-right">Effort (Hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {project.wbs.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No WBS elements found.</td></tr>
                  ) : project.wbs.map((el: SharedWBSElement) => (
                    <tr key={el.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-brand-400">{el.wbs_code}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{el.name}</p>
                        {el.description && <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{el.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">{el.effort_hours || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
