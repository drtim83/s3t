import { BookOpen, Zap, LayoutDashboard, Briefcase, Users, Calculator, TrendingUp, LineChart, FileCheck, Globe, Settings2, FileText, ListTree, CalendarDays, BarChart2, Workflow, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: '🎯 S3T Core — Financial Sizing',
    color: 'border-brand-500/30 bg-brand-500/5',
    items: [
      { icon: Settings2,      route: '/config',       label: 'Project Config',  desc: 'Set engagement timeline, currency, discount %, allowance %, and risk reserve for the project.' },
      { icon: Briefcase,      route: '/rates',        label: 'Rate Card',       desc: 'Manage job codes, list prices, cost prices. All revenue calculations flow from here.' },
      { icon: Users,          route: '/effort',       label: 'Effort Plan',     desc: 'Assign resources to months (person-months matrix). Add per diem, travel, stay, and COLA costs.' },
      { icon: Calculator,     route: '/summary',      label: 'P&L Summary',     desc: 'Auto-calculated Revenue, Cost, and Margin using: Sell = List × (1 − Discount) × (1 + Allowance).' },
      { icon: FileText,       route: '/procurement',  label: 'Procurement',     desc: 'Track software, cloud, and 3rd-party expenses. Attach supporting documents.' },
      { icon: TrendingUp,     route: '/analytics',    label: 'Analytics',       desc: 'Yield bar charts, YoY trends, margin efficiency ranking, and revenue share by category.' },
      { icon: LineChart,      route: '/simulator',    label: 'Simulator',       desc: 'Move sliders for discount/allowance/risk and see live P&L delta vs actuals.' },
      { icon: FileCheck,      route: '/approval',     label: 'Approval',        desc: 'Dual sign-off governance gates. Document business case, solution approach, and risks.' },
      { icon: Globe,          route: '/forex',        label: 'Forex',           desc: 'Live exchange rates. Convert TCV to USD, SGD, EUR, or any currency for client proposals.' },
    ],
  },
  {
    title: '📐 Project Delivery — WBS & Planning',
    color: 'border-cyan-500/30 bg-cyan-500/5',
    items: [
      { icon: LayoutDashboard, route: '/dashboard',     label: 'Dashboard',       desc: 'Executive summary: WBS completion %, overdue items, financial KPIs. Clickable to drill down.' },
      { icon: ListTree,        route: '/wbs',           label: 'WBS Editor',      desc: 'Build your Work Breakdown Structure tree. Set codes, phases, effort hours, and dates.' },
      { icon: CalendarDays,    route: '/gantt',         label: 'Gantt Chart',     desc: 'Auto-generated timeline from WBS start/end dates. Hover bars for task details.' },
      { icon: BarChart2,       route: '/wbs-analytics', label: 'WBS Analytics',   desc: 'Effort by phase, effort by WBS level, status pie, and budget burn health bars.' },
      { icon: Workflow,        route: '/workflow',      label: 'Workflow',        desc: 'Set up WHEN/THEN automation rules. Trigger email notifications on status changes.' },
    ],
  },
];

const gettingStarted = [
  { step: '1', text: 'Select or create a **Project** using the switcher in the sidebar' },
  { step: '2', text: 'Go to **Project Config** → set timeline, currency, and commercial terms' },
  { step: '3', text: 'Go to **Rate Card** → add or edit job codes and prices' },
  { step: '4', text: 'Go to **Effort Plan** → assign resources across months' },
  { step: '5', text: 'Go to **P&L Summary** → review calculated revenue, cost, and margin' },
  { step: '6', text: 'Use **Simulator** to test discount/allowance scenarios' },
  { step: '7', text: 'Use **Approval** to document the business case and get dual sign-off' },
  { step: '8', text: 'Use **WBS Editor** → add delivery tasks with dates → view on **Gantt Chart**' },
];

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">S3T — Solution Sizing & Scoping Tool</h1>
          <p className="text-gray-400 mt-1 text-sm">User Guide · Created by Dr Ming Chan Tok · 1 May 2026</p>
        </div>
      </div>

      {/* What is S3T */}
      <div className="glass p-6 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white">What is S3T?</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          S3T is an enterprise financial sizing and project scoping tool. It replaces manual Excel-based estimation workbooks with a real-time, web-based platform. Start by building a <strong className="text-white">Rate Card</strong>, assign resources in the <strong className="text-white">Effort Plan</strong>, and the <strong className="text-white">P&L Summary</strong> automatically computes your revenue, cost, and margin. Use the <strong className="text-white">Simulator</strong> to model scenarios, and the <strong className="text-white">Approval</strong> module for governance sign-off.
        </p>
      </div>

      {/* Getting Started */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">⚡ Getting Started (Recommended Flow)</h2>
        <div className="space-y-2">
          {gettingStarted.map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600/30 text-brand-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <p className="text-sm text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Feature sections */}
      {sections.map(section => (
        <div key={section.title} className={`card p-6 space-y-4 border ${section.color}`}>
          <h2 className="text-sm font-bold text-white">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.items.map(item => (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center shrink-0 group-hover:bg-brand-600/20 transition-colors">
                  <item.icon className="w-4 h-4 text-gray-400 group-hover:text-brand-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{item.label}</p>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-center py-4 border-t border-surface-600">
        <p className="text-xs text-gray-600">S3T v1.0 · Created by Dr Ming Chan Tok · © 1 May 2026 · Built on React + Supabase + Netlify</p>
      </div>
    </div>
  );
}
