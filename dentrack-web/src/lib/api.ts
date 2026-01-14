import { supabase } from '@/lib/supabaseClient';
import type { Appointment, Budget, Clinic, Doctor, Patient, Treatment } from '@/lib/types';

async function softDelete(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchPatients(search?: string): Promise<Patient[]> {
  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, phone, email, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (search) {
    const sanitized = search.trim();
    if (sanitized) {
      query = query.or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as Array<{ first_name?: string | null; last_name?: string | null } & Record<string, unknown>>;
  return rows.map((row) => {
    const firstName = row.first_name ?? '';
    const lastName = row.last_name ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || firstName || lastName || 'Sin nombre';
    return { ...row, full_name: fullName } as Patient;
  });
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, clinic_id, clinic:clinics(name)')
    .eq('role', 'dentist')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ clinic?: { name?: string | null } | null; [key: string]: any }>;
  return rows.map((row) => {
    const { clinic, ...rest } = row;
    return {
      ...rest,
      clinic_name: clinic?.name ?? null,
    } as Doctor;
  });
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, status, visit_type, patients(first_name, last_name)')
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    starts_at: string;
    status: string;
    visit_type?: string | null;
    patients?: { first_name?: string | null; last_name?: string | null } | null;
  }>;
  return rows.map((row) => ({
    ...row,
    patients: row.patients
      ? {
          ...row.patients,
          full_name: `${row.patients.first_name ?? ''} ${row.patients.last_name ?? ''}`.trim(),
        }
      : null,
  })) as Appointment[];
}

export async function fetchBudgets(valid?: boolean): Promise<Budget[]> {
  let query = supabase
    .from('budgets')
    .select('id, total_amount, currency_code, status, valid_until, patients(first_name, last_name)')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (valid === true) {
    query = query.gte('valid_until', new Date().toISOString());
  } else if (valid === false) {
    query = query.lt('valid_until', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    total_amount: number;
    currency_code?: string | null;
    status?: string | null;
    valid_until?: string | null;
    patients?: { first_name?: string | null; last_name?: string | null } | null;
  }>;
  return rows.map((row) => ({
    ...row,
    patients: row.patients
      ? {
          ...row.patients,
          full_name: `${row.patients.first_name ?? ''} ${row.patients.last_name ?? ''}`.trim(),
        }
      : null,
  })) as Budget[];
}

export async function fetchDashboardStats() {
  const [patientsCount, appointmentsCount, budgetsCount] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('budgets').select('*', { count: 'exact', head: true }).is('deleted_at', null),
  ]);

  return {
    patients: patientsCount.count ?? 0,
    appointments: appointmentsCount.count ?? 0,
    budgets: budgetsCount.count ?? 0,
  };
}

export async function fetchClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, phone, email, address, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Clinic[];
}

export async function fetchTreatments(): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from('treatments')
    .select('id, name, code, description, default_price, default_duration_minutes, is_active, clinic_id, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Treatment[];
}

export async function createClinic(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Clinic> {
  const { data, error } = await supabase
    .from('clinics')
    .insert({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    })
    .select('id, name, phone, email, address, created_at')
    .single();
  if (error) throw error;
  return data as Clinic;
}

export async function createPatient(input: {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  clinicId?: string | null;
  createdBy?: string | null;
}): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone || null,
      email: input.email || null,
      clinic_id: input.clinicId || null,
      created_by: input.createdBy || null,
    })
    .select('id, first_name, last_name, phone, email, clinic_id, updated_at')
    .single();
  if (error) throw error;
  const firstName = data.first_name ?? '';
  const lastName = data.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || firstName || lastName;
  return { ...data, full_name: fullName } as Patient;
}

export async function createDoctor(input: {
  userId: string;
  fullName: string;
  role: 'dentist' | 'assistant' | 'admin';
  clinicId?: string | null;
}): Promise<Doctor> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: input.userId,
      full_name: input.fullName,
      role: input.role,
      clinic_id: input.clinicId || null,
    })
    .select('id, full_name, role, clinic_id, created_at, clinic:clinics(name)')
    .single();
  if (error) throw error;
  return {
    ...data,
    clinic_name: (data as any)?.clinic?.name ?? null,
  } as Doctor;
}

export async function createTreatment(input: {
  name: string;
  code?: string;
  description?: string;
  defaultPrice?: number;
  durationMinutes?: number;
  clinicId?: string | null;
}): Promise<Treatment> {
  const { data, error } = await supabase
    .from('treatments')
    .insert({
      name: input.name,
      code: input.code || null,
      description: input.description || null,
      default_price: input.defaultPrice ?? 0,
      default_duration_minutes: input.durationMinutes ?? null,
      clinic_id: input.clinicId || null,
    })
    .select('id, name, code, description, default_price, default_duration_minutes, is_active, clinic_id, created_at')
    .single();
  if (error) throw error;
  return data as Treatment;
}

export async function updateClinic(input: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Clinic> {
  const { data, error } = await supabase
    .from('clinics')
    .update({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    })
    .eq('id', input.id)
    .select('id, name, phone, email, address, created_at')
    .single();
  if (error) throw error;
  return data as Clinic;
}

export async function deleteClinic(id: string) {
  await softDelete('clinics', id);
}

export async function updatePatient(input: {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  clinicId?: string | null;
}): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone || null,
      email: input.email || null,
      clinic_id: input.clinicId || null,
    })
    .eq('id', input.id)
    .select('id, first_name, last_name, phone, email, clinic_id, updated_at')
    .single();
  if (error) throw error;
  const firstName = data.first_name ?? '';
  const lastName = data.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || firstName || lastName;
  return { ...data, full_name: fullName } as Patient;
}

export async function deletePatient(id: string) {
  await softDelete('patients', id);
}

export async function updateDoctor(input: {
  id: string;
  fullName: string;
  role: 'admin' | 'dentist' | 'assistant';
  clinicId?: string | null;
}): Promise<Doctor> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      role: input.role,
      clinic_id: input.clinicId || null,
    })
    .eq('id', input.id)
    .select('id, full_name, role, clinic_id, created_at, clinic:clinics(name)')
    .single();
  if (error) throw error;
  return {
    ...data,
    clinic_name: (data as any)?.clinic?.name ?? null,
  } as Doctor;
}

export async function deleteDoctor(id: string) {
  await softDelete('profiles', id);
}

export async function updateTreatment(input: {
  id: string;
  name: string;
  code?: string;
  description?: string;
  defaultPrice?: number;
  durationMinutes?: number;
  clinicId?: string | null;
}): Promise<Treatment> {
  const { data, error } = await supabase
    .from('treatments')
    .update({
      name: input.name,
      code: input.code || null,
      description: input.description || null,
      default_price: input.defaultPrice ?? 0,
      default_duration_minutes: input.durationMinutes ?? null,
      clinic_id: input.clinicId || null,
    })
    .eq('id', input.id)
    .select('id, name, code, description, default_price, default_duration_minutes, is_active, clinic_id, created_at')
    .single();
  if (error) throw error;
  return data as Treatment;
}

export async function deleteTreatment(id: string) {
  await softDelete('treatments', id);
}
