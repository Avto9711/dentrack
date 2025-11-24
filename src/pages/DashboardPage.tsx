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
} from '@ionic/react';
import { calendarOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingTreatments, fetchTodayAppointments } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageLayout } from '@/components/PageLayout';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/money';

export function DashboardPage() {
  const navigate = useNavigate();
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

  return (
    <PageLayout title="Dashboard">
      <IonGrid>
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
                <IonList>
                  {appointments.map((appointment) => (
                    <IonItem key={appointment.id}>
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
                <IonList>
                  {pendingTreatments.map((treatment) => (
                    <IonItem
                      key={treatment.id}
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
