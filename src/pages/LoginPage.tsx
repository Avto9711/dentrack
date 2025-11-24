import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useIonToast } from '@ionic/react';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [presentToast] = useIonToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (isSubmitting) return;
    try {
      setSubmitting(true);
      await login(username, password);
      setPassword('');
    } catch (error) {
      presentToast({
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
        color: 'danger',
        duration: 2500,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>DenTrack · Acceso</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
          <IonList inset>
            <IonItem>
              <IonLabel position="stacked">Usuario</IonLabel>
              <IonInput
                value={username}
                onIonInput={(event) => setUsername(event.detail.value ?? '')}
                autofocus
                autocomplete="username"
                inputmode="email"
                required
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                autocomplete="current-password"
                onIonInput={(event) => setPassword(event.detail.value ?? '')}
                required
              />
            </IonItem>
          </IonList>
          <IonButton expand="block" type="submit" disabled={isSubmitting} strong>
            Entrar
          </IonButton>
          <IonText color="medium">
            <p style={{ marginTop: 16 }}>
              Los administradores crean a los dentistas desde la base de datos. Solicita tus credenciales al equipo.
            </p>
          </IonText>
        </form>
      </IonContent>
    </IonPage>
  );
}
