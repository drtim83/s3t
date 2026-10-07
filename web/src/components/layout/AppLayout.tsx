import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { useAuthStore } from '../../store';

const ONBOARDING_KEY = 's3t-onboarding-seen';

export function AppLayout() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  const showOnboarding = Boolean(
    !dismissed &&
    user?.id &&
    typeof window !== 'undefined' &&
    !localStorage.getItem(`${ONBOARDING_KEY}-${user.id}`)
  );

  const handleCloseOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`${ONBOARDING_KEY}-${user.id}`, '1');
    }
    setDismissed(true);
  };

  // Derive role from job_title field (fallback to PM)
  const userRole = user?.job_title ?? 'PM';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
      <OnboardingModal
        open={showOnboarding}
        onClose={handleCloseOnboarding}
        userRole={userRole}
        userName={user?.full_name ?? undefined}
      />
    </div>
  );
}
