import { useEffect, useState } from 'react';
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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonText,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completePatientTreatment, type CompleteTreatmentInput } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';
import type { Appointment, PatientTreatment } from '@/types/domain';

interface CompleteTreatmentModalProps {
  treatment?: PatientTreatment | null;
  isOpen: boolean;
  onDismiss: () => void;
  visits: Appointment[];
}

export function CompleteTreatmentModal({ treatment, isOpen, onDismiss, visits }: CompleteTreatmentModalProps) {
  const [completedVisitId, setCompletedVisitId] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  useEffect(() => {
    if (treatment) {
      setFinalPrice(treatment.finalPrice ?? treatment.proposedPrice ?? 0);
      setNotes(treatment.notes ?? '');
      setCompletedVisitId(treatment.completedInVisit ?? '');
    }
  }, [treatment]);

  const mutation = useMutation({
    mutationFn: (input: CompleteTreatmentInput) => completePatientTreatment(input),
    onSuccess: async () => {
      presentToast({ message: 'Tratamiento actualizado', duration: 2000, color: 'success' });
      if (treatment) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(treatment.patientId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingTreatments });
      }
      onDismiss();
    },
    onError: (error: Error) => presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  if (!treatment) return null;

  function handleSave() {
    if (!treatment) {
      presentToast({ message: 'Selecciona un tratamiento', duration: 2000, color: 'warning' });
      return;
    }
    if (!completedVisitId) {
      presentToast({ message: 'Selecciona la visita donde se completó', duration: 2000, color: 'warning' });
      return;
    }

    mutation.mutate({
      treatmentId: treatment.id,
      completedInVisit: completedVisitId,
      finalPrice,
      notes,
    });
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} initialBreakpoint={0.9} breakpoints={[0, 0.9]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Marcar como completado</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel>
              <h2>{treatment.treatment?.name}</h2>
              <p>{treatment.notes}</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Visita completada</IonLabel>
            <IonSelect value={completedVisitId} onIonChange={(e) => setCompletedVisitId(e.detail.value)}>
              {visits.length === 0 && <IonSelectOption value="">Sin visitas disponibles</IonSelectOption>}
              {visits.map((visit) => (
                <IonSelectOption key={visit.id} value={visit.id}>
                  {new Date(visit.startsAt).toLocaleString()} · {visit.visitType}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Precio final</IonLabel>
            <IonInput
              type="number"
              value={finalPrice}
              onIonInput={(e) => setFinalPrice(Number(e.detail.value) || 0)}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notas finales</IonLabel>
            <IonTextarea autoGrow value={notes} onIonInput={(e) => setNotes(e.detail.value ?? '')} />
          </IonItem>
        </IonList>
        <IonText color="medium" className="ion-padding">
          Actualiza el precio final y notas antes de enviar al paciente.
        </IonText>
      </IonContent>
      <IonToolbar>
        <IonButtons slot="end">
          <IonButton strong onClick={handleSave} disabled={mutation.isPending}>
            Guardar
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonModal>
  );
}
