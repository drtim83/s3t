import { cn, getStatusClass, getStatusLabel } from '../../lib/utils';
import type { WBSStatus } from '../../lib/database.types';

interface StatusBadgeProps {
  status: WBSStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(getStatusClass(status), className)}>
      {getStatusLabel(status)}
    </span>
  );
}

interface StatusSelectProps {
  value: WBSStatus;
  onChange: (v: WBSStatus) => void;
  className?: string;
}

const ALL_STATUSES: WBSStatus[] = [
  'not_started', 'in_progress', 'blocked', 'completed', 'cancelled',
];

export function StatusSelect({ value, onChange, className }: StatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as WBSStatus)}
      className={cn('input py-1.5 text-xs', className)}
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>{getStatusLabel(s)}</option>
      ))}
    </select>
  );
}
