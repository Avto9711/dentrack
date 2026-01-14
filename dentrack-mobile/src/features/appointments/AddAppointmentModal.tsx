import { useCallback, useEffect, useState } from 'react';
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
import {
  createAppointment,
  deleteAppointment,
  listPatients,
  updateAppointment,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonAlert, useIonToast } from '@ionic/react';
import type { Appointment, VisitType } from '@/types/domain';
import { addMinutes, combineDateAndTime } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  defaultPatientId?: string;
  appointment?: Appointment | null;
}

export function AddAppointmentModal({ isOpen, onDismiss, defaultPatientId, appointment }: AddAppointmentModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(defaultPatientId);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [visitType, setVisitType] = useState<VisitType>('evaluation');
  const [notes, setNotes] = useState('');
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isEditing = Boolean(appointment);

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(''),
    queryFn: () => listPatients(''),
    enabled: isOpen,
  });

  async function invalidateCaches(patientId?: string) {
    const tasks: Promise<unknown>[] = [
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todayAppointments }),
    ];
    if (patientId) {
      tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patientId) }));
    }
    await Promise.all(tasks);
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => createAppointment(input),
    onSuccess: async (created) => {
      await invalidateCaches(created.patientId);
      presentToast({ message: 'Cita creada', duration: 2000, color: 'success' });
      onDismiss();
    },
    onError: (error: Error) =>
      presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAppointmentInput) => updateAppointment(input),
    onSuccess: async (updated) => {
      await invalidateCaches(updated.patientId);
      presentToast({ message: 'Cita actualizada', duration: 2000, color: 'success' });
      onDismiss();
    },
    onError: (error: Error) =>
      presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (appt: Appointment) => deleteAppointment(appt.id),
    onSuccess: async (_, deletedAppt) => {
      await invalidateCaches(deletedAppt.patientId);
      presentToast({ message: 'Cita eliminada', duration: 2000, color: 'success' });
      onDismiss();
    },
    onError: (error: Error) =>
      presentToast({ message: error.message, duration: 2500, color: 'danger' }),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function handleSave() {
    if (!selectedPatientId) {
      presentToast({ message: 'Selecciona un paciente', duration: 2000, color: 'warning' });
      return;
    }
    if (!profile?.id) {
      presentToast({ message: 'Tu sesión no es válida. Inicia sesión nuevamente.', color: 'danger', duration: 2500 });
      return;
    }
    if (durationMinutes <= 0) {
      presentToast({ message: 'La duración debe ser mayor a 0', duration: 2000, color: 'warning' });
      return;
    }
    const startsAt = combineDateAndTime(date, time);
    const endsAt = addMinutes(startsAt, durationMinutes);
    if (isEditing && appointment) {
      updateMutation.mutate({
        appointmentId: appointment.id,
        patientId: selectedPatientId,
        startsAt,
        endsAt,
        visitType,
        notes,
        dentistId: appointment.dentistId ?? profile.id,
        clinicId: profile.clinicId ?? null,
      });
    } else {
      createMutation.mutate({
        patientId: selectedPatientId,
        startsAt,
        endsAt,
        visitType,
        notes,
        dentistId: profile.id,
        clinicId: profile.clinicId ?? null,
      });
    }
  }

  const resetForm = useCallback(() => {
    if (appointment) {
      const start = new Date(appointment.startsAt);
      const end = new Date(appointment.endsAt);
      const diffMinutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60000) || 60
      );
      setSelectedPatientId(appointment.patientId);
      setDate(start.toISOString().substring(0, 10));
      setTime(start.toISOString().substring(11, 16));
      setDurationMinutes(diffMinutes);
      setVisitType(appointment.visitType);
      setNotes(appointment.notes ?? '');
    } else {
      setSelectedPatientId(defaultPatientId);
      const today = new Date();
      setDate(today.toISOString().substring(0, 10));
      setTime('09:00');
      setDurationMinutes(60);
      setVisitType('evaluation');
      setNotes('');
    }
  }, [appointment, defaultPatientId]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  function confirmDelete() {
    if (!appointment) return;
    presentAlert({
      header: 'Eliminar cita',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => deleteMutation.mutate(appointment),
        },
      ],
    });
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
          <IonTitle>{isEditing ? 'Editar cita' : 'Nueva cita'}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave} disabled={isSaving || isDeleting}>
              {isEditing ? 'Actualizar' : 'Guardar'}
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
        {isEditing && (
          <IonButton
            color="danger"
            fill="clear"
            expand="block"
            onClick={confirmDelete}
            disabled={isDeleting || isSaving}
          >
            Eliminar cita
          </IonButton>
        )}
      </IonContent>
    </IonModal>
  );
}
