export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type VisitType = 'evaluation' | 'treatment' | 'control' | 'other';

export type TreatmentStatus = 'planned' | 'accepted' | 'scheduled' | 'completed' | 'declined';

export type UserRole = 'admin' | 'dentist' | 'assistant';

export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  clinicId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary extends Patient {
  pendingTreatments: number;
  nextAppointment?: string | null;
}

export interface TreatmentCatalogItem {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  defaultPrice: number;
  defaultDurationMinutes?: number | null;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId?: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  visitType: VisitType;
  notes?: string | null;
  patient?: Patient;
}

export interface PatientTreatment {
  id: string;
  patientId: string;
  treatmentId: string;
  status: TreatmentStatus;
  proposedInVisit?: string | null;
  completedInVisit?: string | null;
  proposedPrice?: number | null;
  finalPrice?: number | null;
  notes?: string | null;
  treatment?: TreatmentCatalogItem | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientTreatmentWithPatient extends PatientTreatment {
  patient?: Patient;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  patientTreatmentId: string;
  agreedPrice: number;
  treatment?: PatientTreatment;
}

export interface Budget {
  id: string;
  patientId: string;
  status: BudgetStatus;
  totalAmount: number;
  currencyCode: string;
  validUntil?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: BudgetItem[];
  patient?: Patient;
}

export type OralHygieneLevel = 'good' | 'regular' | 'poor';
export type GumStatus = 'healthy' | 'gingivitis' | 'mild_periodontitis' | 'severe_periodontitis';

export interface PatientEvaluation {
  id: string;
  patientId: string;
  dentistId?: string | null;
  evaluationDate: string;
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
  createdAt: string;
  updatedAt: string;
  dentogramEntries?: PatientDentogramEntry[];
}

export interface PatientDentogramEntry {
  id: string;
  patientId: string;
  evaluationId: string;
  toothNumber: string;
  surface: string;
  finding: string;
  createdAt: string;
}

export interface WhatsAppMessageTemplate {
  id: string;
  label: string;
  buildMessage: (ctx: { patient: Patient; amount?: number; summary?: string }) => string;
}
