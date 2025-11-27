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
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPatientTreatment,
  fetchTreatmentCatalog,
  type CreatePatientTreatmentInput,
} from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';
import type { Appointment } from '@/types/domain';
import { useAuth } from '@/context/AuthContext';

interface AddTreatmentModalProps {
  patientId: string;
  isOpen: boolean;
  onDismiss: () => void;
  visits: Appointment[];
}

export function AddTreatmentModal({ patientId, isOpen, onDismiss, visits }: AddTreatmentModalProps) {
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [proposedInVisit, setProposedInVisit] = useState<string>('');
  const [presentToast] = useIonToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const catalogQuery = useQuery({
    queryKey: queryKeys.treatmentCatalog,
    queryFn: fetchTreatmentCatalog,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!selectedTreatmentId) return;
    const selected = catalogQuery.data?.find((item) => item.id === selectedTreatmentId);
    if (selected) {
      setPrice(selected.defaultPrice);
    }
  }, [selectedTreatmentId, catalogQuery.data]);

  const mutation = useMutation({
    mutationFn: (input: CreatePatientTreatmentInput) => createPatientTreatment(input),
    onSuccess: async () => {
      presentToast({ message: 'Tratamiento agregado', duration: 2000, color: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patientId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingTreatments }),
      ]);
      onDismiss();
    },
    onError: (error: Error) => presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  function handleSave() {
    if (!selectedTreatmentId) {
      presentToast({ message: 'Selecciona un tratamiento', duration: 2000, color: 'warning' });
      return;
    }
    mutation.mutate({
      patientId,
      treatmentId: selectedTreatmentId,
      proposedPrice: price,
      notes,
      proposedInVisit: proposedInVisit || undefined,
      clinicId: profile?.clinicId ?? null,
    });
  }

  function resetForm() {
    setSelectedTreatmentId('');
    setPrice(0);
    setNotes('');
    setProposedInVisit('');
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      onWillPresent={resetForm}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9]}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Cancelar</IonButton>
          </IonButtons>
          <IonTitle>Agregar tratamiento</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave} disabled={mutation.isPending}>
              Guardar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Tratamiento</IonLabel>
            <IonSelect
              placeholder="Seleccionar"
              value={selectedTreatmentId}
              onIonChange={(e) => setSelectedTreatmentId(e.detail.value)}
            >
              {catalogQuery.data?.map((item) => (
                <IonSelectOption key={item.id} value={item.id}>
                  {item.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Precio propuesto</IonLabel>
            <IonInput
              type="number"
              value={price}
              onIonInput={(e) => setPrice(Number(e.detail.value) || 0)}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Vincular a visita</IonLabel>
            <IonSelect
              placeholder="Sin visita"
              value={proposedInVisit}
              onIonChange={(e) => setProposedInVisit(e.detail.value)}
            >
              <IonSelectOption value="">Sin visita</IonSelectOption>
              {visits.map((visit) => (
                <IonSelectOption key={visit.id} value={visit.id}>
                  {new Date(visit.startsAt).toLocaleString()} · {visit.visitType}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notas / Área</IonLabel>
            <IonTextarea autoGrow value={notes} onIonInput={(e) => setNotes(e.detail.value ?? '')} />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
