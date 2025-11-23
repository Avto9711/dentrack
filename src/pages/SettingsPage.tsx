import { useState } from 'react';
import { IonItem, IonLabel, IonList, IonText, IonToggle } from '@ionic/react';
import { PageLayout } from '@/components/PageLayout';

export function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <PageLayout title="Configuración">
      <IonList inset>
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
    </PageLayout>
  );
}

export default SettingsPage;
