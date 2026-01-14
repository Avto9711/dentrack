import { useMemo, useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonText,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/react';
import { addOutline, createOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchAppointments, type AppointmentFilter } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageLayout } from '@/components/PageLayout';
import { formatDateTime } from '@/utils/date';
import { AddAppointmentModal } from '@/features/appointments/AddAppointmentModal';
import type { Appointment } from '@/types/domain';

const segments = [
  { value: 'today', label: 'Hoy' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Previas' },
] as const;

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<(typeof segments)[number]['value']>('today');
  const [appointmentModalState, setAppointmentModalState] = useState<{ appointment?: Appointment } | null>(null);

  const filter = useMemo<AppointmentFilter>(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (segment) {
      case 'today':
        return { from: start.toISOString(), to: end.toISOString() };
      case 'upcoming':
        return { from: now.toISOString(), status: ['scheduled', 'confirmed'] };
      case 'past':
        return { to: now.toISOString() };
      default:
        return {};
    }
  }, [segment]);

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments(segment),
    queryFn: () => fetchAppointments(filter),
  });

  const appointments = appointmentsQuery.data ?? [];

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    appointmentsQuery.refetch().finally(() => event.detail.complete());
  }

  function openCreateModal() {
    setAppointmentModalState({});
  }

  function openEditModal(appointment: Appointment) {
    setAppointmentModalState({ appointment });
  }

  function closeModal() {
    setAppointmentModalState(null);
  }

  return (
    <PageLayout title="Citas">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      <IonCard className="page-block">
        <IonCardHeader>
          <IonSegment
            value={segment}
            onIonChange={(event) =>
              setSegment((event.detail.value as (typeof segments)[number]['value']) ?? 'today')
            }
          >
            {segments.map((item) => (
              <IonSegmentButton key={item.value} value={item.value}>
                <IonLabel>{item.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonCardHeader>
        <IonCardContent>
          {appointments.length === 0 && !appointmentsQuery.isLoading && (
            <IonText color="medium">No hay citas en este filtro.</IonText>
          )}
          <IonList lines="none" className="flush-list">
            {appointments.map((appointment) => (
              <IonItem
                key={appointment.id}
                button={Boolean(appointment.patientId)}
                onClick={() => appointment.patientId && navigate(`/patients/${appointment.patientId}`)}
                className="subtle-card"
              >
                <IonLabel>
                  <h2>{appointment.patient?.fullName ?? 'Paciente'}</h2>
                  <p>{formatDateTime(appointment.startsAt)}</p>
                </IonLabel>
                <div
                  slot="end"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <IonBadge color="tertiary">{appointment.visitType}</IonBadge>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(appointment);
                    }}
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                </div>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton onClick={openCreateModal}>
          <IonIcon icon={addOutline} />
        </IonFabButton>
      </IonFab>
      <AddAppointmentModal
        isOpen={Boolean(appointmentModalState)}
        onDismiss={closeModal}
        appointment={appointmentModalState?.appointment}
      />
    </PageLayout>
  );
}
