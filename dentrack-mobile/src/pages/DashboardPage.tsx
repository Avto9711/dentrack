import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { calendarOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingTreatments, fetchTodayAppointments } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageLayout } from '@/components/PageLayout';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/money';
import type { RefresherEventDetail } from '@ionic/react';
import { useAuth } from '@/context/AuthContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const todayAppointmentsQuery = useQuery({
    queryKey: queryKeys.dashboard.todayAppointments,
    queryFn: fetchTodayAppointments,
  });

  const pendingTreatmentsQuery = useQuery({
    queryKey: queryKeys.dashboard.pendingTreatments,
    queryFn: () => fetchPendingTreatments(6),
  });

  const appointments = todayAppointmentsQuery.data ?? [];
  const pendingTreatments = pendingTreatmentsQuery.data ?? [];

  const summaryMetrics = [
    {
      label: 'Citas hoy',
      value: todayAppointmentsQuery.isLoading ? '—' : appointments.length,
      action: () => navigate('/appointments'),
    },
    {
      label: 'Pendientes',
      value: pendingTreatmentsQuery.isLoading ? '—' : pendingTreatments.length,
      action: () => navigate('/patients'),
    },
  ];

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    Promise.all([todayAppointmentsQuery.refetch(), pendingTreatmentsQuery.refetch()]).finally(() =>
      event.detail.complete()
    );
  }

  return (
    <PageLayout title="Dashboard">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      <IonGrid>
        <IonRow>
          <IonCol size="12">
            <IonCard className="hero-card">
              <IonCardHeader>
                <IonCardTitle>
                  Hola {profile?.fullName?.split(' ')[0] ?? 'Doctora/o'}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <h2 style={{ margin: '12px 0 4px', fontWeight: 500 }}>
                    {appointments.length > 0
                      ? `Tienes ${appointments.length} citas agendadas hoy`
                      : 'Tu agenda está despejada por ahora'}
                  </h2>
                  <p style={{ margin: 0 }}>Organiza tu jornada y revisa pacientes en seguimiento.</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          {summaryMetrics.map((metric) => (
            <IonCol size="6" key={metric.label}>
              <IonCard onClick={metric.action} button>
                <IonCardContent>
                  <IonText color="medium">{metric.label}</IonText>
                  <IonCardTitle style={{ marginTop: 6 }}>{metric.value}</IonCardTitle>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
        <IonRow>
          <IonCol size="12">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Agenda de hoy</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {todayAppointmentsQuery.isLoading && <IonSkeletonText animated style={{ width: '100%', height: 80 }} />}
                {!todayAppointmentsQuery.isLoading && appointments.length === 0 && (
                  <IonText color="medium">No hay citas para hoy.</IonText>
                )}
                <IonList lines="none" className="flush-list">
                  {appointments.map((appointment) => (
                    <IonItem
                      key={appointment.id}
                      className="subtle-card"
                      button={Boolean(appointment.patientId)}
                      onClick={() =>
                        appointment.patientId && navigate(`/patients/${appointment.patientId}`)
                      }
                    >
                      <IonLabel>
                        <h2>{appointment.patient?.fullName ?? 'Paciente'}</h2>
                        <p>{formatDateTime(appointment.startsAt)}</p>
                      </IonLabel>
                      <IonBadge color="tertiary">{appointment.visitType}</IonBadge>
                    </IonItem>
                  ))}
                </IonList>
                <IonButton size="small" fill="clear" onClick={() => navigate('/appointments')}>
                  Ver calendario
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="12">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Tratamientos pendientes</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {pendingTreatmentsQuery.isLoading && <IonSkeletonText animated style={{ width: '100%', height: 80 }} />}
                {!pendingTreatmentsQuery.isLoading && pendingTreatments.length === 0 && (
                  <IonText color="medium">Sin pendientes 🎉</IonText>
                )}
                <IonList lines="none" className="flush-list">
                  {pendingTreatments.map((treatment) => (
                    <IonItem
                      key={treatment.id}
                      className="subtle-card"
                      button
                      onClick={() =>
                        treatment.patientId && navigate(`/patients/${treatment.patientId}?segment=treatments`)
                      }
                    >
                      <IonLabel>
                        <h2>{treatment.treatment?.name ?? 'Tratamiento'}</h2>
                        <p>
                          {treatment.patient?.fullName} · {formatCurrency(treatment.proposedPrice ?? undefined)}
                        </p>
                      </IonLabel>
                      <IonBadge color="warning">{treatment.status}</IonBadge>
                    </IonItem>
                  ))}
                </IonList>
                <IonButton size="small" fill="clear" onClick={() => navigate('/patients')}>
                  Gestionar pacientes
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard button onClick={() => navigate('/appointments')}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={calendarOutline} /> Nueva cita
                </IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard button onClick={() => navigate('/patients')}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={checkmarkDoneOutline} /> Planes
                </IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </PageLayout>
  );
}
