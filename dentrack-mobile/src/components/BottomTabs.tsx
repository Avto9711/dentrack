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
    <IonFooter style={{ borderTop: '1px solid var(--app-border-soft)' }}>
      <IonToolbar style={{ '--padding-top': '8px', '--padding-bottom': '8px' }}>
        <IonButtons style={{ justifyContent: 'space-around', width: '100%' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <IonButton
                key={tab.path}
                fill="clear"
                color={isActive ? 'primary' : 'medium'}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                style={{
                  flexDirection: 'column',
                  fontSize: 10,
                  gap: 4,
                  height: 'auto',
                  minHeight: 48,
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isActive ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <IonIcon
                    icon={tab.icon}
                    style={{
                      fontSize: isActive ? '1.6rem' : '1.4rem',
                      transition: 'font-size 0.3s ease'
                    }}
                  />
                  <span style={{
                    fontWeight: isActive ? 700 : 500,
                    opacity: isActive ? 1 : 0.7
                  }}>
                    {tab.label}
                  </span>
                </div>
              </IonButton>
            );
          })}
        </IonButtons>
      </IonToolbar>
    </IonFooter>
  );
}
