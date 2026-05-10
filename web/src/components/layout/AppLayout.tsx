import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastContainer, useAutoDismissToast } from '../ui/Toast';

export function AppLayout() {
  useAutoDismissToast();
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
