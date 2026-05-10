import { useState } from 'react';
import { MessageSquare, Send, Trash2, Reply, ChevronDown, ChevronRight } from 'lucide-react';
import { useUIStore, useAuthStore, useToast } from '../../store';
import { useWBSElements } from '../../hooks/useWBS';
import { useDiscussions, useCreateDiscussion, useDeleteDiscussion } from '../../hooks/useDiscussions';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Spinner';
import { formatRelative } from '../../lib/utils';
import type { Discussion, WBSElement } from '../../lib/database.types';

// ─── Single comment thread ────────────────────────────────────────────────────
interface CommentProps {
  comment: Discussion;
  wbsElementId: string;
  depth?: number;
}

function Comment({ comment, wbsElementId, depth = 0 }: CommentProps) {
  const { user } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const createDiscussion = useCreateDiscussion();
  const deleteDiscussion = useDeleteDiscussion();
  const { success } = useToast();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    await createDiscussion.mutateAsync({
      wbs_element_id: wbsElementId,
      parent_comment_id: comment.id,
      body: replyText.trim(),
      author_id: user!.id,
    });
    setReplyText('');
    setShowReply(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    await deleteDiscussion.mutateAsync({ id: comment.id, wbsElementId });
    success('Comment deleted');
  }

  const isOwner = user?.id === comment.author_id;
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  return (
    <div className={`${depth > 0 ? 'ml-10 border-l-2 border-surface-600 pl-4' : ''}`}>
      <div className="flex gap-3 py-3 group">
        <Avatar name={comment.author?.full_name} src={comment.author?.avatar_url} size="sm" className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{comment.author?.full_name ?? 'Unknown'}</span>
            <span className="text-xs text-gray-500">{formatRelative(comment.created_at)}</span>
            {comment.is_edited && <span className="text-xs text-gray-600">(edited)</span>}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
          <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {depth === 0 && (
              <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-400 transition-colors">
                <Reply className="w-3 h-3" /> Reply
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
            {hasReplies && (
              <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
                {showReplies ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          {showReply && (
            <form onSubmit={handleReply} className="flex gap-2 mt-3">
              <input
                className="input text-xs py-1.5 flex-1"
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary btn-sm" disabled={createDiscussion.isPending}>
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      </div>
      {showReplies && hasReplies && comment.replies!.map(reply => (
        <Comment key={reply.id} comment={reply} wbsElementId={wbsElementId} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── Discussion Panel for a WBS element ──────────────────────────────────────
interface DiscussionPanelProps { wbsElement: WBSElement; }

function DiscussionPanel({ wbsElement }: DiscussionPanelProps) {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useDiscussions(wbsElement.id);
  const createDiscussion = useCreateDiscussion();
  const [body, setBody] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    await createDiscussion.mutateAsync({
      wbs_element_id: wbsElement.id,
      body: body.trim(),
      author_id: user.id,
    });
    setBody('');
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-brand-400" />
        <h3 className="font-semibold text-white">Discussion</h3>
        <span className="badge-gray text-xs">{wbsElement.wbs_code} — {wbsElement.name}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No comments yet. Start the discussion!</p>
      ) : (
        <div className="divide-y divide-surface-700">
          {(comments ?? []).map(comment => (
            <Comment key={comment.id} comment={comment} wbsElementId={wbsElement.id} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 pt-2 border-t border-surface-600">
        <Avatar name={user?.full_name} src={user?.avatar_url} size="sm" className="shrink-0 mt-1" />
        <div className="flex-1 flex gap-2">
          <textarea
            className="input resize-none flex-1"
            rows={2}
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e); }}
          />
          <button type="submit" className="btn-primary self-end" disabled={!body.trim() || createDiscussion.isPending}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Discussions Page ─────────────────────────────────────────────────────────
export function DiscussionsPage() {
  const { activeProject } = useUIStore();
  const { data, isLoading } = useWBSElements(activeProject?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const flat = data?.flat ?? [];
  const selected = flat.find(e => e.id === selectedId);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-gray-500">Select a project to view discussions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Discussions</h1>
        <p className="text-gray-400 text-sm mt-1">Comments tied to specific WBS elements · {activeProject.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WBS Element list */}
        <div className="card p-4 space-y-2 h-fit lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">WBS Elements</p>
          {isLoading ? (
            <div className="space-y-2">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : flat.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No WBS elements yet.</p>
          ) : flat.map(el => (
            <button
              key={el.id}
              onClick={() => setSelectedId(el.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                selectedId === el.id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-gray-400 hover:bg-surface-700 hover:text-white'
              }`}
            >
              <code className="text-xs text-brand-400 mr-2">{el.wbs_code}</code>
              <span className="truncate">{el.name}</span>
            </button>
          ))}
        </div>

        {/* Discussion panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <DiscussionPanel wbsElement={selected} />
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center gap-4 h-80">
              <MessageSquare className="w-10 h-10 text-gray-600" />
              <div>
                <p className="text-white font-medium">Select a WBS element</p>
                <p className="text-gray-500 text-sm mt-1">Choose an element from the list to view its discussion thread</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
