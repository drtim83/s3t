import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/RouteGuards';
import { useNotifStore } from './store';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { WBSEditorPage } from './components/wbs/WBSEditorPage';
import { DiscussionsPage } from './components/discussions/DiscussionsPage';
import { RatesPage } from './components/rates/RatesPage';
import { EffortPage } from './components/effort/EffortPage';
import { SummaryPage } from './components/summary/SummaryPage';
import { ProcurementPage } from './components/procurement/ProcurementPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { SimulatorPage } from './components/simulator/SimulatorPage';
import { ApprovalPage } from './components/approval/ApprovalPage';
import { ForexPage } from './components/forex/ForexPage';
import { ProjectConfigPage } from './components/project/ProjectConfigPage';
import { GanttPage } from './components/gantt/GanttPage';
import { WBSAnalyticsPage } from './components/analytics/WBSAnalyticsPage';
import { WorkflowPage } from './components/workflow/WorkflowPage';
import { HelpPage } from './components/help/HelpPage';
import { AISOWParserPage } from './components/ai/AISOWParserPage';
import { UserManagementPage } from './components/users/UserManagementPage';
import { NotFoundPage } from './pages/PlaceholderPages';
import { useAuth } from './hooks/useAuth';
import { SharedProjectView } from './pages/SharedProjectView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,
      retry:            1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Global Mutation Error:', error);
      useNotifStore.getState().addToast({
        type: 'error',
        title: 'Operation failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Global Query Error:', error);
      useNotifStore.getState().addToast({
        type: 'error',
        title: 'Data load failed',
        message: error instanceof Error ? error.message : 'Could not fetch data',
      });
    },
  }),
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Public auth routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/auth/login"           element={<LoginPage />} />
              <Route path="/auth/signup"          element={<SignupPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Shared routes */}
            <Route path="/share/:token" element={<SharedProjectView />} />

            {/* Protected S3T app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Core S3T tools */}
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/config"       element={<ProjectConfigPage />} />
                <Route path="/rates"        element={<RatesPage />} />
                <Route path="/effort"       element={<EffortPage />} />
                <Route path="/summary"      element={<SummaryPage />} />
                <Route path="/procurement"  element={<ProcurementPage />} />
                <Route path="/analytics"    element={<AnalyticsPage />} />
                <Route path="/simulator"    element={<SimulatorPage />} />
                <Route path="/approval"     element={<ApprovalPage />} />
                <Route path="/forex"        element={<ForexPage />} />
                {/* Utility tools */}
                <Route path="/wbs"          element={<WBSEditorPage />} />
                <Route path="/gantt"         element={<GanttPage />} />
                <Route path="/wbs-analytics" element={<WBSAnalyticsPage />} />
                <Route path="/workflow"       element={<WorkflowPage />} />
                <Route path="/help"           element={<HelpPage />} />
                <Route path="/ai-parser"      element={<AISOWParserPage />} />
                <Route path="/users"          element={<UserManagementPage />} />
                <Route path="/discussions"  element={<DiscussionsPage />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<NotFoundPage />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
