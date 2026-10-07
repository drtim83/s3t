import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Discussion } from '../lib/database.types';

export const discussionKeys = {
  all: (wbsId: string) => ['discussions', wbsId] as const,
};

export function useDiscussions(wbsElementId: string | null) {
  return useQuery({
    queryKey: discussionKeys.all(wbsElementId ?? ''),
    enabled: !!wbsElementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussions')
        .select('*, author:profiles!author_id(id, full_name, avatar_url)')
        .eq('wbs_element_id', wbsElementId!)
        .is('parent_comment_id', null)
        .order('created_at');
      if (error) throw error;

      // Fetch replies in parallel
      const withReplies = await Promise.all(
        (data as Discussion[]).map(async (comment) => {
          const { data: replies } = await supabase
            .from('discussions')
            .select('*, author:profiles!author_id(id, full_name, avatar_url)')
            .eq('parent_comment_id', comment.id)
            .order('created_at');
          return { ...comment, replies: (replies ?? []) as Discussion[] };
        })
      );
      return withReplies;
    },
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Discussion>) => {
      const { data, error } = await supabase.from('discussions').insert(payload).select().single();
      if (error) throw error;
      return data as Discussion;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: discussionKeys.all(data.wbs_element_id) });
    },
  });
}

export function useDeleteDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, wbsElementId }: { id: string; wbsElementId: string }) => {
      const { error } = await supabase.from('discussions').delete().eq('id', id);
      if (error) throw error;
      return { id, wbsElementId };
    },
    onSuccess: ({ wbsElementId }) => {
      qc.invalidateQueries({ queryKey: discussionKeys.all(wbsElementId) });
    },
  });
}
