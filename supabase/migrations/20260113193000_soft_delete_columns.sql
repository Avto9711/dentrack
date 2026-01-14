-- Add deleted_at column to support soft deletes across key tables
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.patient_treatments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.whatsapp_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.patient_evaluations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.patient_dentograms ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
