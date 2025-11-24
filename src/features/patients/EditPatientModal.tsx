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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePatient, type UpdatePatientInput, type CreatePatientInput } from '@/lib/api';
import type { Patient } from '@/types/domain';
import { useIonToast } from '@ionic/react';
import { queryKeys } from '@/lib/queryKeys';

interface EditPatientModalProps {
  patient: Patient;
  isOpen: boolean;
  onDismiss: () => void;
}

export function EditPatientModal({ patient, isOpen, onDismiss }: EditPatientModalProps) {
  const initialState: CreatePatientInput = useMemo(
    () => ({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      notes: patient.notes ?? '',
      birthDate: patient.birthDate ?? '',
      gender: patient.gender ?? undefined,
      clinicId: patient.clinicId ?? undefined,
    }),
    [patient]
  );

  const [form, setForm] = useState<CreatePatientInput>(initialState);
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  useEffect(() => {
    if (isOpen) {
      setForm(initialState);
    }
  }, [initialState, isOpen]);

  function updateField<K extends keyof CreatePatientInput>(key: K, value: CreatePatientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: (input: UpdatePatientInput) => updatePatient(input),
    onSuccess: async () => {
      presentToast({ message: 'Paciente actualizado', duration: 2000, color: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patient.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients() }),
      ]);
      onDismiss();
    },
    onError: (error: Error) => presentToast({ message: error.message, color: 'danger', duration: 2500 }),
  });

  function handleSave() {
    if (!form.firstName || !form.lastName) {
      presentToast({ message: 'Nombre y apellido son obligatorios', color: 'warning', duration: 2000 });
      return;
    }
    mutation.mutate({
      patientId: patient.id,
      ...form,
    });
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} initialBreakpoint={0.8} breakpoints={[0, 0.5, 0.8, 1]}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Cancelar</IonButton>
          </IonButtons>
          <IonTitle>Editar paciente</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={mutation.isPending} strong>
              Guardar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Nombre</IonLabel>
            <IonInput value={form.firstName} onIonInput={(e) => updateField('firstName', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Apellido</IonLabel>
            <IonInput value={form.lastName} onIonInput={(e) => updateField('lastName', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Teléfono</IonLabel>
            <IonInput value={form.phone} type="tel" onIonInput={(e) => updateField('phone', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput value={form.email} type="email" onIonInput={(e) => updateField('email', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Dirección</IonLabel>
            <IonTextarea autoGrow value={form.address} onIonInput={(e) => updateField('address', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Fecha de nacimiento</IonLabel>
            <IonInput value={form.birthDate} type="date" onIonInput={(e) => updateField('birthDate', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Género</IonLabel>
            <IonSelect value={form.gender} placeholder="Seleccionar" onIonChange={(e) => updateField('gender', e.detail.value ?? undefined)}>
              <IonSelectOption value="female">Femenino</IonSelectOption>
              <IonSelectOption value="male">Masculino</IonSelectOption>
              <IonSelectOption value="other">Otro</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notas / Alertas</IonLabel>
            <IonTextarea autoGrow value={form.notes} onIonInput={(e) => updateField('notes', e.detail.value ?? '')} />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
