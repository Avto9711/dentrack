import { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonToggle,
} from '@ionic/react';
import { PageLayout } from '@/components/PageLayout';
import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { profile, logout } = useAuth();

  return (
    <PageLayout title="Configuración">
      <IonCard className="page-block">
        <IonCardHeader>
          <IonCardTitle>Preferencias</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList lines="none" className="flush-list">
            <IonItem className="subtle-card">
              <IonLabel position="stacked">Sesión</IonLabel>
              <IonText>
                {profile?.fullName ?? 'Sin iniciar sesión'} — {profile?.role}
              </IonText>
            </IonItem>
            <IonItem className="subtle-card">
              <IonLabel>Notificaciones</IonLabel>
              <IonToggle
                checked={notificationsEnabled}
                onIonChange={(event) => setNotificationsEnabled(event.detail.checked)}
              />
            </IonItem>
            <IonItem lines="none" className="subtle-card">
              <IonLabel position="stacked">Estado</IonLabel>
              <IonText color="medium">Preferencias pendientes de conectar a la API.</IonText>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>
      <IonButton expand="block" color="medium" onClick={logout} className="page-block">
        Cerrar sesión
      </IonButton>
    </PageLayout>
  );
}

export default SettingsPage;
