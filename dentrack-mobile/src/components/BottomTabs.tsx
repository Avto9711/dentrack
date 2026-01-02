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
        <IonButtons style={{ display: 'flex', width: '100%', margin: 0, padding: '0 4px' }}>
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
                  flex: 1,
                  minWidth: 0,
                  flexDirection: 'column',
                  fontSize: 9,
                  gap: 4,
                  height: 'auto',
                  minHeight: 48,
                  '--padding-start': '4px',
                  '--padding-end': '4px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isActive ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <IonIcon
                    icon={tab.icon}
                    style={{
                      fontSize: isActive ? '1.5rem' : '1.3rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <span style={{
                    fontWeight: isActive ? 700 : 500,
                    opacity: isActive ? 1 : 0.7,
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
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
