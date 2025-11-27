import { useQuery } from '@tanstack/react-query';
import { fetchAppointments } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

export function AppointmentsPage() {
  const appointmentsQuery = useQuery({ queryKey: ['appointments', 'all'], queryFn: fetchAppointments });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Citas</h2>
      </div>
      <DataTable
        columns={[
          { key: 'patients', header: 'Paciente', render: (row: any) => row.patients?.full_name ?? '—' },
          { key: 'starts_at', header: 'Inicio', render: (row: any) => new Date(row.starts_at).toLocaleString() },
          { key: 'visit_type', header: 'Tipo' },
          { key: 'status', header: 'Estado' },
        ]}
        data={appointmentsQuery.data}
        isLoading={appointmentsQuery.isLoading}
        emptyMessage="No hay citas registradas"
      />
    </div>
  );
}
