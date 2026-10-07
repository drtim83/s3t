import { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useAuthStore } from '../../store';
import { cn } from '../../lib/utils';

// Minimal type for display purposes
interface OrgOption { id: string; name: string; slug: string; }

// For now we derive org from the user's profile
// In a full SaaS setup this would be an org switcher with useOrgs()
export function OrgSwitcher({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);

  const orgName = 'S3T Enterprise';
  const orgInitial = orgName.charAt(0).toUpperCase();

  // In future: fetch all orgs the user belongs to and allow switching
  const orgs: OrgOption[] = [
    { id: user?.org_id ?? '1', name: orgName, slug: 's3t' },
  ];

  if (collapsed) {
    return (
      <div className="flex justify-center py-2 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-sm">
          {orgInitial}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 border-b border-border relative">
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 px-2 mb-1">Organisation</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
      >
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-black shrink-0">
          {orgInitial}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">{orgName}</p>
          <p className="text-[9px] text-muted-foreground/80">Workspace</p>
        </div>
        <ChevronDown className={cn('w-3 h-3 text-muted-foreground/80 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="py-1">
              {orgs.map(org => (
                <button key={org.id}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary text-left"
                >
                  <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-black shrink-0">
                    {org.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate flex-1">{org.name}</span>
                  <Check className="w-3 h-3 text-brand-400 shrink-0" />
                </button>
              ))}
            </div>
            <div className="border-t border-border p-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-muted-foreground/80 hover:text-foreground/80 transition-colors text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>New organisation</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
