import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyProjects,
  fetchProjectsByOrg,
  fetchProject,
  createProjectDoc,
  updateProjectDoc,
  deleteProjectDoc,
  cloneProjectDoc,
} from '../lib/firestoreService';
import { useAuthStore } from '../store';
import type { Project } from '../lib/database.types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const projectKeys = {
  all:    (orgId: string)         => ['projects', orgId] as const,
  detail: (projectId: string)     => ['project', projectId] as const,
  stats:  (projectId: string)     => ['project-stats', projectId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────
export function useMyProjects() {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => fetchMyProjects(),
  });
}

export function useProjects(orgId: string | null) {
  return useQuery({
    queryKey: projectKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => fetchProjectsByOrg(orgId!),
  });
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async () => fetchProject(projectId!),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      return createProjectDoc(payload, user?.id);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.all(data.org_id) });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Project> & { id: string }) => {
      return updateProjectDoc(id, payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: projectKeys.all(data.org_id) });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteProjectDoc(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}

export function useCloneProject() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async ({ sourceId, newName, isTemplate }: { sourceId: string; newName: string; isTemplate: boolean }) => {
      return cloneProjectDoc(sourceId, newName, isTemplate, user?.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
}
