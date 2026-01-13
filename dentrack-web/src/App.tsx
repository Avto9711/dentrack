import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { TreatmentsPage } from '@/pages/TreatmentsPage';
import { ClinicsPage } from '@/pages/ClinicsPage';
import './App.css';

const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/401',
    element: <UnauthorizedPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/patients', element: <PatientsPage /> },
          { path: '/doctors', element: <DoctorsPage /> },
          { path: '/treatments', element: <TreatmentsPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/budgets', element: <BudgetsPage /> },
          { path: '/clinics', element: <ClinicsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
