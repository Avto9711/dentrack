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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAppointment, listPatients, type CreateAppointmentInput } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';
import type { VisitType } from '@/types/domain';
import { addMinutes, combineDateAndTime } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  defaultPatientId?: string;
}

export function AddAppointmentModal({ isOpen, onDismiss, defaultPatientId }: AddAppointmentModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(defaultPatientId);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [visitType, setVisitType] = useState<VisitType>('evaluation');
  const [notes, setNotes] = useState('');
  const [presentToast] = useIonToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(''),
    queryFn: () => listPatients(''),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => createAppointment(input),
    onSuccess: async () => {
      presentToast({ message: 'Cita creada', duration: 2000, color: 'success' });
      const tasks: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todayAppointments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments() }),
      ];
      if (selectedPatientId) {
        tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(selectedPatientId) }));
      }
      await Promise.all(tasks);
      onDismiss();
    },
    onError: (error: Error) =>
      presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  function handleSave() {
    if (!selectedPatientId) {
      presentToast({ message: 'Selecciona un paciente', duration: 2000, color: 'warning' });
      return;
    }
    if (!profile?.id) {
      presentToast({ message: 'Tu sesión no es válida. Inicia sesión nuevamente.', color: 'danger', duration: 2500 });
      return;
    }
    const startsAt = combineDateAndTime(date, time);
    const endsAt = addMinutes(startsAt, durationMinutes);
    mutation.mutate({
      patientId: selectedPatientId,
      startsAt,
      endsAt,
      visitType,
      notes,
      dentistId: profile.id,
      clinicId: profile.clinicId ?? null,
    });
  }

  function resetForm() {
    setSelectedPatientId(defaultPatientId);
    setVisitType('evaluation');
    setNotes('');
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
          <IonTitle>Nueva cita</IonTitle>
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
            <IonLabel position="stacked">Paciente</IonLabel>
            <IonSelect
              value={selectedPatientId}
              placeholder="Seleccionar"
              onIonChange={(event) => setSelectedPatientId(event.detail.value)}
            >
              {patientsQuery.data?.map((patient) => (
                <IonSelectOption key={patient.id} value={patient.id}>
                  {patient.fullName}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Fecha</IonLabel>
            <IonInput type="date" value={date} onIonInput={(e) => setDate(e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Hora</IonLabel>
            <IonInput type="time" value={time} onIonInput={(e) => setTime(e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Duración (min)</IonLabel>
            <IonInput
              type="number"
              value={durationMinutes}
              onIonInput={(e) => setDurationMinutes(Number(e.detail.value) || 0)}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Tipo de visita</IonLabel>
            <IonSelect value={visitType} onIonChange={(e) => setVisitType(e.detail.value)}>
              <IonSelectOption value="evaluation">Evaluación</IonSelectOption>
              <IonSelectOption value="treatment">Tratamiento</IonSelectOption>
              <IonSelectOption value="control">Control</IonSelectOption>
              <IonSelectOption value="other">Otro</IonSelectOption>
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
