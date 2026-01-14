-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.has_staff_profile()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.has_staff_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_staff_profile() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- Enable RLS on required tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_dentograms ENABLE ROW LEVEL SECURITY;

-- Clinics policies
DROP POLICY IF EXISTS clinics_staff_read ON public.clinics;
DROP POLICY IF EXISTS clinics_admin_all ON public.clinics;
DROP POLICY IF EXISTS clinics_service_all ON public.clinics;
CREATE POLICY clinics_staff_read
  ON public.clinics
  FOR SELECT
  TO authenticated
  USING (public.has_staff_profile());
CREATE POLICY clinics_admin_all
  ON public.clinics
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY clinics_service_all
  ON public.clinics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Profiles policies
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS profiles_service_all ON public.profiles;
CREATE POLICY profiles_self_read
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
CREATE POLICY profiles_admin_all
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY profiles_service_all
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patients policies
DROP POLICY IF EXISTS patients_staff_all ON public.patients;
DROP POLICY IF EXISTS patients_service_all ON public.patients;
CREATE POLICY patients_staff_all
  ON public.patients
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY patients_service_all
  ON public.patients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Treatments policies
DROP POLICY IF EXISTS treatments_staff_read ON public.treatments;
DROP POLICY IF EXISTS treatments_admin_all ON public.treatments;
DROP POLICY IF EXISTS treatments_service_all ON public.treatments;
CREATE POLICY treatments_staff_read
  ON public.treatments
  FOR SELECT
  TO authenticated
  USING (public.has_staff_profile());
CREATE POLICY treatments_admin_all
  ON public.treatments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY treatments_service_all
  ON public.treatments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Appointments policies
DROP POLICY IF EXISTS appointments_staff_all ON public.appointments;
DROP POLICY IF EXISTS appointments_service_all ON public.appointments;
CREATE POLICY appointments_staff_all
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY appointments_service_all
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patient treatments policies
DROP POLICY IF EXISTS patient_treatments_staff_all ON public.patient_treatments;
DROP POLICY IF EXISTS patient_treatments_service_all ON public.patient_treatments;
CREATE POLICY patient_treatments_staff_all
  ON public.patient_treatments
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY patient_treatments_service_all
  ON public.patient_treatments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Budgets policies
DROP POLICY IF EXISTS budgets_staff_all ON public.budgets;
DROP POLICY IF EXISTS budgets_service_all ON public.budgets;
CREATE POLICY budgets_staff_all
  ON public.budgets
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY budgets_service_all
  ON public.budgets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Budget items policies
DROP POLICY IF EXISTS budget_items_staff_all ON public.budget_items;
DROP POLICY IF EXISTS budget_items_service_all ON public.budget_items;
CREATE POLICY budget_items_staff_all
  ON public.budget_items
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY budget_items_service_all
  ON public.budget_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- WhatsApp logs policies
DROP POLICY IF EXISTS whatsapp_logs_staff_all ON public.whatsapp_logs;
DROP POLICY IF EXISTS whatsapp_logs_service_all ON public.whatsapp_logs;
CREATE POLICY whatsapp_logs_staff_all
  ON public.whatsapp_logs
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY whatsapp_logs_service_all
  ON public.whatsapp_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patient evaluations policies
DROP POLICY IF EXISTS patient_evaluations_staff_all ON public.patient_evaluations;
DROP POLICY IF EXISTS patient_evaluations_service_all ON public.patient_evaluations;
CREATE POLICY patient_evaluations_staff_all
  ON public.patient_evaluations
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY patient_evaluations_service_all
  ON public.patient_evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patient dentograms policies
DROP POLICY IF EXISTS patient_dentograms_staff_all ON public.patient_dentograms;
DROP POLICY IF EXISTS patient_dentograms_service_all ON public.patient_dentograms;
CREATE POLICY patient_dentograms_staff_all
  ON public.patient_dentograms
  FOR ALL
  TO authenticated
  USING (public.has_staff_profile())
  WITH CHECK (public.has_staff_profile());
CREATE POLICY patient_dentograms_service_all
  ON public.patient_dentograms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
