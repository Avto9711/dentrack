import { useState } from 'react';
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
  IonNote,
  IonBadge,
  IonText,
} from '@ionic/react';
import type { Budget } from '@/types/domain';
import { formatCurrency } from '@/utils/money';
import { WhatsAppComposer } from '@/features/whatsapp/WhatsAppComposer';

interface BudgetDetailModalProps {
  budget?: Budget | null;
  isOpen: boolean;
  onDismiss: () => void;
}

export function BudgetDetailModal({ budget, isOpen, onDismiss }: BudgetDetailModalProps) {
  const [showComposer, setShowComposer] = useState(false);

  if (!budget) return null;

  const total = formatCurrency(budget.totalAmount, budget.currencyCode);

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={() => {
          setShowComposer(false);
          onDismiss();
        }}
        initialBreakpoint={0.9}
        breakpoints={[0, 0.9]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={onDismiss}>Cerrar</IonButton>
            </IonButtons>
            <IonTitle>Presupuesto</IonTitle>
            <IonButtons slot="end">
              <IonButton strong disabled={!budget.patient?.phone} onClick={() => setShowComposer(true)}>
                Enviar WhatsApp
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList inset>
            <IonItem>
              <IonLabel>
                <h2>Paciente</h2>
                <IonNote>{budget.patient?.fullName}</IonNote>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h2>Estado</h2>
                <IonBadge color="medium">{budget.status}</IonBadge>
              </IonLabel>
            </IonItem>
            {budget.validUntil && (
              <IonItem>
                <IonLabel>
                  <h2>Válido hasta</h2>
                  <IonNote>{new Date(budget.validUntil).toLocaleDateString()}</IonNote>
                </IonLabel>
              </IonItem>
            )}
          </IonList>
          <IonText className="ion-padding" color="medium">
            Tratamientos incluidos
          </IonText>
          <IonList inset>
            {budget.items?.map((item) => {
              const treatmentName = item.treatment?.treatment?.name ?? item.treatment?.treatmentId ?? 'Tratamiento';
              return (
                <IonItem key={item.id}>
                  <IonLabel>
                    <h2>{treatmentName}</h2>
                    <p>{item.treatment?.notes}</p>
                  </IonLabel>
                  <IonNote slot="end">{formatCurrency(item.agreedPrice, budget.currencyCode)}</IonNote>
                </IonItem>
              );
            })}
          </IonList>
          <IonText className="ion-padding" color="dark">
            Total: {total}
          </IonText>
        </IonContent>
      </IonModal>
      {budget.patient && (
        <WhatsAppComposer
          patient={budget.patient}
          isOpen={showComposer}
          onDismiss={() => setShowComposer(false)}
          suggestedAmount={budget.totalAmount}
          summary={`${budget.items?.length ?? 0} tratamientos`}
        />
      )}
    </>
  );
}
