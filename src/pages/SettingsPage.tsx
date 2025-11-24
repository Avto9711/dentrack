import { useState } from 'react';
import { IonButton, IonItem, IonLabel, IonList, IonText, IonToggle } from '@ionic/react';
import { PageLayout } from '@/components/PageLayout';
import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { profile, logout } = useAuth();

  return (
    <PageLayout title="Configuración">
      <IonList inset>
        <IonItem>
          <IonLabel position="stacked">Sesión</IonLabel>
          <IonText>
            {profile?.fullName ?? 'Sin iniciar sesión'} — {profile?.role}
          </IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Notificaciones</IonLabel>
          <IonToggle
            checked={notificationsEnabled}
            onIonChange={(event) => setNotificationsEnabled(event.detail.checked)}
          />
        </IonItem>
        <IonItem lines="none">
          <IonLabel position="stacked">Estado</IonLabel>
          <IonText color="medium">
            Preferencias pendientes de conectar a la API.
          </IonText>
        </IonItem>
      </IonList>
      <IonButton expand="block" color="medium" onClick={logout} className="ion-margin-top">
        Cerrar sesión
      </IonButton>
    </PageLayout>
  );
}

export default SettingsPage;
