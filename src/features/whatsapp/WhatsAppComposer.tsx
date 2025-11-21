import { useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/react';
import type { Patient } from '@/types/domain';
import { buildWhatsAppUrl, whatsappTemplates } from './templates';
import { openExternalUrl } from '@/lib/platform';

export interface WhatsAppComposerProps {
  patient: Patient;
  isOpen: boolean;
  onDismiss: () => void;
  suggestedAmount?: number;
  summary?: string;
}

export function WhatsAppComposer({
  patient,
  isOpen,
  onDismiss,
  suggestedAmount,
  summary,
}: WhatsAppComposerProps) {
  const [templateId, setTemplateId] = useState('budget');
  const [message, setMessage] = useState('');

  const defaultMessage = useMemo(() => {
    const template = whatsappTemplates.find((tpl) => tpl.id === templateId) ?? whatsappTemplates[0];
    return template.buildMessage({ patient, amount: suggestedAmount, summary });
  }, [patient, suggestedAmount, summary, templateId]);

  const hasPhone = Boolean(patient.phone);

  function handleOpenWhatsApp() {
    const finalMessage = message.trim() || defaultMessage;
    if (!patient.phone) return;
    const url = buildWhatsAppUrl(patient.phone, finalMessage);
    openExternalUrl(url);
    onDismiss();
  }

  function resetState() {
    setMessage('');
    setTemplateId('budget');
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} onWillPresent={resetState} initialBreakpoint={0.75} breakpoints={[0, 0.75, 1]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>WhatsApp para {patient.firstName}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Plantilla</IonLabel>
            <IonSelect value={templateId} onIonChange={(event) => setTemplateId(event.detail.value)} interface="popover">
              {whatsappTemplates.map((tpl) => (
                <IonSelectOption key={tpl.id} value={tpl.id}>
                  {tpl.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Mensaje</IonLabel>
            <IonTextarea
              autoGrow
              rows={6}
              placeholder={defaultMessage}
              value={message}
              onIonInput={(event) => setMessage(event.detail.value ?? '')}
            />
          </IonItem>
        </IonList>
        {!hasPhone && (
          <IonText color="danger" className="ion-padding">
            El paciente no tiene teléfono registrado.
          </IonText>
        )}
      </IonContent>
      <IonToolbar>
        <IonButtons slot="end">
          <IonButton disabled={!hasPhone} onClick={handleOpenWhatsApp} strong>
            Abrir WhatsApp
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonModal>
  );
}
