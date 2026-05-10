import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wbs_elements')
        .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url)')
        .eq('project_id', projectId!)
        .order('sort_order');
      if (error) throw error;
      return data as WBSElement[];
    },
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wbs_elements')
        .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url)')
        .eq('id', wbsId!)
        .single();
      if (error) throw error;
      return data as WBSElement;
    },
  });
}

export function useCreateWBSElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WBSElement>) => {
      const { data, error } = await supabase.from('wbs_elements').insert(payload as any).select().single();
      if (error) throw error;
      return data as WBSElement;
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
      const { data, error } = await supabase.from('wbs_elements').update(payload as unknown as never).eq('id', id).select().single();
      if (error) throw error;
      return data as WBSElement;
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
      const { error } = await supabase.from('wbs_elements').delete().eq('id', id);
      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
}
