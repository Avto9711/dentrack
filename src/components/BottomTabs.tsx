import { IonFooter, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { calendarOutline, peopleOutline, settingsOutline, speedometerOutline, walletOutline } from 'ionicons/icons';

const tabs = [
  { path: '/', label: 'Dashboard', icon: speedometerOutline },
  { path: '/patients', label: 'Pacientes', icon: peopleOutline },
  { path: '/appointments', label: 'Citas', icon: calendarOutline },
  { path: '/budgets', label: 'Presupuestos', icon: walletOutline },
  { path: '/settings', label: 'Configuración', icon: settingsOutline },
];

export function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <IonFooter>
      <IonToolbar>
        <IonButtons>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <IonButton
                key={tab.path}
                fill="clear"
                color={isActive ? 'primary' : 'medium'}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                style={{ flexDirection: 'column', flex: 1, fontSize: 12, gap: 4 }}
              >
                <IonIcon icon={tab.icon} />
              </IonButton>
            );
          })}
        </IonButtons>
      </IonToolbar>
    </IonFooter>
  );
}
