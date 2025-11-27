import { useMemo, useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonNote,
  IonText,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { fetchBudgets } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageLayout } from '@/components/PageLayout';
import { BudgetDetailModal } from '@/features/budgets/BudgetDetailModal';
import type { Budget } from '@/types/domain';
import { formatCurrency } from '@/utils/money';

export function BudgetsPage() {
  const [segment, setSegment] = useState<'valid' | 'expired'>('valid');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets(segment),
    queryFn: () => fetchBudgets({ validStatus: segment }),
  });

  const budgets = budgetsQuery.data ?? [];
  const subtitle = useMemo(() => (segment === 'valid' ? 'Vigentes' : 'Vencidos'), [segment]);

  return (
    <PageLayout title="Presupuestos">
      <IonCard className="page-block">
        <IonCardHeader>
          <IonSegment
            value={segment}
            onIonChange={(event) => setSegment((event.detail.value as 'valid' | 'expired') ?? 'valid')}
          >
            <IonSegmentButton value="valid">Vigentes</IonSegmentButton>
            <IonSegmentButton value="expired">Vencidos</IonSegmentButton>
          </IonSegment>
        </IonCardHeader>
        <IonCardContent>
          {budgets.length === 0 && !budgetsQuery.isLoading && (
            <IonText color="medium">
              {segment === 'valid'
                ? 'Genera nuevos presupuestos desde la ficha del paciente.'
                : 'No hay presupuestos vencidos.'}
            </IonText>
          )}
          <IonList lines="none" className="flush-list">
            {budgets.map((budget) => (
              <IonItem key={budget.id} button onClick={() => setSelectedBudget(budget)} className="subtle-card">
                <IonLabel>
                  <h2>{budget.patient?.fullName ?? 'Paciente'}</h2>
                  <p>{budget.items?.length ?? 0} tratamientos</p>
                </IonLabel>
                <IonBadge color="medium">{budget.status}</IonBadge>
                <IonNote slot="end">{formatCurrency(budget.totalAmount, budget.currencyCode)}</IonNote>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>
      <BudgetDetailModal
        budget={selectedBudget}
        isOpen={Boolean(selectedBudget)}
        onDismiss={() => setSelectedBudget(null)}
      />
    </PageLayout>
  );
}
