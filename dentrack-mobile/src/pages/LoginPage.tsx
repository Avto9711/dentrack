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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (isSubmitting) return;
    try {
      setSubmitting(true);
      await login(email, password);
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
              <IonLabel position="stacked">Correo</IonLabel>
              <IonInput
                value={email}
                onIonInput={(event) => setEmail(event.detail.value ?? '')}
                autofocus
                autocomplete="email"
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
              Usa las credenciales de Supabase Auth. Si necesitas acceso solicita al administrador que cree tu usuario.
            </p>
          </IonText>
        </form>
      </IonContent>
    </IonPage>
  );
}
