import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPatient, fetchClinics, fetchPatients } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', clinicId: '' });
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const patientsQuery = useQuery({
    queryKey: ['patients', search],
    queryFn: () => fetchPatients(search),
  });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const createPatientMutation = useMutation({
    mutationFn: () =>
      createPatient({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        clinicId: form.clinicId || profile?.clinic_id || null,
        createdBy: profile?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setForm({ firstName: '', lastName: '', email: '', phone: '', clinicId: '' });
    },
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Pacientes</h2>
        <div className="page-actions">
          <input
            type="search"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="primary-button" onClick={() => patientsQuery.refetch()}>
            Refrescar
          </button>
        </div>
      </div>
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          createPatientMutation.mutate();
        }}
      >
        <div className="form-grid">
          <label>
            Nombre
            <input
              required
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            />
          </label>
          <label>
            Apellido
            <input
              required
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Clínica
            <select
              value={form.clinicId || profile?.clinic_id || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, clinicId: event.target.value }))}
            >
              <option value="">{profile?.clinic_id ? 'Predeterminada' : 'Selecciona clínica'}</option>
              {(clinicsQuery.data ?? []).map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={createPatientMutation.isPending}>
            {createPatientMutation.isPending ? 'Guardando...' : 'Crear paciente'}
          </button>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'full_name', header: 'Nombre' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Teléfono' },
          { key: 'updated_at', header: 'Actualizado', render: (row: any) => (row.updated_at ? new Date(row.updated_at).toLocaleString() : '—') },
        ]}
        data={patientsQuery.data}
        isLoading={patientsQuery.isLoading}
        emptyMessage="No se encontraron pacientes"
      />
    </div>
  );
}
