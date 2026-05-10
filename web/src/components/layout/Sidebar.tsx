import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTree, Users, MessageSquare, LogOut,
  ChevronLeft, ChevronRight, Zap, Briefcase, Calculator,
  TrendingUp, LineChart, FileCheck, Globe, Settings2, FileText,
  CalendarDays, BarChart2, Workflow, HelpCircle,
} from 'lucide-react';
import { useUIStore } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { ProjectSwitcher } from './ProjectSwitcher';
import { OrgSwitcher } from './OrgSwitcher';

const coreNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/config',      icon: Settings2,       label: 'Project Config' },
  { to: '/rates',       icon: Briefcase,       label: 'Rate Card' },
  { to: '/effort',      icon: Users,           label: 'Effort Plan' },
  { to: '/summary',     icon: Calculator,      label: 'P&L Summary' },
  { to: '/procurement', icon: FileText,        label: 'Procurement' },
  { to: '/analytics',   icon: TrendingUp,      label: 'Analytics' },
  { to: '/simulator',   icon: LineChart,       label: 'Simulator' },
  { to: '/approval',    icon: FileCheck,       label: 'Approval' },
  { to: '/forex',       icon: Globe,           label: 'Forex' },
];

const utilNav = [
  { to: '/wbs',           icon: ListTree,     label: 'WBS Editor' },
  { to: '/gantt',         icon: CalendarDays, label: 'Gantt Chart' },
  { to: '/wbs-analytics', icon: BarChart2,    label: 'WBS Analytics' },
  { to: '/workflow',      icon: Workflow,     label: 'Workflow' },
  { to: '/discussions',   icon: MessageSquare, label: 'Discussions' },
  { to: '/help',          icon: HelpCircle,  label: 'Help & Guide' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/auth/login');
  }

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(isActive ? 'nav-item-active' : 'nav-item', !sidebarOpen && 'justify-center px-0')
      }
      title={!sidebarOpen ? label : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {sidebarOpen && <span className="truncate animate-fade-in text-sm">{label}</span>}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-surface-800 border-r border-surface-600 transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-56' : 'w-14'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-surface-600', !sidebarOpen && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">S3T</p>
            <p className="text-gray-500 text-[10px] truncate leading-tight">Solution Sizing & Scoping</p>
          </div>
        )}
      </div>

      {/* Org Switcher */}
      <OrgSwitcher collapsed={!sidebarOpen} />

      {/* Project Switcher */}
      <ProjectSwitcher collapsed={!sidebarOpen} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Core E3T tools */}
        {coreNav.map(item => <NavItem key={item.to} {...item} />)}

        {/* Divider */}
        <div className={cn('my-2 border-t border-surface-600', !sidebarOpen && 'mx-2')} />

        {/* Utility tools */}
        {utilNav.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* User */}
      <div className={cn('px-2 py-3 border-t border-surface-600', !sidebarOpen && 'px-1')}>
        <div className={cn('flex items-center gap-2.5', !sidebarOpen && 'justify-center')}>
          <Avatar name={user?.full_name} src={user?.avatar_url} size="sm" className="shrink-0" />
          {sidebarOpen && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name ?? 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.job_title ?? 'Member'}</p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={handleSignOut} className="text-gray-500 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Footer attribution */}
      {sidebarOpen && (
        <div className="px-3 pb-3">
          <p className="text-[9px] text-gray-600 text-center leading-relaxed">
            S3T v1.0 · Dr Ming Chan Tok<br/>© 1 May 2026
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface-600 border border-surface-500 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-600 transition-all duration-200 z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </aside>
  );
}
