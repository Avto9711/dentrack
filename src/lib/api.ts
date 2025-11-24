import { supabase } from './supabaseClient';
import type {
  Appointment,
  AppointmentStatus,
  Budget,
  BudgetItem,
  BudgetStatus,
  GumStatus,
  OralHygieneLevel,
  Patient,
  PatientEvaluation,
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
  address?: string;
  notes?: string;
  birthDate?: string;
  gender?: string;
  clinicId?: string | null;
  createdBy?: string;
}

export interface UpdatePatientInput extends CreatePatientInput {
  patientId: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  startsAt: string;
  endsAt: string;
  visitType: VisitType;
  notes?: string;
  dentistId?: string;
  clinicId?: string | null;
}

export interface CreatePatientTreatmentInput {
  patientId: string;
  treatmentId: string;
  status?: TreatmentStatus;
  proposedPrice?: number;
  notes?: string;
  proposedInVisit?: string;
  clinicId?: string | null;
}

export interface UpdatePatientTreatmentInput {
  id: string;
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
  createdBy?: string;
  clinicId?: string | null;
}

export interface PatientDetailPayload {
  patient: Patient;
  treatments: PatientTreatment[];
  appointments: Appointment[];
  budgets: Budget[];
  evaluations: PatientEvaluation[];
}

export interface PatientEvaluationInput {
  evaluationDate?: string;
  hasSystemicDiseases: boolean;
  systemicDiseases?: string | null;
  hasAllergies: boolean;
  allergies?: string | null;
  currentMedications?: string | null;
  hadSurgeries: boolean;
  surgeries?: string | null;
  habits?: string | null;
  consultReason?: string | null;
  oralHygiene?: OralHygieneLevel | null;
  gumStatus?: GumStatus | null;
  hasCaries: boolean;
  hasPlaque: boolean;
  otherObservations?: string | null;
  dentogram?: Record<string, unknown> | null;
  diagnosis?: string | null;
  planProphylaxis: boolean;
  planObturation: boolean;
  planEndodontics: boolean;
  planOrthodontics: boolean;
  planPeriodontics: boolean;
  planOralSurgery: boolean;
  planProsthesis: boolean;
  planOther?: string | null;
  dentistSignature?: string | null;
}

export interface CreatePatientEvaluationInput extends PatientEvaluationInput {
  patientId: string;
  dentistId?: string;
}

export interface UpdatePatientEvaluationInput extends PatientEvaluationInput {
  evaluationId: string;
  dentistId?: string;
}

export interface LogWhatsAppMessageInput {
  patientId: string;
  phone: string;
  message: string;
  createdBy: string;
  clinicId?: string | null;
  appointmentId?: string;
}

const PATIENT_COLUMNS = `
  id,
  first_name,
  last_name,
  clinic_id,
  phone,
  email,
  address,
  notes,
  birth_date,
  gender,
  created_by,
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
  proposed_in_visit_id,
  completed_in_visit_id,
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
  created_by,
  created_at,
  updated_at,
  patients:patients(${PATIENT_COLUMNS}),
  budget_items(
    id,
    budget_id,
    patient_treatment_id,
    agreed_price,
    patient_treatments(${PATIENT_TREATMENT_SELECT})
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

const PATIENT_EVALUATION_SELECT = `
  id,
  patient_id,
  dentist_id,
  evaluation_date,
  has_systemic_diseases,
  systemic_diseases,
  has_allergies,
  allergies,
  current_medications,
  had_surgeries,
  surgeries,
  habits,
  consult_reason,
  oral_hygiene,
  gum_status,
  has_caries,
  has_plaque,
  other_observations,
  dentogram,
  diagnosis,
  plan_prophylaxis,
  plan_obturation,
  plan_endodontics,
  plan_orthodontics,
  plan_periodontics,
  plan_oral_surgery,
  plan_prosthesis,
  plan_other,
  dentist_signature,
  created_at,
  updated_at
