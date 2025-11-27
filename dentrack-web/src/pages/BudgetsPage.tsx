import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBudgets } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

export function BudgetsPage() {
  const [tab, setTab] = useState<'all' | 'valid' | 'expired'>('all');
  const budgetsQuery = useQuery({
    queryKey: ['budgets', tab],
    queryFn: () => fetchBudgets(tab === 'valid' ? true : tab === 'expired' ? false : undefined),
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Presupuestos</h2>
        <div className="tabs">
          {[
            { label: 'Todos', value: 'all' },
            { label: 'Vigentes', value: 'valid' },
            { label: 'Vencidos', value: 'expired' },
          ].map((option) => (
            <button
              key={option.value}
              className={tab === option.value ? 'pill active' : 'pill'}
              onClick={() => setTab(option.value as typeof tab)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'patients', header: 'Paciente', render: (row: any) => row.patients?.full_name ?? '—' },
          { key: 'total_amount', header: 'Total', render: (row: any) => `${row.total_amount ?? '-'} ${row.currency_code ?? ''}` },
          { key: 'status', header: 'Estado' },
          { key: 'valid_until', header: 'Vence', render: (row: any) => (row.valid_until ? new Date(row.valid_until).toLocaleDateString() : '—') },
        ]}
        data={budgetsQuery.data}
        isLoading={budgetsQuery.isLoading}
        emptyMessage="No se encontraron presupuestos"
      />
    </div>
  );
}
