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
  IonCheckbox,
  IonText,
  IonInput,
  IonTextarea,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBudgetFromTreatments, type CreateBudgetInput } from '@/lib/api';
import type { PatientTreatment } from '@/types/domain';
import { formatCurrency } from '@/utils/money';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';

interface CreateBudgetModalProps {
  patientId: string;
  treatments: PatientTreatment[];
  isOpen: boolean;
  onDismiss: () => void;
}

export function CreateBudgetModal({ patientId, treatments, isOpen, onDismiss }: CreateBudgetModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [presentToast] = useIonToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudgetFromTreatments(input),
    onSuccess: async () => {
      presentToast({ message: 'Presupuesto creado', duration: 2000, color: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patientId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets() }),
      ]);
      onDismiss();
    },
    onError: (error: Error) => presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  function toggleTreatment(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function handleSave() {
    if (selected.length === 0) {
      presentToast({ message: 'Selecciona al menos un tratamiento', duration: 2000, color: 'warning' });
      return;
    }
    mutation.mutate({ patientId, treatmentIds: selected, validUntil: validUntil || undefined, notes });
  }

  function resetForm() {
    setSelected([]);
    setValidUntil('');
    setNotes('');
  }

  const pendingTreatments = treatments.filter((treatment) => treatment.status !== 'completed');
  const total = pendingTreatments
    .filter((treatment) => selected.includes(treatment.id))
    .reduce((sum, current) => sum + (current.proposedPrice ?? current.finalPrice ?? 0), 0);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} onWillPresent={resetForm} initialBreakpoint={0.95} breakpoints={[0, 0.95]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Nuevo presupuesto</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonText className="ion-padding" color="medium">
          Selecciona los tratamientos para cotizar
        </IonText>
        <IonList inset>
          {pendingTreatments.map((treatment) => (
            <IonItem key={treatment.id}>
              <IonCheckbox
                slot="start"
                checked={selected.includes(treatment.id)}
                onIonChange={() => toggleTreatment(treatment.id)}
              />
              <IonLabel>
                <h2>{treatment.treatment?.name ?? 'Tratamiento'}</h2>
                <p>{treatment.notes}</p>
              </IonLabel>
              <IonText slot="end">{formatCurrency(treatment.proposedPrice ?? treatment.finalPrice ?? 0)}</IonText>
            </IonItem>
          ))}
        </IonList>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Válido hasta</IonLabel>
            <IonInput type="date" value={validUntil} onIonInput={(e) => setValidUntil(e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notas</IonLabel>
            <IonTextarea autoGrow value={notes} onIonInput={(e) => setNotes(e.detail.value ?? '')} />
          </IonItem>
        </IonList>
        <IonText className="ion-padding">Total estimado: {formatCurrency(total)}</IonText>
      </IonContent>
      <IonToolbar>
        <IonButtons slot="end">
          <IonButton strong onClick={handleSave} disabled={mutation.isPending}>
            Generar
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonModal>
  );
}
