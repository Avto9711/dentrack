import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDoctor,
  deleteDoctor,
  fetchClinics,
  fetchDoctors,
  updateDoctor,
} from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

const initialForm = { userId: '', fullName: '', role: 'dentist', clinicId: '' };

type FormState = typeof initialForm;

export function DoctorsPage() {
  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = Boolean(editingId);

  const createDoctorMutation = useMutation({
    mutationFn: (values: FormState) =>
      createDoctor({
        userId: values.userId,
        fullName: values.fullName,
        role: values.role as 'dentist' | 'assistant' | 'admin',
        clinicId: values.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: (values: FormState & { id: string }) =>
      updateDoctor({
        id: values.id,
        fullName: values.fullName,
        role: values.role as 'dentist' | 'assistant' | 'admin',
        clinicId: values.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      setEditingId(null);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctors'] }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditing && editingId) {
      updateDoctorMutation.mutate({ ...form, id: editingId });
    } else {
      createDoctorMutation.mutate(form);
    }
  }

  function handleEdit(row: any) {
    setEditingId(row.id);
    setForm({
      userId: row.id,
      fullName: row.full_name,
      role: row.role,
      clinicId: row.clinic_id ?? '',
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar doctor?')) return;
    deleteDoctorMutation.mutate(id);
  }

  const isSaving = createDoctorMutation.isPending || updateDoctorMutation.isPending;

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Doctores</h2>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Supabase user ID
            <input
              required
              value={form.userId}
              onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value.trim() }))}
              placeholder="UUID"
              disabled={isEditing}
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
          <div className="form-actions form-full">
            {isEditing && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                }}
              >
                Cancelar
              </button>
            )}
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar doctor' : 'Crear doctor'}
            </button>
          </div>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'full_name', header: 'Nombre' },
          { key: 'role', header: 'Rol' },
          { key: 'clinic_name', header: 'Clínica', render: (row: any) => row.clinic_name ?? '—' },
          {
            key: 'created_at',
            header: 'Alta',
            render: (row: any) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'),
          },
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
        data={doctorsQuery.data}
        isLoading={doctorsQuery.isLoading}
        emptyMessage="No hay doctores registrados"
      />
    </div>
  );
}
