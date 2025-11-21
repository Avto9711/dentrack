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
  IonTextarea,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient, type CreatePatientInput } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useIonToast } from '@ionic/react';

interface AddPatientModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const initialState: CreatePatientInput = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  notes: '',
  birthDate: '',
  gender: undefined,
};

export function AddPatientModal({ isOpen, onDismiss }: AddPatientModalProps) {
  const [form, setForm] = useState<CreatePatientInput>(initialState);
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  const mutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async () => {
      presentToast({ message: 'Paciente creado', duration: 2000, color: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients() });
      setForm(initialState);
      onDismiss();
    },
    onError: (error: Error) => {
      presentToast({ message: error.message, color: 'danger', duration: 2500 });
    },
  });

  function updateField<K extends keyof CreatePatientInput>(key: K, value: CreatePatientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.firstName || !form.lastName) {
      presentToast({ message: 'Nombre y apellido son obligatorios', color: 'warning', duration: 2000 });
      return;
    }
    mutation.mutate(form);
  }

  const isBusy = mutation.isPending;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} initialBreakpoint={0.9} breakpoints={[0, 0.8]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Nuevo paciente</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cerrar</IonButton>
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
            <IonInput value={form.phone} onIonInput={(e) => updateField('phone', e.detail.value ?? '')} type="tel" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput value={form.email} onIonInput={(e) => updateField('email', e.detail.value ?? '')} type="email" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Fecha de nacimiento</IonLabel>
            <IonInput value={form.birthDate} type="date" onIonInput={(e) => updateField('birthDate', e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Género</IonLabel>
            <IonSelect
              placeholder="Seleccionar"
              value={form.gender}
              onIonChange={(e) => updateField('gender', e.detail.value ?? undefined)}
            >
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
      <IonToolbar>
        <IonButtons slot="end">
          <IonButton onClick={handleSave} disabled={isBusy} strong>
            Guardar
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonModal>
  );
}
