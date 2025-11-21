import { IonFooter, IonToolbar, IonButtons, IonButton, IonIcon, IonLabel } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { calendarOutline, peopleOutline, speedometerOutline, walletOutline } from 'ionicons/icons';

const tabs = [
  { path: '/', label: 'Dashboard', icon: speedometerOutline },
  { path: '/patients', label: 'Pacientes', icon: peopleOutline },
  { path: '/appointments', label: 'Citas', icon: calendarOutline },
  { path: '/budgets', label: 'Presupuestos', icon: walletOutline },
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
                style={{ flexDirection: 'column', flex: 1 }}
              >
                <IonIcon icon={tab.icon} />
                <IonLabel style={{ fontSize: '0.75rem' }}>{tab.label}</IonLabel>
              </IonButton>
            );
          })}
        </IonButtons>
      </IonToolbar>
    </IonFooter>
  );
}
