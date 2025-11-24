do $$ declare
    r record;
begin
    for r in (select tablename from pg_tables where schemaname = 'public') loop
        execute 'drop table if exists ' || quote_ident(r.tablename) || ' cascade';
    end loop;
end $$;

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
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

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





CREATE INDEX idx_profiles_clinic ON public.profiles (clinic_id);


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

  proposed_in_visit_id uuid REFERENCES public.appointments(id),
  completed_in_visit_id uuid REFERENCES public.appointments(id),

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



-- Add address column so patient contact data matches the evaluation form
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS address text;

-- Store structured evaluation data captured from ficha_evaluacion.pdf
CREATE TABLE public.patient_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.profiles (id),
  evaluation_date date NOT NULL DEFAULT current_date,
  has_systemic_diseases boolean NOT NULL DEFAULT false,
  systemic_diseases text,
  has_allergies boolean NOT NULL DEFAULT false,
  allergies text,
  current_medications text,
  had_surgeries boolean NOT NULL DEFAULT false,
  surgeries text,
  habits text,
  consult_reason text,
  oral_hygiene text CHECK (oral_hygiene IN ('good', 'regular', 'poor')),
  gum_status text CHECK (gum_status IN ('healthy', 'gingivitis', 'mild_periodontitis', 'severe_periodontitis')),
  has_caries boolean NOT NULL DEFAULT false,
  has_plaque boolean NOT NULL DEFAULT false,
  other_observations text,
  dentogram jsonb,
  diagnosis text,
  plan_prophylaxis boolean NOT NULL DEFAULT false,
  plan_obturation boolean NOT NULL DEFAULT false,
  plan_endodontics boolean NOT NULL DEFAULT false,
  plan_orthodontics boolean NOT NULL DEFAULT false,
  plan_periodontics boolean NOT NULL DEFAULT false,
  plan_oral_surgery boolean NOT NULL DEFAULT false,
  plan_prosthesis boolean NOT NULL DEFAULT false,
  plan_other text,
  dentist_signature text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_evaluations_patient ON public.patient_evaluations (patient_id);
CREATE INDEX idx_patient_evaluations_date ON public.patient_evaluations (evaluation_date);

CREATE TABLE IF NOT EXISTS public.patient_dentograms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  evaluation_id uuid NOT NULL REFERENCES public.patient_evaluations(id) ON DELETE CASCADE,
  tooth_number text NOT NULL,
  surface text NOT NULL,
  finding text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_dentograms_patient ON public.patient_dentograms (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_dentograms_evaluation ON public.patient_dentograms (evaluation_id);

INSERT INTO public.patient_dentograms (patient_id, evaluation_id, tooth_number, surface, finding)
SELECT
  pe.patient_id,
  pe.id,
  tooth.key AS tooth_number,
  surface.key AS surface,
  surface.value AS finding
FROM public.patient_evaluations pe
  CROSS JOIN LATERAL jsonb_each(pe.dentogram) AS tooth(key, value)
  CROSS JOIN LATERAL jsonb_each_text(tooth.value) AS surface(key, value)
WHERE pe.dentogram IS NOT NULL;

ALTER TABLE public.patient_evaluations
  DROP COLUMN IF EXISTS dentogram;
