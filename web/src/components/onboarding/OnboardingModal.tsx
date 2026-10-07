import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Shield, Briefcase, CheckSquare, Eye, Zap, LayoutDashboard, ListTree, FileCheck, BarChart2, Users, BookOpen } from 'lucide-react';

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'Admin',
    icon: Shield,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Admin',
    subtitle: 'Full platform access',
    description: 'Administrators have unrestricted access to all features. They manage users, organizations, projects, and system settings.',
    can: [
      'Create & delete organizations and projects',
      'Manage all user accounts and assign roles',
      'Access all data across every project',
      'Configure system settings and integrations',
      'View audit logs and compliance reports',
    ],
    startHere: '/users',
    startLabel: 'User Management',
    startIcon: Users,
  },
  {
    id: 'PM',
    icon: Briefcase,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Pre Sales Solution Architect',
    subtitle: 'Plan, estimate & track projects',
    description: 'Users are the primary creators in S3T. They create projects, build the WBS, manage the team, and submit deliverables for approval.',
    can: [
      'Create and configure projects',
      'Build & edit the Work Breakdown Structure (WBS)',
      'Set rate cards, effort plans, and P&L summary',
      'Assign team members and manage resources',
      'Submit scope documents for Approver review',
      'View Gantt charts, analytics, and Forex rates',
    ],
    startHere: '/dashboard',
    startLabel: 'Dashboard',
    startIcon: LayoutDashboard,
  },
  {
    id: 'Approver',
    icon: CheckSquare,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Approver',
    subtitle: 'Review and sign off deliverables',
    description: 'Approvers review scope documents, WBS submissions, and project milestones. They can approve or reject with comments.',
    can: [
      'Review all submitted scope documents',
      'Approve or reject WBS and project plans',
      'Add review comments and feedback',
      'View project summary and P&L reports',
      'Track approval history and status',
    ],
    startHere: '/approval',
    startLabel: 'Approval Queue',
    startIcon: FileCheck,
  },
  {
    id: 'Auditor',
    icon: Eye,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Auditor',
    subtitle: 'Read-only access for compliance',
    description: 'Auditors have read-only access to all project data, reports, and audit logs. They cannot create or modify anything.',
    can: [
      'View all projects and WBS elements',
      'Access P&L summaries and financial reports',
      'Review audit logs and change history',
      'Export analytics and compliance reports',
      'View all discussions and comments',
    ],
    startHere: '/analytics',
    startLabel: 'Analytics',
    startIcon: BarChart2,
  },
];

// ── Onboarding steps per role ─────────────────────────────────────────────────
const PM_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Start at your Dashboard',
    body: 'The Dashboard shows all your active projects at a glance. We have pre-loaded some sample data for you! Click around the dummy projects to explore.',
  },
  {
    icon: ListTree,
    title: 'Build your WBS',
    body: 'Go to WBS Editor → explore the sample Work Breakdown Structure. Then try adding your own phases, tasks, and sub-tasks.',
  },
  {
    icon: Briefcase,
    title: 'Set Rate Cards & Effort',
    body: 'Under Rate Card, check out the pre-populated billing rates. Then use the Effort Plan page to allocate team hours.',
  },
  {
    icon: FileCheck,
    title: 'Submit for Approval',
    body: 'Once your plan is ready, go to Approval to submit your scope document. Your Approver will be notified.',
  },
];

const APPROVER_STEPS = [
  {
    icon: FileCheck,
    title: 'Check your Approval queue',
    body: 'Go to Approval → you\'ll see some sample submitted scope documents waiting for your review.',
  },
  {
    icon: CheckSquare,
    title: 'Review & decide',
    body: 'Open a submission to read the full scope. Add comments, then click Approve or Reject to see how it works.',
  },
];

const AUDITOR_STEPS = [
  {
    icon: BarChart2,
    title: 'Start with Analytics',
    body: 'Analytics gives you a full overview of all projects — check out the dummy data we loaded to see budget, progress, and team utilization.',
  },
  {
    icon: BookOpen,
    title: 'Browse project data',
    body: 'Use the sidebar to navigate to any project\'s WBS, P&L Summary, or Discussions. Everything is read-only.',
  },
];

const ADMIN_STEPS = [
  {
    icon: Users,
    title: 'Manage Users first',
    body: 'Go to User Management to invite team members and assign roles (Admin, PM, Approver, or Auditor).',
  },
  {
    icon: LayoutDashboard,
    title: 'Create your Organization\'s first Project',
    body: 'Head to the Dashboard and click "+ New Project". Fill in the project name, dates, and budget.',
  },
];

const ROLE_STEPS: Record<string, typeof PM_STEPS> = {
  Admin: ADMIN_STEPS,
  PM: PM_STEPS,
  Approver: APPROVER_STEPS,
  Auditor: AUDITOR_STEPS,
  Contributor: PM_STEPS,
  Viewer: AUDITOR_STEPS,
};

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

export function OnboardingModal({ open, onClose, userRole = 'PM', userName }: OnboardingModalProps) {
  const [step, setStep] = useState(0); // 0 = role overview, 1+ = steps
  if (!open) return null;

  const role = ROLES.find(r => r.id === userRole) ?? ROLES.find(r => r.id === 'PM')!;
  const steps = ROLE_STEPS[userRole] ?? PM_STEPS;
  const totalSteps = steps.length + 1; // +1 for overview
  const isOverview = step === 0;
  const currentStep = isOverview ? null : steps[step - 1];

  const RoleIcon = role.icon;
  const StepIcon = currentStep?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg card shadow-card-hover animate-slide-up overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {isOverview ? (
            /* ── Role overview ───────────────────────────────────────────────── */
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${role.bg} border ${role.border} flex items-center justify-center`}>
                  <RoleIcon className={`w-7 h-7 ${role.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                      <Zap className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-primary">S3T Platform</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                  </h2>
                  <p className="text-sm text-muted-foreground">Your role: <span className={`font-semibold ${role.color}`}>{role.title}</span></p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What you can do</p>
                {role.can.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className={`p-3.5 rounded-lg ${role.bg} border ${role.border}`}>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Start here →</span>{' '}
                  Head to <span className={`font-semibold ${role.color}`}>{role.startLabel}</span> in the sidebar to begin.
                </p>
              </div>
            </div>
          ) : (
            /* ── Step-by-step guide ──────────────────────────────────────────── */
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Step {step} of {steps.length}
                </p>
                {StepIcon && (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <StepIcon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">{currentStep?.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{currentStep?.body}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              className="btn-ghost btn-sm"
            >
              {step === 0 ? 'Skip' : <><ChevronLeft className="w-3.5 h-3.5" /> Back</>}
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-primary w-4' : 'bg-border'}`} />
              ))}
            </div>

            {step < totalSteps - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary btn-sm">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={onClose} className="btn-primary btn-sm">
                Get started <Zap className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
