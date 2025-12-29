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
      <IonGrid className="ion-no-padding">
        <IonRow>
          <IonCol size="12">
            <IonCard className="hero-card">
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1.5rem' }}>
                  ¡Hola, {profile?.fullName?.split(' ')[0] ?? 'Doctor/a'}!
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <h2 style={{ margin: '8px 0 4px', fontWeight: 600, fontSize: '1.1rem', opacity: 0.9 }}>
                    {appointments.length > 0
                      ? `Tienes ${appointments.length} citas para hoy`
                      : 'Tu agenda está libre por ahora'}
                  </h2>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                    Sigue cuidando las sonrisas de tus pacientes.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow style={{ marginTop: -8 }}>
          {summaryMetrics.map((metric) => (
            <IonCol size="6" key={metric.label}>
              <IonCard onClick={metric.action} button className="glass-card">
                <IonCardContent style={{ padding: '16px' }}>
                  <IonText color="medium" style={{ fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {metric.label}
                  </IonText>
                  <IonCardTitle style={{ marginTop: 8, fontSize: '1.8rem', fontWeight: 700 }}>
                    {metric.value}
                  </IonCardTitle>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>

        <IonRow>
          <IonCol size="12">
            <div className="page-block" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem' }}>Agenda de hoy</h3>
              <IonButton size="small" fill="clear" onClick={() => navigate('/appointments')} style={{ fontWeight: 600 }}>
                Ver todo
              </IonButton>
            </div>
            <IonCard style={{ marginTop: 0 }}>
              <IonCardContent style={{ padding: '8px' }}>
                {todayAppointmentsQuery.isLoading && <IonSkeletonText animated style={{ width: '100%', height: 80, borderRadius: 12 }} />}
                {!todayAppointmentsQuery.isLoading && appointments.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <IonText color="medium">No hay citas programadas para hoy.</IonText>
                  </div>
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
                      style={{ margin: '8px' }}
                    >
                      <div slot="start" className="avatar-circle" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                        {appointment.patient?.fullName?.charAt(0) ?? 'P'}
                      </div>
                      <IonLabel>
                        <h2 style={{ fontWeight: 600 }}>{appointment.patient?.fullName ?? 'Paciente'}</h2>
                        <p style={{ fontSize: '0.85rem' }}>{formatDateTime(appointment.startsAt)}</p>
                      </IonLabel>
                      <IonBadge color="tertiary" style={{ borderRadius: 8, padding: '4px 8px' }}>
                        {appointment.visitType}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12">
            <div className="page-block" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem' }}>Tratamientos</h3>
              <IonButton size="small" fill="clear" onClick={() => navigate('/patients')} style={{ fontWeight: 600 }}>
                Gestionar
              </IonButton>
            </div>
            <IonCard style={{ marginTop: 0 }}>
              <IonCardContent style={{ padding: '8px' }}>
                {pendingTreatmentsQuery.isLoading && <IonSkeletonText animated style={{ width: '100%', height: 80, borderRadius: 12 }} />}
                {!pendingTreatmentsQuery.isLoading && pendingTreatments.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <IonText color="medium">¡Todo al día! 🎉</IonText>
                  </div>
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
                      style={{ margin: '8px' }}
                    >
                      <IonLabel>
                        <h2 style={{ fontWeight: 600 }}>{treatment.treatment?.name ?? 'Tratamiento'}</h2>
                        <p style={{ fontSize: '0.85rem' }}>
                          {treatment.patient?.fullName} · <span style={{ fontWeight: 600, color: 'var(--ion-color-primary)' }}>{formatCurrency(treatment.proposedPrice ?? undefined)}</span>
                        </p>
                      </IonLabel>
                      <IonBadge color="warning" style={{ borderRadius: 8, padding: '4px 8px' }}>{treatment.status}</IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="6">
            <IonCard button onClick={() => navigate('/appointments')} className="glass-card" style={{ margin: '8px 16px 16px 16px' }}>
              <IonCardHeader style={{ padding: '16px', textAlign: 'center' }}>
                <IonIcon icon={calendarOutline} style={{ fontSize: '1.5rem', color: 'var(--ion-color-primary)', marginBottom: 8 }} />
                <IonCardTitle style={{ fontSize: '0.9rem' }}>Nueva cita</IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </IonCol>
          <IonCol size="6">
            <IonCard button onClick={() => navigate('/patients')} className="glass-card" style={{ margin: '8px 16px 16px 16px' }}>
              <IonCardHeader style={{ padding: '16px', textAlign: 'center' }}>
                <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '1.5rem', color: 'var(--ion-color-tertiary)', marginBottom: 8 }} />
                <IonCardTitle style={{ fontSize: '0.9rem' }}>Planes</IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </PageLayout>
  );
}
