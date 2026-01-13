import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPatient,
  deletePatient,
  fetchClinics,
  fetchPatients,
  updatePatient,
} from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/context/AuthContext';

const initialForm = { firstName: '', lastName: '', email: '', phone: '', clinicId: '' };

type PatientFormState = typeof initialForm;

type PatientRow = {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  clinic_id?: string | null;
};

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<PatientFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = Boolean(editingId);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ['patients', search],
    queryFn: () => fetchPatients(search),
  });
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });

  const createPatientMutation = useMutation({
    mutationFn: (values: PatientFormState) =>
      createPatient({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        clinicId: values.clinicId || profile?.clinic_id || null,
        createdBy: profile?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setForm(initialForm);
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: (values: PatientFormState & { id: string }) =>
      updatePatient({
        id: values.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        clinicId: values.clinicId || profile?.clinic_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setEditingId(null);
      setForm(initialForm);
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditing && editingId) {
      updatePatientMutation.mutate({ ...form, id: editingId });
    } else {
      createPatientMutation.mutate(form);
    }
  }

  function handleEdit(row: PatientRow) {
    setEditingId(row.id);
    const fullNameParts = row.full_name.split(' ');
    setForm({
      firstName: row.first_name ?? fullNameParts[0] ?? '',
      lastName: row.last_name ?? fullNameParts.slice(1).join(' '),
      email: row.email ?? '',
      phone: row.phone ?? '',
      clinicId: row.clinic_id ?? '',
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar paciente?')) return;
    deletePatientMutation.mutate(id);
  }

  const isSaving = createPatientMutation.isPending || updatePatientMutation.isPending;

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
      <form className="form-card" onSubmit={handleSubmit}>
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
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar paciente' : 'Crear paciente'}
            </button>
          </div>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'full_name', header: 'Nombre' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Teléfono' },
          {
            key: 'updated_at',
            header: 'Actualizado',
            render: (row: any) => (row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'),
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
        data={patientsQuery.data}
        isLoading={patientsQuery.isLoading}
        emptyMessage="No se encontraron pacientes"
      />
    </div>
  );
}
