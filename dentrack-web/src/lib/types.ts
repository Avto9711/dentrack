export interface Patient {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  updated_at?: string | null;
  clinic_id?: string | null;
}

export interface Doctor {
  id: string;
  full_name: string;
  role: string;
  clinic_id?: string | null;
  clinic_name?: string | null;
  created_at?: string | null;
}

export interface Appointment {
  id: string;
  starts_at: string;
  status: string;
  visit_type?: string;
  patients?: { full_name: string | null } | null;
}

export interface Budget {
  id: string;
  total_amount: number;
  currency_code?: string;
  status?: string;
  valid_until?: string;
  patients?: { full_name: string | null } | null;
}

export interface Clinic {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string | null;
}

export interface Treatment {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  default_price: number;
  default_duration_minutes?: number | null;
  is_active: boolean;
  clinic_id?: string | null;
  created_at?: string | null;
}
