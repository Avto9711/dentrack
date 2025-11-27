import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import './DashboardLayout.css';

export function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__content">
        <TopBar />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
