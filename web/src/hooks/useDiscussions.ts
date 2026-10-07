import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDiscussions,
  createDiscussionDoc,
  deleteDiscussionDoc,
} from '../lib/firestoreService';
import type { Discussion } from '../lib/database.types';

export const discussionKeys = {
  all: (wbsId: string) => ['discussions', wbsId] as const,
};

export function useDiscussions(wbsElementId: string | null) {
  return useQuery({
    queryKey: discussionKeys.all(wbsElementId ?? ''),
    enabled: !!wbsElementId,
    queryFn: async () => fetchDiscussions(wbsElementId!),
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Discussion>) => {
      return createDiscussionDoc(payload);
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
      await deleteDiscussionDoc(id);
      return { id, wbsElementId };
    },
    onSuccess: ({ wbsElementId }) => {
      qc.invalidateQueries({ queryKey: discussionKeys.all(wbsElementId) });
    },
  });
}
