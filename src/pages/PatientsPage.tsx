import { useState } from 'react';
import {
  IonList,
  IonSearchbar,
  IonSkeletonText,
  IonFab,
  IonFabButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonText,
  type RefresherEventDetail,
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { listPatients } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PatientListItem } from '@/features/patients/PatientListItem';
import { AddPatientModal } from '@/features/patients/AddPatientModal';
import { PageLayout } from '@/components/PageLayout';
import { useNavigate } from 'react-router-dom';
import { openExternalUrl } from '@/lib/platform';

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(search),
    queryFn: () => listPatients(search),
  });

  const patients = patientsQuery.data ?? [];

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    patientsQuery.refetch().finally(() => event.detail.complete());
  }

  return (
    <PageLayout title="Pacientes">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      <IonSearchbar
        placeholder="Buscar por nombre o teléfono"
        value={search}
        onIonInput={(event) => setSearch(event.detail.value ?? '')}
      />
      {patientsQuery.isLoading && (
        <IonList>
          {Array.from({ length: 4 }).map((_, index) => (
            <IonSkeletonText key={index} animated style={{ width: '100%', height: 64 }} />
          ))}
        </IonList>
      )}
      {!patientsQuery.isLoading && patients.length === 0 && (
        <IonText className="ion-padding" color="medium">
          No hay pacientes. Agrega uno nuevo con el botón +.
        </IonText>
      )}
      <IonList inset>
        {patients.map((patient) => (
          <PatientListItem
            key={patient.id}
            patient={patient}
            onSelect={(id) => navigate(`/patients/${id}`)}
            onCall={(phone) => openExternalUrl(`tel:${phone}`)}
          />
        ))}
      </IonList>
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton onClick={() => setModalOpen(true)}>
          <IonIcon icon={addOutline} />
        </IonFabButton>
      </IonFab>
      <AddPatientModal isOpen={isModalOpen} onDismiss={() => setModalOpen(false)} />
    </PageLayout>
  );
}
