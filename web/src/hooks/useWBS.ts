import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWBSElements,
  fetchWBSElement,
  createWBSElementDoc,
  updateWBSElementDoc,
  deleteWBSElementDoc,
} from '../lib/firestoreService';
import type { WBSElement } from '../lib/database.types';
import { buildWBSTree } from '../lib/utils';

export const wbsKeys = {
  all:    (projectId: string) => ['wbs', projectId] as const,
  detail: (wbsId: string)     => ['wbs-item', wbsId] as const,
};

export function useWBSElements(projectId: string | null) {
  return useQuery({
    queryKey: wbsKeys.all(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async () => fetchWBSElements(projectId!),
    select: (data) => ({
      flat: data,
      tree: buildWBSTree(data),
    }),
  });
}

export function useWBSElement(wbsId: string | null) {
  return useQuery({
    queryKey: wbsKeys.detail(wbsId ?? ''),
    enabled: !!wbsId,
    queryFn: async () => fetchWBSElement(wbsId!),
  });
}

export function useCreateWBSElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WBSElement>) => {
      return createWBSElementDoc(payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: wbsKeys.all(data.project_id) });
    },
  });
}

export function useUpdateWBSElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<WBSElement> & { id: string }) => {
      return updateWBSElementDoc(id, payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: wbsKeys.all(data.project_id) });
      qc.invalidateQueries({ queryKey: wbsKeys.detail(data.id) });
    },
  });
}

export function useDeleteWBSElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      return deleteWBSElementDoc(id, projectId);
    },
    onSuccess: ({ projectId }) => {
      qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
}
