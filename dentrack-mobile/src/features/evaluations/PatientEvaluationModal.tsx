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
  IonText,
  useIonToast,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPatientEvaluation,
  savePatientDentogramEntries,
  updatePatientEvaluation,
  type CreatePatientEvaluationInput,
  type DentogramEntryInput,
  type PatientEvaluationInput,
  type UpdatePatientEvaluationInput,
} from '@/lib/api';
import type { GumStatus, OralHygieneLevel, PatientEvaluation } from '@/types/domain';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/context/AuthContext';

const toothOptions = [
  '11','12','13','14','15','16','17','18',
  '21','22','23','24','25','26','27','28',
  '31','32','33','34','35','36','37','38',
  '41','42','43','44','45','46','47','48',
];

const surfaceOptions = ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual', 'palatino'];

const findingOptions = ['caries', 'restaurado', 'resina', 'sellante', 'ausente', 'sano','exodoncia'];

interface PatientEvaluationModalProps {
  patientId: string;
  evaluation?: PatientEvaluation | null;
  isOpen: boolean;
  onDismiss: () => void;
}

type EvaluationFormState = PatientEvaluationInput & {
  evaluationDate: string;
};

type SubmitPayload =
  | { type: 'create'; input: CreatePatientEvaluationInput; entries: DentogramEntryInput[] }
  | { type: 'update'; input: UpdatePatientEvaluationInput; entries: DentogramEntryInput[] };

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
  const [dentogramEntries, setDentogramEntries] = useState<DentogramEntryInput[]>(
    evaluation?.dentogramEntries?.map((entry) => ({
      toothNumber: entry.toothNumber,
      surface: entry.surface,
      finding: entry.finding,
    })) ?? []
  );
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setForm(buildStateFromEvaluation(evaluation));
      setDentogramEntries(
        evaluation?.dentogramEntries?.map((entry) => ({
          toothNumber: entry.toothNumber,
          surface: entry.surface,
          finding: entry.finding,
        })) ?? []
      );
    }
  }, [evaluation, isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: SubmitPayload) => {
      const evaluationRecord = payload.type === 'create'
        ? await createPatientEvaluation(payload.input)
        : await updatePatientEvaluation(payload.input);

      await savePatientDentogramEntries(evaluationRecord.id, evaluationRecord.patientId, payload.entries);
      return evaluationRecord;
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

  function buildPayload(): PatientEvaluationInput {
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
    const payload = buildPayload();

    if (!payload.consultReason) {
      presentToast({ message: 'Ingresa el motivo de consulta', color: 'warning', duration: 2000 });
      return;
    }

    const filteredEntries = dentogramEntries.filter(
      (entry) => entry.toothNumber && entry.surface && entry.finding
    );

    const submitPayload: SubmitPayload = isEditing
      ? {
          type: 'update',
          input: {
            evaluationId: evaluation!.id,
            ...payload,
            dentistId: profile?.id,
          },
          entries: filteredEntries,
        }
      : {
          type: 'create',
          input: {
            patientId,
            ...payload,
            dentistId: profile?.id,
          },
          entries: filteredEntries,
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
          <IonText className="ion-padding" color="medium">
            Dentigrama
          </IonText>
          <IonButton expand="block" fill="outline" onClick={() =>
            setDentogramEntries((prev) => [...prev, { toothNumber: '', surface: '', finding: '' }])
          }>
            Agregar pieza
          </IonButton>
          {dentogramEntries.length === 0 && (
            <IonText className="ion-padding" color="medium">
              No hay piezas registradas.
            </IonText>
          )}
          {dentogramEntries.map((entry, index) => (
            <div key={`dentogram-entry-${index}`} className="subtle-card" style={{ marginTop: 12 }}>
              <IonLabel>
                <h3 style={{ marginTop: 0 }}>Pieza #{index + 1}</h3>
              </IonLabel>
              <IonItem lines="none">
                <IonLabel position="stacked">Pieza</IonLabel>
                <IonSelect
                  placeholder="Seleccionar"
                  value={entry.toothNumber || undefined}
                  onIonChange={(event) =>
                    setDentogramEntries((prev) => {
                      const next = [...prev];
                      next[index] = {
                        ...next[index],
                        toothNumber: event.detail.value ?? '',
                      };
                      return next;
                    })
                  }
                >
                  {toothOptions.map((option) => (
                    <IonSelectOption key={option} value={option}>
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem lines="none">
                <IonLabel position="stacked">Cara</IonLabel>
                <IonSelect
                  placeholder="Seleccionar"
                  value={entry.surface || undefined}
                  onIonChange={(event) =>
                    setDentogramEntries((prev) => {
                      const next = [...prev];
                      next[index] = {
                        ...next[index],
                        surface: event.detail.value ?? '',
                      };
                      return next;
                    })
                  }
                >
                  {surfaceOptions.map((option) => (
                    <IonSelectOption key={option} value={option}>
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem lines="none">
                <IonLabel position="stacked">Hallazgo</IonLabel>
                <IonSelect
                  placeholder="Seleccionar"
                  value={entry.finding || undefined}
                  onIonChange={(event) =>
                    setDentogramEntries((prev) => {
                      const next = [...prev];
                      next[index] = {
                        ...next[index],
                        finding: event.detail.value ?? '',
                      };
                      return next;
                    })
                  }
                >
                  {findingOptions.map((option) => (
                    <IonSelectOption key={option} value={option}>
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonButton
                expand="block"
                color="danger"
                fill="outline"
                onClick={() =>
                  setDentogramEntries((prev) => prev.filter((_, entryIndex) => entryIndex !== index))
                }
                style={{ marginTop: 8 }}
              >
                Eliminar pieza
              </IonButton>
            </div>
          ))}
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
