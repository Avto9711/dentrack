import { useQuery } from '@tanstack/react-query';
import { fetchAppointments, fetchDashboardStats, fetchPatients } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

export function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: fetchDashboardStats, refetchInterval: 60_000 });
  const patientsQuery = useQuery({ queryKey: ['patients', 'latest'], queryFn: () => fetchPatients(), staleTime: 60_000 });
  const appointmentsQuery = useQuery({ queryKey: ['appointments', 'latest'], queryFn: fetchAppointments, staleTime: 60_000 });

  const metricCards = [
    { label: 'Pacientes', value: statsQuery.data?.patients ?? '—' },
    { label: 'Citas', value: statsQuery.data?.appointments ?? '—' },
    { label: 'Presupuestos', value: statsQuery.data?.budgets ?? '—' },
  ];

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Resumen</h2>
      </div>
      <div className="metrics-grid">
        {metricCards.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <section className="section-grid">
        <div>
          <h3>Últimos pacientes</h3>
          <DataTable
            columns={[
              { key: 'full_name', header: 'Nombre' },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Teléfono' },
            ]}
            data={patientsQuery.data}
            isLoading={patientsQuery.isLoading}
            emptyMessage="Sin pacientes"
          />
        </div>
        <div>
          <h3>Próximas citas</h3>
          <DataTable
            columns={[
              { key: 'patients', header: 'Paciente', render: (row: any) => row.patients?.full_name ?? '—' },
              { key: 'starts_at', header: 'Inicio', render: (row: any) => new Date(row.starts_at).toLocaleString() },
              { key: 'status', header: 'Estado' },
            ]}
            data={appointmentsQuery.data}
            isLoading={appointmentsQuery.isLoading}
            emptyMessage="Sin citas"
          />
        </div>
      </section>
    </div>
  );
}
