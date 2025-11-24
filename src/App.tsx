import { IonApp, IonContent, IonSpinner, setupIonicReact } from '@ionic/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { PatientDetailPage } from '@/pages/PatientDetailPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';

setupIonicReact({ mode: 'ios' });

export function App() {
  const { profile, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <IonApp>
        <IonContent className="ion-padding" fullscreen>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30vh' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonApp>
    );
  }

  return (
    <IonApp>
      {profile ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <LoginPage />
      )}
    </IonApp>
  );
}

export default App;
