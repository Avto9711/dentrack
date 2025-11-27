import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDoctor, fetchClinics, fetchDoctors } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

export function DoctorsPage() {
  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [form, setForm] = useState({ userId: '', fullName: '', role: 'dentist', clinicId: '' });
  const createDoctorMutation = useMutation({
    mutationFn: () =>
      createDoctor({
        userId: form.userId,
        fullName: form.fullName,
        role: form.role as 'dentist' | 'assistant' | 'admin',
        clinicId: form.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setForm({ userId: '', fullName: '', role: 'dentist', clinicId: '' });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Doctores</h2>
      </div>
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          createDoctorMutation.mutate();
        }}
      >
        <div className="form-grid">
          <label>
            Supabase user ID
            <input
              required
              value={form.userId}
              onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value.trim() }))}
              placeholder="UUID"
            />
          </label>
          <label>
            Nombre completo
            <input
              required
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </label>
          <label>
            Rol
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="admin">Admin</option>
              <option value="dentist">Dentista</option>
              <option value="assistant">Asistente</option>
            </select>
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
          <button className="primary-button" type="submit" disabled={createDoctorMutation.isPending}>
            {createDoctorMutation.isPending ? 'Guardando...' : 'Crear doctor'}
          </button>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'full_name', header: 'Nombre' },
          { key: 'role', header: 'Rol' },
          { key: 'clinic_name', header: 'Clínica', render: (row: any) => row.clinic_name ?? '—' },
          { key: 'created_at', header: 'Alta', render: (row: any) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : '—') },
        ]}
        data={doctorsQuery.data}
        isLoading={doctorsQuery.isLoading}
        emptyMessage="No hay doctores registrados"
      />
    </div>
  );
}
