-- =======================
-- 1️⃣ Clinics (optional; can remove if only 1 clinic)
-- =======================
CREATE TABLE public.clinics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =======================
-- 2️⃣ Profiles (Dentists, Assistants, Admins)
-- Extends Supabase auth.users
-- =======================
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  clinic_id   uuid REFERENCES public.clinics (id) ON DELETE SET NULL,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'dentist', 'assistant')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_clinic ON public.profiles (clinic_id);

-- =======================
-- 3️⃣ Patients
-- =======================
CREATE TABLE public.patients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid REFERENCES public.clinics (id) ON DELETE SET NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  phone           text,
  email           text,
  document_id     text,
  birth_date      date,
  gender          text,
  notes           text,
  created_by      uuid REFERENCES public.profiles (id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_clinic ON public.patients (clinic_id);
CREATE INDEX idx_patients_phone  ON public.patients (phone);

-- =======================
-- 4️⃣ Treatments Catalog
-- =======================
CREATE TABLE public.treatments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid REFERENCES public.clinics (id) ON DELETE SET NULL,
  code            text,
  name            text NOT NULL,
  description     text,
  default_price   numeric(10, 2) NOT NULL DEFAULT 0,
  default_duration_minutes integer,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatments_clinic ON public.treatments (clinic_id);

-- =======================
-- 5️⃣ Appointments (Visits)
-- =======================
CREATE TABLE public.appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid REFERENCES public.clinics (id) ON DELETE SET NULL,
  patient_id      uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  dentist_id      uuid REFERENCES public.profiles (id),
  budget_id       uuid REFERENCES public.budgets (id), -- optional forward ref (safe in Supabase)
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  visit_type      text DEFAULT 'treatment'
                  CHECK (visit_type IN ('evaluation', 'treatment', 'control', 'other')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX idx_appointments_clinic  ON public.appointments (clinic_id);
CREATE INDEX idx_appointments_status  ON public.appointments (status);

-- =======================
-- 6️⃣ Patient Treatments (Core "Pending" / "Completed" Treatment Tracker)
-- =======================
CREATE TABLE public.patient_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id),

  proposed_in_visit uuid REFERENCES public.appointments(id),
  completed_in_visit uuid REFERENCES public.appointments(id),

  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'accepted', 'scheduled', 'completed', 'declined')),

  proposed_price numeric(10,2),
  final_price numeric(10,2),

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pt_patient ON public.patient_treatments (patient_id);
CREATE INDEX idx_pt_status  ON public.patient_treatments (status);

-- =======================
-- 7️⃣ Budgets
-- Generated from patient_treatments
-- =======================
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics (id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles (id),
  status text NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled')),
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  currency_code char(3) NOT NULL DEFAULT 'USD',
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_patient ON public.budgets (patient_id);
CREATE INDEX idx_budgets_status  ON public.budgets (status);

-- =======================
-- 8️⃣ Budget Items — tied to patient_treatments
-- =======================
CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  patient_treatment_id uuid NOT NULL REFERENCES public.patient_treatments(id),
  agreed_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_budget_items_budget ON public.budget_items (budget_id);

-- =======================
-- 9️⃣ WhatsApp Message Log (optional)
-- =======================
CREATE TABLE public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  patient_id uuid REFERENCES public.patients(id),
  appointment_id uuid REFERENCES public.appointments(id),

  phone text NOT NULL,
  message text NOT NULL,
  opened_url_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_patient ON public.whatsapp_logs (patient_id);


ALTER TABLE patient_treatments
  ADD COLUMN created_source VARCHAR(20) DEFAULT 'manual'; -- 'visit' | 'manual'

ALTER TABLE patient_treatments
  ADD COLUMN diagnostic_notes TEXT NULL;

-- Already covered:
ALTER TABLE patient_treatments
  ALTER COLUMN proposed_in_visit_id DROP NOT NULL;

ALTER TABLE patient_treatments
  ALTER COLUMN completed_in_visit_id DROP NOT NULL;

