import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClinic, deleteClinic, fetchClinics, updateClinic } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

const initialForm = { id: '', name: '', phone: '', email: '', address: '' };

export function ClinicsPage() {
  const clinicsQuery = useQuery({ queryKey: ['clinics'], queryFn: fetchClinics });
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = Boolean(editingId);

  const createClinicMutation = useMutation({
    mutationFn: (values: typeof initialForm) =>
      createClinic({
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
      }),
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: (values: typeof initialForm) =>
      updateClinic({
        id: values.id,
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
      }),
    onSuccess: () => {
      setEditingId(null);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });

  const deleteClinicMutation = useMutation({
    mutationFn: (id: string) => deleteClinic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinics'] }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditing && editingId) {
      updateClinicMutation.mutate({ ...form, id: editingId });
    } else {
      createClinicMutation.mutate(form);
    }
  }

  function handleEdit(row: any) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      name: row.name ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar clínica?')) return;
    deleteClinicMutation.mutate(id);
  }

  const isSaving = createClinicMutation.isPending || updateClinicMutation.isPending;

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Clínicas</h2>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
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
            <textarea
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              rows={2}
            />
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
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar clínica' : 'Crear clínica'}
            </button>
          </div>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'name', header: 'Nombre' },
          { key: 'phone', header: 'Teléfono', render: (row: any) => row.phone || '—' },
          { key: 'email', header: 'Email', render: (row: any) => row.email || '—' },
          { key: 'address', header: 'Dirección', render: (row: any) => row.address || '—' },
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
        data={clinicsQuery.data}
        isLoading={clinicsQuery.isLoading}
        emptyMessage="No hay clínicas registradas"
      />
    </div>
  );
}
