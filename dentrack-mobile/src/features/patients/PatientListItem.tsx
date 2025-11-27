import {
  IonItem,
  IonAvatar,
  IonLabel,
  IonNote,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { chevronForwardOutline, callOutline } from 'ionicons/icons';
import type { PatientSummary } from '@/types/domain';
import { formatDate } from '@/utils/date';

interface PatientListItemProps {
  patient: PatientSummary;
  onSelect: (patientId: string) => void;
  onCall?: (phone: string) => void;
}

export function PatientListItem({ patient, onSelect, onCall }: PatientListItemProps) {
  const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <IonItem lines="none" className="subtle-card" detail={false} button onClick={() => onSelect(patient.id)}>
      <IonAvatar slot="start">
        <div className="avatar-circle">{initials}</div>
      </IonAvatar>
      <IonLabel>
        <h2>{patient.fullName}</h2>
        {patient.phone && <IonNote>{patient.phone}</IonNote>}
        {patient.nextAppointment && (
          <IonNote color="medium">Próxima cita: {formatDate(patient.nextAppointment)}</IonNote>
        )}
      </IonLabel>
      <div className="ion-text-right" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <IonBadge color={patient.pendingTreatments > 0 ? 'warning' : 'success'}>
          {patient.pendingTreatments} pendientes
        </IonBadge>
        <div>
          {patient.phone && (
            <IonButton
              size="small"
              fill="clear"
              onClick={(event) => {
                event.stopPropagation();
                onCall?.(patient.phone!);
              }}
            >
              <IonIcon icon={callOutline} slot="icon-only" />
            </IonButton>
          )}
          <IonButton size="small" fill="clear" onClick={() => onSelect(patient.id)}>
            <IonIcon icon={chevronForwardOutline} slot="icon-only" />
          </IonButton>
        </div>
      </div>
    </IonItem>
  );
}
