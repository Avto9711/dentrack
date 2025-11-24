import { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { callOutline, chatboxEllipsesOutline, mailOutline, arrowBackOutline, addOutline } from 'ionicons/icons';
import { PageLayout } from '@/components/PageLayout';
import { fetchPatientDetail } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/money';
import { AddTreatmentModal } from '@/features/treatments/AddTreatmentModal';
import { CompleteTreatmentModal } from '@/features/treatments/CompleteTreatmentModal';
import { EditPatientTreatmentModal } from '@/features/treatments/EditPatientTreatmentModal';
import { CreateBudgetModal } from '@/features/budgets/CreateBudgetModal';
import { BudgetDetailModal } from '@/features/budgets/BudgetDetailModal';
import { WhatsAppComposer } from '@/features/whatsapp/WhatsAppComposer';
import { AddAppointmentModal } from '@/features/appointments/AddAppointmentModal';
import type { Budget, PatientEvaluation, PatientTreatment } from '@/types/domain';
import { openExternalUrl } from '@/lib/platform';
import { PatientEvaluationModal } from '@/features/evaluations/PatientEvaluationModal';
import { PatientEvaluationCard } from '@/features/evaluations/PatientEvaluationCard';
import { EditPatientModal } from '@/features/patients/EditPatientModal';

const segments = [
  { value: 'visits', label: 'Visitas' },
  { value: 'treatments', label: 'Tratamientos' },
  { value: 'budgets', label: 'Presupuestos' },
  { value: 'contact', label: 'Contacto' },
  { value: 'evaluations', label: 'Evaluaciones' },
] as const;

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const params = new URLSearchParams(window.location.search);
  const initialSegment = (params.get('segment') as (typeof segments)[number]['value']) ?? 'visits';

  const navigate = useNavigate();
  const [segment, setSegment] = useState<(typeof segments)[number]['value']>(initialSegment);
  const [isAddTreatmentOpen, setAddTreatmentOpen] = useState(false);
  const [completeTreatment, setCompleteTreatment] = useState<PatientTreatment | null>(null);
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isEvaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [evaluationToEdit, setEvaluationToEdit] = useState<PatientEvaluation | null>(null);
  const [isEditPatientOpen, setEditPatientOpen] = useState(false);
  const [treatmentToEdit, setTreatmentToEdit] = useState<PatientTreatment | null>(null);

  const detailQuery = useQuery({
    queryKey: queryKeys.patientDetail(id ?? ''),
    queryFn: () => fetchPatientDetail(id ?? ''),
    enabled: Boolean(id),
  });

  if (!id) {
    return null;
  }

  const detail = detailQuery.data;
  const patient = detail?.patient;
  const appointments = detail?.appointments ?? [];
  const treatments = detail?.treatments ?? [];
  const budgets = detail?.budgets ?? [];
  const evaluations = detail?.evaluations ?? [];
  const visitsById = new Map(appointments.map((visit) => [visit.id, visit]));

  const pendingTreatments = treatments.filter((treatment) => treatment.status !== 'completed');
  const completedTreatments = treatments.filter((treatment) => treatment.status === 'completed');

  if (!patient) {
    return (
      <PageLayout
        title="Paciente"
        toolbarStartSlot={<IonButton fill="clear" onClick={() => navigate(-1)}><IonIcon icon={arrowBackOutline} /></IonButton>}
      >
        <IonText className="ion-padding" color="medium">
          Cargando paciente...
        </IonText>
      </PageLayout>
    );
  }

  function openEvaluationModal(evaluation?: PatientEvaluation | null) {
    setEvaluationToEdit(evaluation ?? null);
    setEvaluationModalOpen(true);
  }

  function closeEvaluationModal() {
    setEvaluationModalOpen(false);
    setEvaluationToEdit(null);
  }

  return (
    <PageLayout
      title={patient.fullName}
      toolbarStartSlot={
        <IonButton fill="clear" onClick={() => navigate(-1)}>
          <IonIcon icon={arrowBackOutline} />
        </IonButton>
      }
      toolbarEndSlot={
        <IonButton fill="clear" onClick={() => setShowAppointmentModal(true)}>
          <IonIcon icon={addOutline} slot="icon-only" />
        </IonButton>
      }
    >
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Datos del paciente</IonCardTitle>
          <IonButton size="small" fill="clear" onClick={() => setEditPatientOpen(true)}>
            Editar
          </IonButton>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                {patient.phone && (
                  <IonButton fill="outline" size="small" onClick={() => openExternalUrl(`tel:${patient.phone}`)}>
                    <IonIcon icon={callOutline} slot="start" /> Llamar
                  </IonButton>
                )}
                {patient.email && (
                  <IonButton fill="outline" size="small" onClick={() => openExternalUrl(`mailto:${patient.email}`)}>
                    <IonIcon icon={mailOutline} slot="start" /> Email
                  </IonButton>
                )}
                <IonButton fill="outline" size="small" onClick={() => setShowWhatsApp(true)}>
                  <IonIcon icon={chatboxEllipsesOutline} slot="start" /> WhatsApp
                </IonButton>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonText color="medium">
                  <strong>Dirección:</strong> {patient.address || 'No registrada'}
                </IonText>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonText color="medium">
                  <strong>Fecha de nacimiento:</strong> {patient.birthDate || 'Sin dato'}
                </IonText>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonText color="medium">
                  <strong>Género:</strong> {patient.gender || 'Sin especificar'}
                </IonText>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12">
                <IonText>{patient.notes || 'Sin notas'}</IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <IonSegment
        value={segment}
        onIonChange={(event) =>
          setSegment((event.detail.value as (typeof segments)[number]['value']) ?? 'visits')
        }
      >
        {segments.map((item) => (
          <IonSegmentButton key={item.value} value={item.value}>
            <IonLabel>{item.label}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>

      {segment === 'visits' && (
        <IonList inset>
          {appointments.map((visit) => (
            <IonItem key={visit.id}>
              <IonLabel>
                <h2>{formatDateTime(visit.startsAt)}</h2>
                <p>{visit.notes}</p>
              </IonLabel>
              <IonBadge color="tertiary">{visit.visitType}</IonBadge>
            </IonItem>
          ))}
          {appointments.length === 0 && (
            <IonText className="ion-padding" color="medium">
              Sin visitas registradas.
            </IonText>
          )}
        </IonList>
      )}

      {segment === 'treatments' && (
        <>
          <IonButton expand="block" onClick={() => setAddTreatmentOpen(true)}>
            Agregar tratamiento
          </IonButton>
          <IonText className="ion-padding" color="medium">
            Pendientes
          </IonText>
          <IonList inset>
            {pendingTreatments.map((treatment) => (
              <IonItem key={treatment.id}>
                <IonLabel>
                  <h2>{treatment.treatment?.name}</h2>
                  <p>{treatment.notes}</p>
                </IonLabel>
                <IonButton size="small" fill="clear" onClick={() => setTreatmentToEdit(treatment)}>
                  Editar
                </IonButton>
                <IonButton size="small" fill="clear" onClick={() => setCompleteTreatment(treatment)}>
                  Marcar done
                </IonButton>
                <IonBadge color="warning">{treatment.status}</IonBadge>
              </IonItem>
            ))}
            {pendingTreatments.length === 0 && (
              <IonText className="ion-padding" color="success">
                Sin pendientes 🎉
              </IonText>
            )}
          </IonList>
          <IonText className="ion-padding" color="medium">
            Completados
          </IonText>
          <IonList inset>
            {completedTreatments.map((treatment) => (
              <IonItem key={treatment.id}>
                <IonLabel>
                  <h2>{treatment.treatment?.name}</h2>
                  <p>
                    {treatment.completedInVisit
                      ? `Visita: ${formatDateTime(
                          visitsById.get(treatment.completedInVisit)?.startsAt ?? ''
                        )}`
                      : 'Sin visita registrada'}
                  </p>
                </IonLabel>
                <IonButton size="small" fill="clear" onClick={() => setTreatmentToEdit(treatment)}>
                  Editar
                </IonButton>
                <IonBadge color="success">
                  {formatCurrency(treatment.finalPrice ?? treatment.proposedPrice ?? 0)}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        </>
      )}

      {segment === 'budgets' && (
        <>
          <IonButton expand="block" onClick={() => setBudgetModalOpen(true)} disabled={pendingTreatments.length === 0}>
            Crear desde tratamientos
          </IonButton>
          <IonList inset>
            {budgets.map((budget) => (
              <IonItem key={budget.id} button onClick={() => setSelectedBudget(budget)}>
                <IonLabel>
                  <h2>Presupuesto</h2>
                  <p>{budget.notes}</p>
                </IonLabel>
                <IonBadge color="medium">{budget.status}</IonBadge>
                <IonText slot="end">{formatCurrency(budget.totalAmount, budget.currencyCode)}</IonText>
              </IonItem>
            ))}
            {budgets.length === 0 && (
              <IonText className="ion-padding" color="medium">
                Aún no tienes presupuestos para este paciente.
              </IonText>
            )}
          </IonList>
        </>
      )}

      {segment === 'contact' && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Contacto rápido</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" onClick={() => setShowWhatsApp(true)}>
              <IonIcon icon={chatboxEllipsesOutline} slot="start" /> WhatsApp
            </IonButton>
            {patient.phone && (
              <IonButton expand="block" fill="outline" onClick={() => openExternalUrl(`tel:${patient.phone}`)}>
                <IonIcon icon={callOutline} slot="start" /> Llamar
              </IonButton>
            )}
            {patient.email && (
              <IonButton expand="block" fill="outline" onClick={() => openExternalUrl(`mailto:${patient.email}`)}>
                <IonIcon icon={mailOutline} slot="start" /> Email
              </IonButton>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {segment === 'evaluations' && (
        <>
          <IonButton expand="block" onClick={() => openEvaluationModal(null)}>
            Registrar evaluación
          </IonButton>
          {evaluations.length === 0 && (
            <IonText className="ion-padding" color="medium">
              Aún no hay evaluaciones registradas para este paciente.
            </IonText>
          )}
          {evaluations.map((evaluation) => (
            <PatientEvaluationCard key={evaluation.id} evaluation={evaluation} onEdit={openEvaluationModal} />
          ))}
        </>
      )}

      <AddTreatmentModal
        patientId={patient.id}
        isOpen={isAddTreatmentOpen}
        onDismiss={() => setAddTreatmentOpen(false)}
        visits={appointments}
      />
      <CompleteTreatmentModal
        treatment={completeTreatment}
        isOpen={Boolean(completeTreatment)}
        onDismiss={() => setCompleteTreatment(null)}
        visits={appointments}
      />
      <CreateBudgetModal
        patientId={patient.id}
        treatments={treatments}
        isOpen={isBudgetModalOpen}
        onDismiss={() => setBudgetModalOpen(false)}
      />
      <BudgetDetailModal
        budget={selectedBudget}
        isOpen={Boolean(selectedBudget)}
        onDismiss={() => setSelectedBudget(null)}
      />
      <AddAppointmentModal
        isOpen={showAppointmentModal}
        onDismiss={() => setShowAppointmentModal(false)}
        defaultPatientId={patient.id}
      />
      <WhatsAppComposer
        patient={patient}
        isOpen={showWhatsApp}
        onDismiss={() => setShowWhatsApp(false)}
        summary={`Seguimiento a ${patient.fullName}`}
      />
      <PatientEvaluationModal
        patientId={patient.id}
        evaluation={evaluationToEdit}
        isOpen={isEvaluationModalOpen}
        onDismiss={closeEvaluationModal}
      />
      <EditPatientModal patient={patient} isOpen={isEditPatientOpen} onDismiss={() => setEditPatientOpen(false)} />
      <EditPatientTreatmentModal
        patientId={patient.id}
        treatment={treatmentToEdit}
        isOpen={Boolean(treatmentToEdit)}
        onDismiss={() => setTreatmentToEdit(null)}
        visits={appointments}
      />
    </PageLayout>
  );
}
