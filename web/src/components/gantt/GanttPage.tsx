import { useUIStore } from '../../store';
import { useWBSElements } from '../../hooks/useWBS';
import { GanttChart } from './GanttChart';
import { CalendarDays, AlertCircle } from 'lucide-react';

export function GanttPage() {
  const { activeProject } = useUIStore();
  const { data, isLoading } = useWBSElements(activeProject?.id ?? null);
  const flat = data?.flat ?? [];

  const withDates = flat.filter(e => e.start_date && e.end_date);
  const withoutDates = flat.filter(e => !e.start_date || !e.end_date);

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Gantt Chart</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a project to view the Gantt chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gantt Chart & Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeProject.name} · {withDates.length} of {flat.length} elements have dates
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          <CalendarDays className="w-4 h-4" />
          {activeProject.start_date && (
            <span>{new Date(activeProject.start_date).toLocaleDateString()} → {activeProject.end_date ? new Date(activeProject.end_date).toLocaleDateString() : 'Open-ended'}</span>
          )}
        </div>
      </div>

      {withoutDates.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            <span className="font-bold">{withoutDates.length} element{withoutDates.length !== 1 ? 's' : ''}</span> without start/end dates won't appear on the chart:&nbsp;
            {withoutDates.slice(0, 5).map(e => e.wbs_code).join(', ')}{withoutDates.length > 5 ? ` + ${withoutDates.length - 5} more` : ''}
          </p>
        </div>
      )}

      <div className="card p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <GanttChart
            elements={flat}
            projectStart={activeProject.start_date}
            projectEnd={activeProject.end_date}
          />
        )}
      </div>
    </div>
  );
}
