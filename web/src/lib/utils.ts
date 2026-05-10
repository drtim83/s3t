import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { WBSStatus, ProjectRole } from './database.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '—';
  if (hours >= 8) return `${(hours / 8).toFixed(1)}d`;
  return `${hours}h`;
}

export function getStatusLabel(status: WBSStatus): string {
  const map: Record<WBSStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}

export function getStatusClass(status: WBSStatus): string {
  const map: Record<WBSStatus, string> = {
    not_started: 'status-not_started',
    in_progress: 'status-in_progress',
    blocked: 'status-blocked',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };
  return map[status] ?? 'badge-gray';
}

export function getRoleBadge(role: ProjectRole): string {
  const map: Record<ProjectRole, string> = {
    Admin:       'badge-red',
    PM:          'badge-brand',
    Contributor: 'badge-cyan',
    Viewer:      'badge-gray',
  };
  return map[role] ?? 'badge-gray';
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function buildWBSTree<T extends { id: string; parent_id: string | null; children?: T[] }>(
  flat: T[]
): T[] {
  const map = new Map<string, T>();
  const roots: T[] = [];
  flat.forEach(item => { map.set(item.id, { ...item, children: [] }); });
  flat.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function flattenWBSTree<T extends { id: string; children?: T[] }>(
  tree: T[],
  result: T[] = []
): T[] {
  tree.forEach(node => {
    result.push(node);
    if (node.children?.length) flattenWBSTree(node.children, result);
  });
  return result;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
