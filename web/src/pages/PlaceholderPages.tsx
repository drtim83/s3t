import { FolderKanban, FileText, Users, Settings } from 'lucide-react';

function Placeholder({ title, icon: Icon, desc }: { title: string; icon: React.ElementType; desc: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <div className="card p-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground/80" />
        </div>
        <div>
          <p className="text-foreground font-semibold text-lg">{title}</p>
          <p className="text-muted-foreground/80 text-sm mt-1">{desc}</p>
        </div>
        <span className="badge-brand text-xs">Coming in Phase 3</span>
      </div>
    </div>
  );
}

export function ScopeDocsPage() {
  return <Placeholder title="Scope Documents" icon={FileText} desc="SOW management, versioning, and digital signature tracking." />;
}

export function MembersPage() {
  return <Placeholder title="Team Members" icon={Users} desc="Manage project members, roles, and permissions." />;
}

export function SettingsPage() {
  return <Placeholder title="Settings" icon={Settings} desc="Project settings, webhooks, and integrations." />;
}

export function NotFoundPage() {
  return <Placeholder title="404 — Not Found" icon={FolderKanban} desc="The page you're looking for doesn't exist." />;
}
