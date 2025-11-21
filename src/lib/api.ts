import { supabase } from './supabaseClient';
import type {
  Appointment,
  AppointmentStatus,
  Budget,
  BudgetItem,
  BudgetStatus,
  Patient,
  PatientSummary,
  PatientTreatment,
  PatientTreatmentWithPatient,
  TreatmentCatalogItem,
  TreatmentStatus,
  VisitType,
} from '@/types/domain';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  notes?: string;
  birthDate?: string;
  gender?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  startsAt: string;
  endsAt: string;
  visitType: VisitType;
  notes?: string;
}

export interface CreatePatientTreatmentInput {
  patientId: string;
  treatmentId: string;
  status?: TreatmentStatus;
  proposedPrice?: number;
  notes?: string;
  proposedInVisit?: string;
}

export interface CompleteTreatmentInput {
  treatmentId: string;
  completedInVisit: string;
  finalPrice?: number;
  notes?: string;
}

export interface CreateBudgetInput {
  patientId: string;
  treatmentIds: string[];
  status?: BudgetStatus;
  validUntil?: string;
  notes?: string;
}

export interface PatientDetailPayload {
  patient: Patient;
  treatments: PatientTreatment[];
  appointments: Appointment[];
  budgets: Budget[];
}

const PATIENT_COLUMNS = `
  id,
  first_name,
  last_name,
  phone,
  email,
  notes,
  birth_date,
  gender,
  created_at,
  updated_at
`;

const TREATMENT_SELECT = `
  id,
  clinic_id,
  code,
  name,
  description,
  default_price,
  default_duration_minutes,
  is_active
`;

const PATIENT_TREATMENT_SELECT = `
  id,
  patient_id,
  treatment_id,
  status,
  proposed_in_visit,
  completed_in_visit,
  proposed_price,
  final_price,
  notes,
  created_at,
  updated_at,
  treatments:treatments(${TREATMENT_SELECT})
`;

const BUDGET_SELECT = `
  id,
  patient_id,
  status,
  total_amount,
  currency_code,
  valid_until,
  notes,
  created_at,
  updated_at,
  patients:patients(${PATIENT_COLUMNS}),
  budget_items(
    id,
    budget_id,
    patient_treatment_id,
    agreed_price,
    patient_treatments:${PATIENT_TREATMENT_SELECT}
  )
`;

const APPOINTMENT_SELECT = `
  id,
  patient_id,
  dentist_id,
  starts_at,
  ends_at,
  status,
  visit_type,
  notes,
  patients:patients(${PATIENT_COLUMNS})
`;

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    birthDate: row.birth_date,
    gender: row.gender,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTreatment(row: any): TreatmentCatalogItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    defaultPrice: Number(row.default_price ?? 0),
    defaultDurationMinutes: row.default_duration_minutes,
    isActive: Boolean(row.is_active ?? true),
  };
}

function mapPatientTreatment(row: any): PatientTreatment {
  return {
    id: row.id,
    patientId: row.patient_id,
    treatmentId: row.treatment_id,
    status: row.status,
    proposedInVisit: row.proposed_in_visit,
    completedInVisit: row.completed_in_visit,
    proposedPrice: row.proposed_price ? Number(row.proposed_price) : null,
    finalPrice: row.final_price ? Number(row.final_price) : null,
    notes: row.notes,
    treatment: row.treatments ? mapTreatment(row.treatments) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    dentistId: row.dentist_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    visitType: row.visit_type,
    notes: row.notes,
    patient: row.patients ? mapPatient(row.patients) : undefined,
  };
}

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    patientId: row.patient_id,
    status: row.status,
    totalAmount: Number(row.total_amount ?? 0),
    currencyCode: row.currency_code,
    validUntil: row.valid_until,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patient: row.patients ? mapPatient(row.patients) : undefined,
    items: Array.isArray(row.budget_items)
      ? row.budget_items.map((item: any): BudgetItem => ({
          id: item.id,
          budgetId: item.budget_id,
          patientTreatmentId: item.patient_treatment_id,
          agreedPrice: Number(item.agreed_price ?? 0),
          treatment: item.patient_treatments ? mapPatientTreatment(item.patient_treatments) : undefined,
        }))
      : undefined,
  };
}

function computePendingCount(row: any): number {
  const treatments: any[] = row.patient_treatments ?? [];
  return treatments.filter((t) => ['planned', 'accepted', 'scheduled'].includes(t.status)).length;
}

function computeNextAppointment(row: any): string | null {
  const appointments: any[] = row.appointments ?? [];
  const upcoming = appointments
    .map((appt) => appt.starts_at)
    .filter((date: string | null) => (date ? new Date(date).getTime() >= Date.now() : false))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return upcoming.length > 0 ? upcoming[0] : null;
}

export async function listPatients(search?: string): Promise<PatientSummary[]> {
  let query = supabase
    .from('patients')
    .select(`${PATIENT_COLUMNS}, patient_treatments(status), appointments(starts_at, status)`) // summary info only
    .order('created_at', { ascending: false });

  if (search?.trim()) {
    const term = search.trim().replace(/,/g, '');
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...mapPatient(row),
    pendingTreatments: computePendingCount(row),
    nextAppointment: computeNextAppointment(row),
  }));
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const payload = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    notes: input.notes || null,
    birth_date: input.birthDate || null,
    gender: input.gender || null,
  };

  const { data, error } = await supabase.from('patients').insert(payload).select('*').single();
  if (error) throw error;
  return mapPatient(data);
}

