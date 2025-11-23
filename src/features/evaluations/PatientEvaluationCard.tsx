import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/react';
import { createOutline } from 'ionicons/icons';
import type { PatientEvaluation } from '@/types/domain';
import { formatDate } from '@/utils/date';

interface PatientEvaluationCardProps {
  evaluation: PatientEvaluation;
  onEdit: (evaluation: PatientEvaluation) => void;
}

const planLabels: { key: keyof PatientEvaluation; label: string }[] = [
  { key: 'planProphylaxis', label: 'Profilaxis' },
  { key: 'planObturation', label: 'Obturación' },
  { key: 'planEndodontics', label: 'Endodoncia' },
  { key: 'planOrthodontics', label: 'Ortodoncia' },
  { key: 'planPeriodontics', label: 'Periodoncia' },
  { key: 'planOralSurgery', label: 'Cirugía oral' },
  { key: 'planProsthesis', label: 'Prótesis' },
];

function boolText(value: boolean, yesLabel = 'Sí', noLabel = 'No') {
  return value ? yesLabel : noLabel;
}

export function PatientEvaluationCard({ evaluation, onEdit }: PatientEvaluationCardProps) {
  const planItems = planLabels.filter((plan) => evaluation[plan.key] as unknown as boolean);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{formatDate(evaluation.evaluationDate)}</IonCardTitle>
        <IonCardSubtitle>{evaluation.diagnosis || 'Sin diagnóstico registrado'}</IonCardSubtitle>
        <IonButton fill="clear" size="small" onClick={() => onEdit(evaluation)}>
          <IonIcon slot="start" icon={createOutline} /> Editar
        </IonButton>
      </IonCardHeader>
      <IonCardContent>
        <IonList lines="none">
          <IonItem>
            <IonLabel>
              <h3>Antecedentes médicos</h3>
              <p>
                Enfermedades sistémicas: {boolText(evaluation.hasSystemicDiseases)}
                {evaluation.hasSystemicDiseases && evaluation.systemicDiseases ? ` — ${evaluation.systemicDiseases}` : ''}
              </p>
              <p>
                Alergias: {boolText(evaluation.hasAllergies)}
                {evaluation.hasAllergies && evaluation.allergies ? ` — ${evaluation.allergies}` : ''}
              </p>
              <p>Medicamentos: {evaluation.currentMedications || 'No registrado'}</p>
              <p>
                Cirugías previas: {boolText(evaluation.hadSurgeries)}
                {evaluation.hadSurgeries && evaluation.surgeries ? ` — ${evaluation.surgeries}` : ''}
              </p>
              <p>Hábitos: {evaluation.habits || 'No registrado'}</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <h3>Exploración</h3>
              <p>Motivo de consulta: {evaluation.consultReason || 'No indicado'}</p>
              <p>
                Higiene oral: {
                  evaluation.oralHygiene === 'good'
                    ? 'Buena'
                    : evaluation.oralHygiene === 'regular'
                    ? 'Regular'
                    : evaluation.oralHygiene === 'poor'
                    ? 'Deficiente'
                    : 'No evaluada'
                }
              </p>
              <p>
                Encías: {
                  evaluation.gumStatus === 'healthy'
                    ? 'Sanas'
                    : evaluation.gumStatus === 'gingivitis'
                    ? 'Gingivitis'
                    : evaluation.gumStatus === 'mild_periodontitis'
                    ? 'Periodontitis leve'
                    : evaluation.gumStatus === 'severe_periodontitis'
                    ? 'Periodontitis severa'
                    : 'Sin dato'
                }
              </p>
              <p>
                Caries: {boolText(evaluation.hasCaries)} · Placa: {boolText(evaluation.hasPlaque)}
              </p>
              <p>Observaciones: {evaluation.otherObservations || 'Sin observaciones'}</p>
            </IonLabel>
          </IonItem>
          {evaluation.dentogram && (
            <IonItem>
              <IonLabel>
                <h3>Dentigrama</h3>
                <IonText>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(evaluation.dentogram, null, 2)}</pre>
                </IonText>
              </IonLabel>
            </IonItem>
          )}
          <IonItem>
            <IonLabel>
              <h3>Plan de tratamiento</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {planItems.length > 0 ? (
                  planItems.map((plan) => <IonChip key={plan.key}>{plan.label}</IonChip>)
                ) : (
                  <IonText color="medium">Sin procedimientos seleccionados</IonText>
                )}
              </div>
              {evaluation.planOther && <p>Otros: {evaluation.planOther}</p>}
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <h3>Diagnóstico</h3>
              <p>{evaluation.diagnosis || 'Pendiente'}</p>
              <p>
                Firma: {evaluation.dentistSignature || 'Sin firma'} · Actualizado el {formatDate(evaluation.updatedAt)}
              </p>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>
  );
}
