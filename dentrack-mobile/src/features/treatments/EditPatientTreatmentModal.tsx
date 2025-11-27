import { useEffect, useMemo, useState } from 'react';
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
  fetchTreatmentCatalog,
  updatePatientTreatment,
  type UpdatePatientTreatmentInput,
} from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';
import type { Appointment, TreatmentStatus, PatientTreatment } from '@/types/domain';

interface EditPatientTreatmentModalProps {
  patientId: string;
  treatment: PatientTreatment | null;
  isOpen: boolean;
  onDismiss: () => void;
  visits: Appointment[];
}

const statusOptions: TreatmentStatus[] = ['planned', 'accepted', 'scheduled', 'completed', 'declined'];

export function EditPatientTreatmentModal({
  patientId,
  treatment,
  isOpen,
  onDismiss,
  visits,
}: EditPatientTreatmentModalProps) {
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TreatmentStatus>('planned');
  const [proposedInVisit, setProposedInVisit] = useState<string>('');
  const [presentToast] = useIonToast();
  const queryClient = useQueryClient();

  const catalogQuery = useQuery({
    queryKey: queryKeys.treatmentCatalog,
    queryFn: fetchTreatmentCatalog,
    enabled: isOpen,
  });

  const treatmentDefaults = useMemo(() => {
    if (!treatment) {
      return {
        treatmentId: '',
        price: 0,
        notes: '',
        status: 'planned' as TreatmentStatus,
        visit: '',
      };
    }
    return {
      treatmentId: treatment.treatmentId,
      price: treatment.proposedPrice ?? treatment.finalPrice ?? 0,
      notes: treatment.notes ?? '',
      status: treatment.status,
      visit: treatment.proposedInVisit ?? '',
    };
  }, [treatment]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTreatmentId(treatmentDefaults.treatmentId);
    setPrice(treatmentDefaults.price);
    setNotes(treatmentDefaults.notes);
    setStatus(treatmentDefaults.status);
    setProposedInVisit(treatmentDefaults.visit);
  }, [isOpen, treatmentDefaults]);

  useEffect(() => {
    if (!selectedTreatmentId || !catalogQuery.data) return;
    if (!price) {
      const selected = catalogQuery.data.find((item) => item.id === selectedTreatmentId);
      if (selected) {
        setPrice(selected.defaultPrice);
      }
    }
  }, [catalogQuery.data, price, selectedTreatmentId]);

  const mutation = useMutation({
    mutationFn: (input: UpdatePatientTreatmentInput) => updatePatientTreatment(input),
    onSuccess: async () => {
      presentToast({ message: 'Tratamiento actualizado', duration: 2000, color: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patientId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingTreatments }),
      ]);
      onDismiss();
    },
    onError: (error: Error) => presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  function handleSave() {
    if (!treatment) return;
    if (!selectedTreatmentId) {
      presentToast({ message: 'Selecciona un tratamiento', duration: 2000, color: 'warning' });
      return;
    }
    mutation.mutate({
      id: treatment.id,
      treatmentId: selectedTreatmentId,
      status,
      proposedPrice: price,
      notes,
      proposedInVisit: proposedInVisit || undefined,
    });
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} initialBreakpoint={0.9} breakpoints={[0, 0.9]}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Cancelar</IonButton>
          </IonButtons>
          <IonTitle>Editar tratamiento</IonTitle>
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
            <IonSelect value={selectedTreatmentId} placeholder="Seleccionar" onIonChange={(e) => setSelectedTreatmentId(e.detail.value)}>
              {catalogQuery.data?.map((item) => (
                <IonSelectOption key={item.id} value={item.id}>
                  {item.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Precio</IonLabel>
            <IonInput type="number" value={price} onIonInput={(e) => setPrice(Number(e.detail.value) || 0)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Estado</IonLabel>
            <IonSelect value={status} onIonChange={(e) => setStatus(e.detail.value)}>
              {statusOptions.map((option) => (
                <IonSelectOption key={option} value={option}>
                  {option}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Vincular a visita</IonLabel>
            <IonSelect value={proposedInVisit} placeholder="Sin visita" onIonChange={(e) => setProposedInVisit(e.detail.value)}>
              <IonSelectOption value="">Sin visita</IonSelectOption>
              {visits.map((visit) => (
                <IonSelectOption key={visit.id} value={visit.id}>
                  {new Date(visit.startsAt).toLocaleString()} · {visit.visitType}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notas</IonLabel>
            <IonTextarea autoGrow value={notes} onIonInput={(e) => setNotes(e.detail.value ?? '')} />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
