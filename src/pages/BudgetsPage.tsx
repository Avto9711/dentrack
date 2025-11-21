import { useState } from 'react';
import { IonList, IonItem, IonLabel, IonBadge, IonNote, IonText } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { fetchBudgets } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageLayout } from '@/components/PageLayout';
import { BudgetDetailModal } from '@/features/budgets/BudgetDetailModal';
import type { Budget } from '@/types/domain';
import { formatCurrency } from '@/utils/money';

export function BudgetsPage() {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: () => fetchBudgets(),
  });

  const budgets = budgetsQuery.data ?? [];

  return (
    <PageLayout title="Presupuestos">
      {budgets.length === 0 && !budgetsQuery.isLoading && (
        <IonText className="ion-padding" color="medium">
          Genera presupuestos desde la ficha del paciente.
        </IonText>
      )}
      <IonList inset>
        {budgets.map((budget) => (
          <IonItem key={budget.id} button onClick={() => setSelectedBudget(budget)}>
            <IonLabel>
              <h2>{budget.patient?.fullName ?? 'Paciente'}</h2>
              <p>{budget.items?.length ?? 0} tratamientos</p>
            </IonLabel>
            <IonBadge color="medium">{budget.status}</IonBadge>
            <IonNote slot="end">{formatCurrency(budget.totalAmount, budget.currencyCode)}</IonNote>
          </IonItem>
        ))}
      </IonList>
      <BudgetDetailModal
        budget={selectedBudget}
        isOpen={Boolean(selectedBudget)}
        onDismiss={() => setSelectedBudget(null)}
      />
    </PageLayout>
  );
}
