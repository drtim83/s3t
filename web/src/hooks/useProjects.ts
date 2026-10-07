import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/database.types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const projectKeys = {
  all:    (orgId: string)         => ['projects', orgId] as const,
  detail: (projectId: string)     => ['project', projectId] as const,
  stats:  (projectId: string)     => ['project-stats', projectId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────
// Fetch all projects this user can see (via RLS — member OR creator)
export function useMyProjects() {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProjects(orgId: string | null) {
  return useQuery({
    queryKey: projectKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single();
      if (error) throw error;
      return data as Project;
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      const { data, error } = await supabase.from('projects').insert(payload).select().single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.all(data.org_id) });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: projectKeys.all(data.org_id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}

export function useCloneProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, newName, isTemplate }: { sourceId: string; newName: string; isTemplate: boolean }) => {
      const { data, error } = await supabase.rpc('clone_project', {
        source_id: sourceId,
        new_name: newName,
        p_is_template: isTemplate
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}