`;

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
    clinicId: row.clinic_id,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    birthDate: row.birth_date,
    gender: row.gender,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPatientEvaluation(row: any): PatientEvaluation {
  let dentogramData: Record<string, unknown> | null = null;
  if (row.dentogram && typeof row.dentogram === 'object') {
    dentogramData = row.dentogram;
  } else if (typeof row.dentogram === 'string') {
    try {
      dentogramData = JSON.parse(row.dentogram);
    } catch (error) {
      console.warn('Failed to parse dentogram JSON', error);
      dentogramData = null;
    }
  }
  return {
    id: row.id,
    patientId: row.patient_id,
    dentistId: row.dentist_id,
    evaluationDate: row.evaluation_date,
    hasSystemicDiseases: Boolean(row.has_systemic_diseases),
    systemicDiseases: row.systemic_diseases,
    hasAllergies: Boolean(row.has_allergies),
    allergies: row.allergies,
    currentMedications: row.current_medications,
    hadSurgeries: Boolean(row.had_surgeries),
    surgeries: row.surgeries,
    habits: row.habits,
    consultReason: row.consult_reason,
    oralHygiene: row.oral_hygiene,
    gumStatus: row.gum_status,
    hasCaries: Boolean(row.has_caries),
    hasPlaque: Boolean(row.has_plaque),
    otherObservations: row.other_observations,
    dentogram: dentogramData,
    diagnosis: row.diagnosis,
    planProphylaxis: Boolean(row.plan_prophylaxis),
    planObturation: Boolean(row.plan_obturation),
    planEndodontics: Boolean(row.plan_endodontics),
    planOrthodontics: Boolean(row.plan_orthodontics),
    planPeriodontics: Boolean(row.plan_periodontics),
    planOralSurgery: Boolean(row.plan_oral_surgery),
    planProsthesis: Boolean(row.plan_prosthesis),
    planOther: row.plan_other,
    dentistSignature: row.dentist_signature,
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
    createdBy: row.created_by,
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
  const payload = buildPatientPayload(input);

  const { data, error } = await supabase.from('patients').insert(payload).select('*').single();
  if (error) throw error;
  return mapPatient(data);
}

export async function updatePatient(input: UpdatePatientInput): Promise<Patient> {
  const payload = buildPatientPayload(input);

  const { data, error } = await supabase
    .from('patients')
    .update(payload)
    .eq('id', input.patientId)
    .select(PATIENT_COLUMNS)
    .single();

  if (error) throw error;
  return mapPatient(data);
}

function buildPatientPayload(input: CreatePatientInput) {
  const payload: Record<string, unknown> = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes || null,
    birth_date: input.birthDate || null,
    gender: input.gender || null,
  };

  if (typeof input.clinicId !== 'undefined') {
    payload.clinic_id = input.clinicId || null;
  }

  if (typeof input.createdBy !== 'undefined') {
    payload.created_by = input.createdBy || null;
  }

  return payload;
}

export async function fetchPatientDetail(patientId: string): Promise<PatientDetailPayload> {
  const [patientRes, treatmentsRes, appointmentsRes, budgetsRes, evaluationsRes] = await Promise.all([
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
    supabase
      .from('patient_evaluations')
      .select(PATIENT_EVALUATION_SELECT)
      .eq('patient_id', patientId)
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  if (patientRes.error) throw patientRes.error;
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;
  if (budgetsRes.error) throw budgetsRes.error;
  if (evaluationsRes.error) throw evaluationsRes.error;

  return {
    patient: mapPatient(patientRes.data),
    treatments: (treatmentsRes.data ?? []).map(mapPatientTreatment),
    appointments: (appointmentsRes.data ?? []).map(mapAppointment),
    budgets: (budgetsRes.data ?? []).map(mapBudget),
    evaluations: (evaluationsRes.data ?? []).map(mapPatientEvaluation),
  };
}

function buildEvaluationPayload(input: PatientEvaluationInput) {
  return {
    has_systemic_diseases: input.hasSystemicDiseases,
    systemic_diseases: input.systemicDiseases || null,
    has_allergies: input.hasAllergies,
    allergies: input.allergies || null,
    current_medications: input.currentMedications || null,
    had_surgeries: input.hadSurgeries,
    surgeries: input.surgeries || null,
    habits: input.habits || null,
    consult_reason: input.consultReason || null,
    oral_hygiene: input.oralHygiene || null,
    gum_status: input.gumStatus || null,
    has_caries: input.hasCaries,
    has_plaque: input.hasPlaque,
    other_observations: input.otherObservations || null,
    dentogram: input.dentogram ?? null,
    diagnosis: input.diagnosis || null,
    plan_prophylaxis: input.planProphylaxis,
    plan_obturation: input.planObturation,
    plan_endodontics: input.planEndodontics,
    plan_orthodontics: input.planOrthodontics,
    plan_periodontics: input.planPeriodontics,
    plan_oral_surgery: input.planOralSurgery,
    plan_prosthesis: input.planProsthesis,
    plan_other: input.planOther || null,
    dentist_signature: input.dentistSignature || null,
  };
}

export async function createPatientEvaluation(
  input: CreatePatientEvaluationInput
): Promise<PatientEvaluation> {
  const payload: Record<string, unknown> = {
    patient_id: input.patientId,
    dentist_id: input.dentistId ?? null,
    ...buildEvaluationPayload(input),
  };
  if (input.evaluationDate) {
    payload.evaluation_date = input.evaluationDate;
  }

  const { data, error } = await supabase
    .from('patient_evaluations')
    .insert(payload)
    .select(PATIENT_EVALUATION_SELECT)
    .single();

  if (error) throw error;
  return mapPatientEvaluation(data);
}

export async function updatePatientEvaluation(
  input: UpdatePatientEvaluationInput
): Promise<PatientEvaluation> {
  const { evaluationId, ...rest } = input;
  const payload = buildEvaluationPayload(rest);
  const updatePayload: Record<string, unknown> = { ...payload };
  if (rest.evaluationDate) {
    updatePayload.evaluation_date = rest.evaluationDate;
  }
  if (typeof rest.dentistId !== 'undefined') {
    updatePayload.dentist_id = rest.dentistId ?? null;
  }

  const { data, error } = await supabase
    .from('patient_evaluations')
    .update(updatePayload)
    .eq('id', evaluationId)
    .select(PATIENT_EVALUATION_SELECT)
    .single();

  if (error) throw error;
  return mapPatientEvaluation(data);
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
      clinic_id: input.clinicId ?? null,
      patient_id: input.patientId,
      dentist_id: input.dentistId ?? null,
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
      clinic_id: input.clinicId ?? null,
      patient_id: input.patientId,
      treatment_id: input.treatmentId,
      proposed_price: input.proposedPrice ?? null,
      status: input.status ?? 'planned',
      proposed_in_visit_id: input.proposedInVisit ?? null,
      notes: input.notes ?? null,
    })
    .select(PATIENT_TREATMENT_SELECT)
    .single();

  if (error) throw error;
  return mapPatientTreatment(data);
}

export async function updatePatientTreatment(
  input: UpdatePatientTreatmentInput
): Promise<PatientTreatment> {
  const payload = {
    treatment_id: input.treatmentId,
    status: input.status ?? 'planned',
    proposed_price: input.proposedPrice ?? null,
    notes: input.notes ?? null,
    proposed_in_visit_id: input.proposedInVisit ?? null,
  };

  const { data, error } = await supabase
    .from('patient_treatments')
    .update(payload)
    .eq('id', input.id)
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
      completed_in_visit_id: input.completedInVisit,
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
      clinic_id: input.clinicId ?? null,
      patient_id: input.patientId,
      status: input.status ?? 'draft',
      total_amount: total,
      valid_until: input.validUntil ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
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

export async function logWhatsAppMessage(input: LogWhatsAppMessageInput): Promise<void> {
  const payload = {
    patient_id: input.patientId,
    phone: input.phone,
    message: input.message,
    created_by: input.createdBy,
    clinic_id: input.clinicId ?? null,
    appointment_id: input.appointmentId ?? null,
  };

  const { error } = await supabase.from('whatsapp_logs').insert(payload);
  if (error) throw error;
}
