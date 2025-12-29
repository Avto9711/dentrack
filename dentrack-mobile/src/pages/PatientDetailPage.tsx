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
import {
  callOutline,
  chatboxEllipsesOutline,
  mailOutline,
  arrowBackOutline,
  addOutline,
  calendarOutline,
  medkitOutline,
  cashOutline,
  personOutline,
  clipboardOutline,
} from 'ionicons/icons';
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
  { value: 'visits', label: 'Visitas', icon: calendarOutline },
  { value: 'treatments', label: 'Tratamientos', icon: medkitOutline },
  { value: 'budgets', label: 'Presupuestos', icon: cashOutline },
  { value: 'contact', label: 'Contacto', icon: personOutline },
  { value: 'evaluations', label: 'Evaluaciones', icon: clipboardOutline },
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
      title="Datos del paciente"
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
      <IonCard className="page-block glass-card" style={{ marginTop: 16 }}>
        <IonCardHeader className="patient-card-header">
          <div className="avatar-circle" style={{ width: 64, height: 64, fontSize: '1.5rem', borderRadius: 20, marginBottom: 8 }}>
            {patient.fullName.charAt(0)}
          </div>
          <div className="patient-card-header__title">
            <div className="patient-card-header__title-row">
              <IonCardTitle style={{ fontSize: '1.4rem' }}>{patient.fullName}</IonCardTitle>
            </div>
            <div className="patient-card-header__contacts">
              {patient.phone && (
                <IonButton
                  className="contact-circle-button"
                  fill="solid"
                  onClick={() => openExternalUrl(`tel:${patient.phone}`)}
                >
                  <IonIcon icon={callOutline} slot="icon-only" />
                </IonButton>
              )}
              {patient.email && (
                <IonButton
                  className="contact-circle-button"
                  fill="solid"
                  onClick={() => openExternalUrl(`mailto:${patient.email}`)}
                >
                  <IonIcon icon={mailOutline} slot="icon-only" />
                </IonButton>
              )}
              <IonButton
                className="contact-circle-button"
                fill="solid"
                onClick={() => setShowWhatsApp(true)}
              >
                <IonIcon icon={chatboxEllipsesOutline} slot="icon-only" />
              </IonButton>
              <IonButton
                className="contact-circle-button"
                fill="solid"
                onClick={() => setEditPatientOpen(true)}
                style={{ '--background': 'var(--app-surface-muted)', '--color': 'var(--app-text-body)' }}
              >
                <IonIcon icon={personOutline} slot="icon-only" />
              </IonButton>
            </div>
          </div>
        </IonCardHeader>
        <IonCardContent style={{ paddingTop: 16 }}>
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="6">
                <IonText color="medium" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Dirección</IonText>
                <p style={{ margin: '4px 0 12px', fontSize: '0.9rem' }}>{patient.address || 'No registrada'}</p>
              </IonCol>
              <IonCol size="6">
                <IonText color="medium" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Nacimiento</IonText>
                <p style={{ margin: '4px 0 12px', fontSize: '0.9rem' }}>{patient.birthDate || 'Sin dato'}</p>
              </IonCol>
              <IonCol size="12">
                <IonText color="medium" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Notas</IonText>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--app-text-body)' }}>{patient.notes || 'Sin notas adicionales'}</p>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <div className="page-block">
        <IonSegment
          className="pill-segment"
          value={segment}
          scrollable
          onIonChange={(event) =>
            setSegment((event.detail.value as (typeof segments)[number]['value']) ?? 'visits')
          }
        >
          {segments.map((item) => (
            <IonSegmentButton
              key={item.value}
              value={item.value}
              style={{ minWidth: 60 }}
            >
              <IonIcon icon={item.icon} style={{ fontSize: '1.2rem' }} />
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>

      {segment === 'visits' && (
        <IonCard className="page-block">
          <IonCardHeader>
            <IonCardTitle>Visitas</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none" className="flush-list">
              {appointments.map((visit) => (
                <IonItem key={visit.id} className="subtle-card">
                  <IonLabel>
                    <h2>{formatDateTime(visit.startsAt)}</h2>
                    <p style={{ margin: 0 }}>{visit.notes || 'Sin notas'}</p>
                  </IonLabel>
                  <IonBadge color="tertiary">{visit.visitType}</IonBadge>
                </IonItem>
              ))}
            </IonList>
            {appointments.length === 0 && <IonText color="medium">Sin visitas registradas.</IonText>}
          </IonCardContent>
        </IonCard>
      )}

      {segment === 'treatments' && (
        <>
          <IonButton className="page-block" expand="block" onClick={() => setAddTreatmentOpen(true)}>
            Agregar tratamiento
          </IonButton>
          <IonCard className="page-block">
            <IonCardHeader>
              <IonCardTitle>Pendientes</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none" className="flush-list">
                {pendingTreatments.map((treatment) => (
                  <IonItem key={treatment.id} className="subtle-card">
                    <IonLabel>
                      <h2>{treatment.treatment?.name}</h2>
                      <p style={{ margin: 0 }}>{treatment.notes || 'Sin notas'}</p>
                    </IonLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <IonButton size="small" fill="clear" onClick={() => setTreatmentToEdit(treatment)}>
                        Editar
                      </IonButton>
                      <IonButton size="small" fill="clear" onClick={() => setCompleteTreatment(treatment)}>
                        Marcar done
                      </IonButton>
                    </div>
                    <IonBadge color="warning">{treatment.status}</IonBadge>
                  </IonItem>
                ))}
              </IonList>
              {pendingTreatments.length === 0 && <IonText color="success">Sin pendientes 🎉</IonText>}
            </IonCardContent>
          </IonCard>
          <IonCard className="page-block">
            <IonCardHeader>
              <IonCardTitle>Completados</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none" className="flush-list">
                {completedTreatments.map((treatment) => (
                  <IonItem key={treatment.id} className="subtle-card">
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
              {completedTreatments.length === 0 && <IonText color="medium">Sin tratamientos completados.</IonText>}
            </IonCardContent>
          </IonCard>
        </>
      )}

      {segment === 'budgets' && (
        <>
          <IonButton
            className="page-block"
            expand="block"
            onClick={() => setBudgetModalOpen(true)}
            disabled={pendingTreatments.length === 0}
          >
            Crear desde tratamientos
          </IonButton>
          <IonCard className="page-block">
            <IonCardHeader>
              <IonCardTitle>Presupuestos</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none" className="flush-list">
                {budgets.map((budget) => (
                  <IonItem key={budget.id} className="subtle-card" button onClick={() => setSelectedBudget(budget)}>
                    <IonLabel>
                      <h2>{budget.notes || 'Presupuesto'}</h2>
                      <p style={{ margin: 0 }}>Total: {formatCurrency(budget.totalAmount, budget.currencyCode)}</p>
                    </IonLabel>
                    <IonBadge color="medium">{budget.status}</IonBadge>
                  </IonItem>
                ))}
              </IonList>
              {budgets.length === 0 && (
                <IonText color="medium">Aún no tienes presupuestos para este paciente.</IonText>
              )}
            </IonCardContent>
          </IonCard>
        </>
      )}

      {segment === 'contact' && (
        <IonCard className="page-block">
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
          <IonButton className="page-block" expand="block" onClick={() => openEvaluationModal(null)}>
            Registrar evaluación
          </IonButton>
          {evaluations.length === 0 && (
            <IonText className="page-block" color="medium">
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
