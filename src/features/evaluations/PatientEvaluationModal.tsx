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
  IonTextarea,
  IonInput,
  IonToggle,
  IonSelect,
  IonSelectOption,
  useIonToast,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPatientEvaluation,
  updatePatientEvaluation,
  type CreatePatientEvaluationInput,
  type PatientEvaluationInput,
  type UpdatePatientEvaluationInput,
} from '@/lib/api';
import type { GumStatus, OralHygieneLevel, PatientEvaluation } from '@/types/domain';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/context/AuthContext';

interface PatientEvaluationModalProps {
  patientId: string;
  evaluation?: PatientEvaluation | null;
  isOpen: boolean;
  onDismiss: () => void;
}

type EvaluationFormState = PatientEvaluationInput & {
  evaluationDate: string;
  dentogramText: string;
};

type SubmitPayload =
  | { type: 'create'; input: CreatePatientEvaluationInput }
  | { type: 'update'; input: UpdatePatientEvaluationInput };

const todayISO = () => new Date().toISOString().slice(0, 10);

function buildStateFromEvaluation(evaluation?: PatientEvaluation | null): EvaluationFormState {
  return {
    evaluationDate: evaluation?.evaluationDate ?? todayISO(),
    hasSystemicDiseases: evaluation?.hasSystemicDiseases ?? false,
    systemicDiseases: evaluation?.systemicDiseases ?? null,
    hasAllergies: evaluation?.hasAllergies ?? false,
    allergies: evaluation?.allergies ?? null,
    currentMedications: evaluation?.currentMedications ?? null,
    hadSurgeries: evaluation?.hadSurgeries ?? false,
    surgeries: evaluation?.surgeries ?? null,
    habits: evaluation?.habits ?? null,
    consultReason: evaluation?.consultReason ?? null,
    oralHygiene: evaluation?.oralHygiene ?? null,
    gumStatus: evaluation?.gumStatus ?? null,
    hasCaries: evaluation?.hasCaries ?? false,
    hasPlaque: evaluation?.hasPlaque ?? false,
    otherObservations: evaluation?.otherObservations ?? null,
    dentogram: evaluation?.dentogram ?? null,
    dentogramText: evaluation?.dentogram ? JSON.stringify(evaluation.dentogram, null, 2) : '',
    diagnosis: evaluation?.diagnosis ?? null,
    planProphylaxis: evaluation?.planProphylaxis ?? false,
    planObturation: evaluation?.planObturation ?? false,
    planEndodontics: evaluation?.planEndodontics ?? false,
    planOrthodontics: evaluation?.planOrthodontics ?? false,
    planPeriodontics: evaluation?.planPeriodontics ?? false,
    planOralSurgery: evaluation?.planOralSurgery ?? false,
    planProsthesis: evaluation?.planProsthesis ?? false,
    planOther: evaluation?.planOther ?? null,
    dentistSignature: evaluation?.dentistSignature ?? null,
  };
}