export async function fetchPatientDetail(patientId: string): Promise<PatientDetailPayload> {
  const [patientRes, treatmentsRes, appointmentsRes, budgetsRes] = await Promise.all([
    supabase.from('patients').select(PATIENT_COLUMNS).eq('id', patientId).single(),
    supabase
      .from('patient_treatments')
      .select(PATIENT_TREATMENT_SELECT)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .eq('patient_id', patientId)
      .order('starts_at', { ascending: false }),
    supabase
      .from('budgets')
      .select(BUDGET_SELECT)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
  ]);

  if (patientRes.error) throw patientRes.error;
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;
  if (budgetsRes.error) throw budgetsRes.error;

  return {
    patient: mapPatient(patientRes.data),
    treatments: (treatmentsRes.data ?? []).map(mapPatientTreatment),
    appointments: (appointmentsRes.data ?? []).map(mapAppointment),
    budgets: (budgetsRes.data ?? []).map(mapBudget),
  };
}

export interface AppointmentFilter {
  from?: string;
  to?: string;
  status?: AppointmentStatus[];
}

export async function fetchAppointments(filter: AppointmentFilter = {}): Promise<Appointment[]> {
  let query = supabase.from('appointments').select(APPOINTMENT_SELECT).order('starts_at', {
    ascending: true,
  });

  if (filter.from) {
    query = query.gte('starts_at', filter.from);
  }

  if (filter.to) {
    query = query.lt('starts_at', filter.to);
  }

  if (filter.status && filter.status.length > 0) {
    query = query.in('status', filter.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: input.patientId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      visit_type: input.visitType,
      notes: input.notes ?? null,
    })
    .select(APPOINTMENT_SELECT)
    .single();

  if (error) throw error;
  return mapAppointment(data);
}

export async function fetchTreatmentCatalog(): Promise<TreatmentCatalogItem[]> {
  const { data, error } = await supabase
    .from('treatments')
    .select(TREATMENT_SELECT)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapTreatment);
}

export async function createPatientTreatment(
  input: CreatePatientTreatmentInput
): Promise<PatientTreatment> {
  const { data, error } = await supabase
    .from('patient_treatments')
    .insert({
      patient_id: input.patientId,
      treatment_id: input.treatmentId,
      proposed_price: input.proposedPrice ?? null,
      status: input.status ?? 'planned',
      proposed_in_visit: input.proposedInVisit ?? null,
      notes: input.notes ?? null,
    })
    .select(PATIENT_TREATMENT_SELECT)
    .single();

  if (error) throw error;
  return mapPatientTreatment(data);
}

export async function completePatientTreatment(
  input: CompleteTreatmentInput
): Promise<PatientTreatment> {
  const { data, error } = await supabase
    .from('patient_treatments')
    .update({
      status: 'completed',
      completed_in_visit: input.completedInVisit,
      final_price: input.finalPrice ?? null,
      notes: input.notes ?? null,
    })
    .eq('id', input.treatmentId)
    .select(PATIENT_TREATMENT_SELECT)
    .single();

  if (error) throw error;
  return mapPatientTreatment(data);
}

export async function createBudgetFromTreatments(
  input: CreateBudgetInput
): Promise<Budget> {
  if (input.treatmentIds.length === 0) {
    throw new Error('Select at least one treatment');
  }

  const treatments = await supabase
    .from('patient_treatments')
    .select('id, proposed_price, final_price')
    .in('id', input.treatmentIds);

  if (treatments.error) throw treatments.error;

  const total = (treatments.data ?? []).reduce((sum, current) => {
    const amount = Number(current.final_price ?? current.proposed_price ?? 0);
    return sum + amount;
  }, 0);

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      patient_id: input.patientId,
      status: input.status ?? 'draft',
      total_amount: total,
      valid_until: input.validUntil ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  const budgetId = data.id;

  const itemsPayload = input.treatmentIds.map((treatmentId) => {
    const treatment = treatments.data?.find((item) => item.id === treatmentId);
    const agreedPrice = Number(treatment?.final_price ?? treatment?.proposed_price ?? 0);
    return {
      budget_id: budgetId,
      patient_treatment_id: treatmentId,
      agreed_price: agreedPrice,
    };
  });

  const { error: itemsError } = await supabase.from('budget_items').insert(itemsPayload);
  if (itemsError) throw itemsError;

  const fullBudget = await supabase
    .from('budgets')
    .select(BUDGET_SELECT)
    .eq('id', budgetId)
    .single();

  if (fullBudget.error) throw fullBudget.error;
  return mapBudget(fullBudget.data);
}

export async function fetchPendingTreatments(
  limit = 6
): Promise<PatientTreatmentWithPatient[]> {
  const { data, error } = await supabase
    .from('patient_treatments')
    .select(
      `
      ${PATIENT_TREATMENT_SELECT},
      patients:patients(${PATIENT_COLUMNS})
    `
    )
    .in('status', ['planned', 'accepted', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapPatientTreatment(row),
    patient: row.patients ? mapPatient(row.patients) : undefined,
  }));
}

export async function fetchBudgets(patientId?: string): Promise<Budget[]> {
  let query = supabase.from('budgets').select(BUDGET_SELECT).order('created_at', {
    ascending: false,
  });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapBudget);
}

export async function fetchTreatmentAssignments(
  patientId: string
): Promise<PatientTreatment[]> {
  const { data, error } = await supabase
    .from('patient_treatments')
    .select(PATIENT_TREATMENT_SELECT)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPatientTreatment);
}

export async function fetchTodayAppointments(): Promise<Appointment[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}
