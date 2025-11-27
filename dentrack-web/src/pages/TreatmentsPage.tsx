import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTreatment, fetchClinics, fetchTreatments } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

export function TreatmentsPage() {
  const treatmentsQuery = useQuery({ queryKey: ['treatments'], queryFn: fetchTreatments });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    defaultPrice: '',
    durationMinutes: '',
    clinicId: '',
  });

  const createTreatmentMutation = useMutation({
    mutationFn: () =>
      createTreatment({
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        defaultPrice: form.defaultPrice ? Number(form.defaultPrice) : 0,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        clinicId: form.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setForm({ name: '', code: '', description: '', defaultPrice: '', durationMinutes: '', clinicId: '' });
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Tratamientos</h2>
      </div>
      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          createTreatmentMutation.mutate();
        }}
      >
        <div className="form-grid">
          <label>
            Nombre
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label>
            Código
            <input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
          </label>
          <label>
            Precio base
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.defaultPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, defaultPrice: event.target.value }))}
            />
          </label>
          <label>
            Duración (min)
            <input
              type="number"
              min="0"
              value={form.durationMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
            />
          </label>
          <label className="form-full">
            Descripción
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={2}
            />
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
          <button className="primary-button" type="submit" disabled={createTreatmentMutation.isPending}>
            {createTreatmentMutation.isPending ? 'Guardando...' : 'Crear tratamiento'}
          </button>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'name', header: 'Nombre' },
          { key: 'code', header: 'Código', render: (row: any) => row.code || '—' },
          {
            key: 'default_price',
            header: 'Precio',
            render: (row: any) => (row.default_price != null ? `$${Number(row.default_price).toFixed(2)}` : '—'),
          },
          {
            key: 'default_duration_minutes',
            header: 'Duración',
            render: (row: any) => (row.default_duration_minutes ? `${row.default_duration_minutes} min` : '—'),
          },
          { key: 'clinic_id', header: 'Clínica', render: (row: any) => row.clinic_id ?? '—' },
        ]}
        data={treatmentsQuery.data}
        isLoading={treatmentsQuery.isLoading}
        emptyMessage="No hay tratamientos registrados"
      />
    </div>
  );
}