export function PatientEvaluationModal({ patientId, evaluation, isOpen, onDismiss }: PatientEvaluationModalProps) {
  const [form, setForm] = useState<EvaluationFormState>(buildStateFromEvaluation(evaluation));
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setForm(buildStateFromEvaluation(evaluation));
    }
  }, [evaluation, isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: SubmitPayload) => {
      if (payload.type === 'create') {
        return createPatientEvaluation(payload.input);
      }
      return updatePatientEvaluation(payload.input);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.patientDetail(patientId) });
      presentToast({
        message: variables.type === 'create' ? 'Evaluación registrada' : 'Evaluación actualizada',
        duration: 2000,
        color: 'success',
      });
      onDismiss();
    },
    onError: (error: Error) => {
      presentToast({ message: error.message, color: 'danger', duration: 2500 });
    },
  });

  const isEditing = Boolean(evaluation);
  const isSaving = mutation.isPending;

  const planFields = useMemo(
    () => [
      { key: 'planProphylaxis', label: 'Profilaxis' },
      { key: 'planObturation', label: 'Obturación' },
      { key: 'planEndodontics', label: 'Endodoncia' },
      { key: 'planOrthodontics', label: 'Ortodoncia' },
      { key: 'planPeriodontics', label: 'Periodoncia' },
      { key: 'planOralSurgery', label: 'Cirugía oral' },
      { key: 'planProsthesis', label: 'Prótesis' },
    ] as const,
    []
  );

  function updateField<K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleToggle(key: keyof EvaluationFormState, checked: boolean) {
    updateField(key, checked as EvaluationFormState[typeof key]);
  }

  function parseDentogram(): Record<string, unknown> | null {
    if (!form.dentogramText?.trim()) {
      return null;
    }
    try {
      return JSON.parse(form.dentogramText);
    } catch (error) {
      presentToast({
        message: 'El dentigrama debe ser un JSON válido',
        color: 'warning',
        duration: 2500,
      });
      throw error;
    }
  }

  function buildPayload(): PatientEvaluationInput {
    const dentogramData = (() => {
      try {
        return parseDentogram();
      } catch {
        return undefined;
      }
    })();

    if (dentogramData === undefined) {
      // Invalid JSON already handled via toast
      throw new Error('invalid-dentogram');
    }

    const sanitize = (value?: string | null) => value?.trim() || null;

    return {
      evaluationDate: form.evaluationDate,
      hasSystemicDiseases: form.hasSystemicDiseases,
      systemicDiseases: sanitize(form.systemicDiseases),
      hasAllergies: form.hasAllergies,
      allergies: sanitize(form.allergies),
      currentMedications: sanitize(form.currentMedications),
      hadSurgeries: form.hadSurgeries,
      surgeries: sanitize(form.surgeries),
      habits: sanitize(form.habits),
      consultReason: sanitize(form.consultReason),
      oralHygiene: form.oralHygiene ?? null,
      gumStatus: form.gumStatus ?? null,
      hasCaries: form.hasCaries,
      hasPlaque: form.hasPlaque,
      otherObservations: sanitize(form.otherObservations),
      dentogram: dentogramData,
      diagnosis: sanitize(form.diagnosis),
      planProphylaxis: form.planProphylaxis,
      planObturation: form.planObturation,
      planEndodontics: form.planEndodontics,
      planOrthodontics: form.planOrthodontics,
      planPeriodontics: form.planPeriodontics,
      planOralSurgery: form.planOralSurgery,
      planProsthesis: form.planProsthesis,
      planOther: sanitize(form.planOther),
      dentistSignature: sanitize(form.dentistSignature),
    };
  }

  function handleSave() {
    let payload: PatientEvaluationInput;
    try {
      payload = buildPayload();
    } catch (error) {
      if ((error as Error).message !== 'invalid-dentogram') {
        presentToast({ message: 'Revisa los datos ingresados', color: 'warning', duration: 2000 });
      }
      return;
    }

    if (!payload.consultReason) {
      presentToast({ message: 'Ingresa el motivo de consulta', color: 'warning', duration: 2000 });
      return;
    }

    const submitPayload: SubmitPayload = isEditing
      ? {
          type: 'update',
          input: {
            evaluationId: evaluation!.id,
            ...payload,
            dentistId: profile?.id,
          },
        }
      : {
          type: 'create',
          input: {
            patientId,
            ...payload,
            dentistId: profile?.id,
          },
        };

    mutation.mutate(submitPayload);
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.5, 0.9, 1]}
      handleBehavior="cycle"
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Cerrar</IonButton>
          </IonButtons>
          <IonTitle>{isEditing ? 'Editar evaluación' : 'Nueva evaluación'}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave} disabled={isSaving}>
              Guardar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Fecha</IonLabel>
            <IonInput
              type="date"
              value={form.evaluationDate}
              onIonInput={(event) => updateField('evaluationDate', event.detail.value ?? todayISO())}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Enfermedades sistémicas</IonLabel>
            <IonToggle
              checked={form.hasSystemicDiseases}
              onIonChange={(event) => handleToggle('hasSystemicDiseases', event.detail.checked)}
            />
          </IonItem>
          {form.hasSystemicDiseases && (
            <IonItem>
              <IonLabel position="stacked">Detalles</IonLabel>
              <IonTextarea
                autoGrow
                value={form.systemicDiseases ?? ''}
                onIonInput={(event) => updateField('systemicDiseases', event.detail.value ?? '')}
              />
            </IonItem>
          )}
          <IonItem>
            <IonLabel>Alergias</IonLabel>
            <IonToggle
              checked={form.hasAllergies}
              onIonChange={(event) => handleToggle('hasAllergies', event.detail.checked)}
            />
          </IonItem>
          {form.hasAllergies && (
            <IonItem>
              <IonLabel position="stacked">¿Cuáles?</IonLabel>
              <IonTextarea
                autoGrow
                value={form.allergies ?? ''}
                onIonInput={(event) => updateField('allergies', event.detail.value ?? '')}
              />
            </IonItem>
          )}
          <IonItem>
            <IonLabel position="stacked">Medicamentos actuales</IonLabel>
            <IonTextarea
              autoGrow
              value={form.currentMedications ?? ''}
              onIonInput={(event) => updateField('currentMedications', event.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Cirugías previas</IonLabel>
            <IonToggle
              checked={form.hadSurgeries}
              onIonChange={(event) => handleToggle('hadSurgeries', event.detail.checked)}
            />
          </IonItem>
          {form.hadSurgeries && (
            <IonItem>
              <IonLabel position="stacked">Listado</IonLabel>
              <IonTextarea
                autoGrow
                value={form.surgeries ?? ''}
                onIonInput={(event) => updateField('surgeries', event.detail.value ?? '')}
              />
            </IonItem>
          )}
          <IonItem>
            <IonLabel position="stacked">Hábitos</IonLabel>
            <IonTextarea
              autoGrow
              value={form.habits ?? ''}
              onIonInput={(event) => updateField('habits', event.detail.value ?? '')}
              placeholder="Fumar, alcohol, bruxismo..."
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Motivo de consulta</IonLabel>
            <IonTextarea
              autoGrow
              value={form.consultReason ?? ''}
              onIonInput={(event) => updateField('consultReason', event.detail.value ?? '')}
              placeholder="Describe el motivo principal de la visita"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Higiene oral</IonLabel>
            <IonSelect
              placeholder="Selecciona"
              value={form.oralHygiene ?? undefined}
              onIonChange={(event) =>
                updateField('oralHygiene', (event.detail.value ?? null) as OralHygieneLevel | null)
              }
            >
              <IonSelectOption value="good">Buena</IonSelectOption>
              <IonSelectOption value="regular">Regular</IonSelectOption>
              <IonSelectOption value="poor">Deficiente</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Estado de encías</IonLabel>
            <IonSelect
              placeholder="Selecciona"
              value={form.gumStatus ?? undefined}
              onIonChange={(event) => updateField('gumStatus', (event.detail.value ?? null) as GumStatus | null)}
            >
              <IonSelectOption value="healthy">Sanas</IonSelectOption>
              <IonSelectOption value="gingivitis">Gingivitis</IonSelectOption>
              <IonSelectOption value="mild_periodontitis">Periodontitis leve</IonSelectOption>
              <IonSelectOption value="severe_periodontitis">Periodontitis severa</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>Presencia de caries</IonLabel>
            <IonToggle
              checked={form.hasCaries}
              onIonChange={(event) => handleToggle('hasCaries', event.detail.checked)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Placa bacteriana</IonLabel>
            <IonToggle
              checked={form.hasPlaque}
              onIonChange={(event) => handleToggle('hasPlaque', event.detail.checked)}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Observaciones</IonLabel>
            <IonTextarea
              autoGrow
              value={form.otherObservations ?? ''}
              onIonInput={(event) => updateField('otherObservations', event.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Dentigrama (JSON)</IonLabel>
            <IonTextarea
              autoGrow
              value={form.dentogramText}
              onIonInput={(event) => updateField('dentogramText', event.detail.value ?? '')}
              placeholder='{"11":{"occlusal":"caries"}}'
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Diagnóstico</IonLabel>
            <IonTextarea
              autoGrow
              value={form.diagnosis ?? ''}
              onIonInput={(event) => updateField('diagnosis', event.detail.value ?? '')}
            />
          </IonItem>
          {planFields.map((field) => (
            <IonItem key={field.key}>
              <IonLabel>{field.label}</IonLabel>
              <IonToggle
                checked={form[field.key] as boolean}
                onIonChange={(event) => handleToggle(field.key, event.detail.checked)}
              />
            </IonItem>
          ))}
          <IonItem>
            <IonLabel position="stacked">Otro plan</IonLabel>
            <IonTextarea
              autoGrow
              value={form.planOther ?? ''}
              onIonInput={(event) => updateField('planOther', event.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Firma del odontólogo</IonLabel>
            <IonInput
              value={form.dentistSignature ?? ''}
              onIonInput={(event) => updateField('dentistSignature', event.detail.value ?? '')}
            />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
