import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTreatment,
  deleteTreatment,
  fetchClinics,
  fetchTreatments,
  updateTreatment,
} from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

const initialForm = {
  name: '',
  code: '',
  description: '',
  defaultPrice: '',
  durationMinutes: '',
  clinicId: '',
};

type FormState = typeof initialForm;

export function TreatmentsPage() {
  const treatmentsQuery = useQuery({ queryKey: ['treatments'], queryFn: fetchTreatments });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = Boolean(editingId);

  const createTreatmentMutation = useMutation({
    mutationFn: (values: FormState) =>
      createTreatment({
        name: values.name,
        code: values.code || undefined,
        description: values.description || undefined,
        defaultPrice: values.defaultPrice ? Number(values.defaultPrice) : 0,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
        clinicId: values.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
  });

  const updateTreatmentMutation = useMutation({
    mutationFn: (values: FormState & { id: string }) =>
      updateTreatment({
        id: values.id,
        name: values.name,
        code: values.code || undefined,
        description: values.description || undefined,
        defaultPrice: values.defaultPrice ? Number(values.defaultPrice) : 0,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
        clinicId: values.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setEditingId(null);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: (id: string) => deleteTreatment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatments'] }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditing && editingId) {
      updateTreatmentMutation.mutate({ ...form, id: editingId });
    } else {
      createTreatmentMutation.mutate(form);
    }
  }

  function handleEdit(row: any) {
    setEditingId(row.id);
    setForm({
      name: row.name ?? '',
      code: row.code ?? '',
      description: row.description ?? '',
      defaultPrice: row.default_price?.toString() ?? '',
      durationMinutes: row.default_duration_minutes?.toString() ?? '',
      clinicId: row.clinic_id ?? '',
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar tratamiento?')) return;
    deleteTreatmentMutation.mutate(id);
  }

  const isSaving = createTreatmentMutation.isPending || updateTreatmentMutation.isPending;

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Tratamientos</h2>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
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
          <div className="form-actions form-full">
            {isEditing && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancelar
              </button>
            )}
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar tratamiento' : 'Crear tratamiento'}
            </button>
          </div>
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
          {
            key: 'actions',
            header: 'Acciones',
            render: (row: any) => (
              <div className="table-actions">
                <button type="button" onClick={() => handleEdit(row)}>
                  Editar
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(row.id)}>
                  Eliminar
                </button>
              </div>
            ),
          },
        ]}
        data={treatmentsQuery.data}
        isLoading={treatmentsQuery.isLoading}
        emptyMessage="No hay tratamientos registrados"
      />
    </div>
  );
}
