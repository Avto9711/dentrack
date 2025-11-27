import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClinic, fetchClinics } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

export function ClinicsPage() {
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const createClinicMutation = useMutation({
    mutationFn: () =>
      createClinic({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
      }),
    onSuccess: () => {
      setForm({ name: '', phone: '', email: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Clínicas</h2>
      </div>
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          createClinicMutation.mutate();
        }}
      >
        <div className="form-grid">
          <label className="form-full">
            Nombre
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Clínica central"
            />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="form-full">
            Dirección
            <textarea value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} rows={2} />
          </label>
          <button className="primary-button" type="submit" disabled={createClinicMutation.isPending}>
            {createClinicMutation.isPending ? 'Guardando...' : 'Crear clínica'}
          </button>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'name', header: 'Nombre' },
          { key: 'phone', header: 'Teléfono', render: (row: any) => row.phone || '—' },
          { key: 'email', header: 'Email', render: (row: any) => row.email || '—' },
          { key: 'address', header: 'Dirección', render: (row: any) => row.address || '—' },
          { key: 'created_at', header: 'Alta', render: (row: any) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : '—') },
        ]}
        data={clinicsQuery.data}
        isLoading={clinicsQuery.isLoading}
        emptyMessage="No hay clínicas registradas"
      />
    </div>
  );
}
