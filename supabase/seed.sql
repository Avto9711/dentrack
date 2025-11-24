-- Seed script to preload a full patient profile with appointments, treatments,
-- budgets, and evaluation data for demo purposes.
BEGIN;

-- cleanup any previous runs
DELETE FROM public.patients WHERE email = 'full.patient@example.com';
DELETE FROM public.clinics WHERE name = 'Clínica Demo Odontológica';
DELETE FROM public.treatments WHERE code IN ('PROF-DEMO', 'OBT16-DEMO');

-- keep profile idempotent as well
DELETE FROM public.whatsapp_logs WHERE created_by IN (
  SELECT id FROM public.profiles WHERE id = 'cb2ca543-5536-4559-89a0-595bb270b134'::uuid
);
DELETE FROM public.profiles WHERE id = 'cb2ca543-5536-4559-89a0-595bb270b134'::uuid;

WITH clinic AS (
  INSERT INTO public.clinics (name, phone, email, address)
  VALUES (
    'Clínica Demo Odontológica',
    '809-555-0101',
    'demo@odontologica.test',
    'Av. Bolívar 120, Santo Domingo'
  )
  RETURNING id
), dentist_profile AS (
  INSERT INTO public.profiles (
    id,
    clinic_id,
    full_name,
    role
  )
  SELECT
    'cb2ca543-5536-4559-89a0-595bb270b134'::uuid,
    clinic.id,
    'Melody Dentista',
    'dentist'
  FROM clinic
  RETURNING id, clinic_id
), patient AS (
  INSERT INTO public.patients (
    clinic_id,
    first_name,
    last_name,
    phone,
    email,
    document_id,
    birth_date,
    gender,
    notes,
    address,
    created_by
  )
  SELECT
    clinic.id,
    'Valeria',
    'Morales',
    '809-555-3322',
    'full.patient@example.com',
    '402-1234567-8',
    '1990-06-17',
    'female',
    'Paciente con sensibilidad dental. Prefiere recordatorios por WhatsApp.',
    'C/ Arboleda 45, Torre B, Apt 12',
    dentist_profile.id
  FROM clinic, dentist_profile
  RETURNING id, clinic_id
), appointments AS (
  INSERT INTO public.appointments (
    clinic_id,
    patient_id,
    dentist_id,
    starts_at,
    ends_at,
    status,
    visit_type,
    notes
  )
  SELECT
    patient.clinic_id,
    patient.id,
    dentist_profile.id,
    slot.start_time,
    slot.start_time + interval '1 hour',
    slot.status,
    slot.visit_type,
    slot.notes
  FROM patient, dentist_profile
  CROSS JOIN LATERAL (
    VALUES
      (NOW() - INTERVAL '20 days', 'evaluation', 'Evaluación inicial y radiografías', 'completed'),
      (NOW() - INTERVAL '5 days', 'treatment', 'Aplicación de resina en pieza 1.6', 'completed'),
      (NOW() + INTERVAL '10 days', 'control', 'Control y revisión de encías', 'scheduled')
  ) AS slot(start_time, visit_type, notes, status)
  RETURNING id, patient_id
), treatments AS (
  INSERT INTO public.treatments (
    clinic_id,
    code,
    name,
    description,
    default_price,
    default_duration_minutes
  )
  SELECT
    patient.clinic_id,
    data.code,
    data.name,
    data.description,
    data.price,
    data.duration
  FROM patient
  CROSS JOIN (
    VALUES
      ('PROF-DEMO', 'Profilaxis completa', 'Limpieza general con profilaxis y flúor', 120, 60),
      ('OBT16-DEMO', 'Obturación premolar', 'Resina fotocurada en pieza 1.6', 200, 90)
  ) AS data(code, name, description, price, duration)
  RETURNING id, code, default_price
), patient_treatments AS (
  INSERT INTO public.patient_treatments (
    clinic_id,
    patient_id,
    treatment_id,
    status,
    proposed_price,
    final_price,
    notes
  )
  SELECT
    patient.clinic_id,
    patient.id,
    treatments.id,
    CASE WHEN treatments.code = 'PROF-DEMO' THEN 'completed' ELSE 'accepted' END,
    CASE WHEN treatments.code = 'PROF-DEMO' THEN NULL ELSE treatments.default_price END,
    CASE WHEN treatments.code = 'PROF-DEMO' THEN treatments.default_price ELSE NULL END,
    CASE
      WHEN treatments.code = 'PROF-DEMO' THEN 'Profilaxis completada sin incidencias.'
      ELSE 'Requiere restauración por caries interproximal en pieza 1.6.'
    END
  FROM patient
  JOIN treatments ON TRUE
  RETURNING id, patient_id, final_price, proposed_price
), budget AS (
  INSERT INTO public.budgets (
    clinic_id,
    patient_id,
    status,
    total_amount,
    currency_code,
    valid_until,
    notes,
    created_by
  )
  SELECT
    patient.clinic_id,
    patient.id,
    'sent',
    COALESCE(
      (SELECT SUM(COALESCE(pt.final_price, pt.proposed_price, 0)) FROM patient_treatments pt),
      0
    ),
    'USD',
    (NOW() + INTERVAL '30 days')::date,
    'Plan integral con seguimiento periodontal en 2 semanas.',
    dentist_profile.id
  FROM patient, dentist_profile
  RETURNING id
), budget_items AS (
  INSERT INTO public.budget_items (budget_id, patient_treatment_id, agreed_price)
  SELECT
    budget.id,
    pt.id,
    COALESCE(pt.final_price, pt.proposed_price, 0)
  FROM budget
  JOIN patient_treatments pt ON TRUE
  RETURNING id
), evaluation AS (
  INSERT INTO public.patient_evaluations (
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
    dentist_signature
  )
  SELECT
    patient.id,
    dentist_profile.id,
    (NOW() - INTERVAL '20 days')::date,
    TRUE,
    'Hipertensión controlada',
    TRUE,
    'Alergia a penicilina',
    'Losartan 50mg diarios',
    FALSE,
    NULL,
    'Bruxismo nocturno ocasional. Café 2 tazas/día.',
    'Sensibilidad al masticar lado superior derecho.',
    'regular',
    'gingivitis',
    TRUE,
    TRUE,
    'Inflamación localizada en premolares superiores.',
    '{"16":{"occlusal":"caries"},"24":{"mesial":"resina"}}'::jsonb,
    'Gingivitis localizada con caries activas en cuadrante superior derecho.',
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    FALSE,
    FALSE,
    'Control de bruxismo con férula nocturna.',
    'Dra. López'
  FROM patient, dentist_profile
  RETURNING id
),
expired_budget_1 AS (

  INSERT INTO public.budgets (
  clinic_id,
  patient_id,
  status,
  total_amount,
  currency_code,
  valid_until,
  notes,
  created_by
)
SELECT
  patient.clinic_id,
  patient.id,
  'sent',
  450,
  'USD',
  (NOW() - INTERVAL '10 days')::date,
  'Plan vencido de rehabilitación estética.',
  dentist_profile.id
FROM patient, dentist_profile
LIMIT 1
RETURNING id, valid_until, clinic_id, patient_id
), 
expired_budget_2 AS
(
INSERT INTO public.budgets (
  clinic_id,
  patient_id,
  status,
  total_amount,
  currency_code,
  valid_until,
  notes,
  created_by
)
SELECT
  patient.clinic_id,
  patient.id,
  'accepted',
  320,
  'USD',
  (NOW() - INTERVAL '40 days')::date,
  'Presupuesto vencido para mantenimiento periodontal.',
  dentist_profile.id
FROM patient, dentist_profile
LIMIT 1
RETURNING id, valid_until, clinic_id, patient_id 
),
expirder_budget_items AS 
(
INSERT INTO public.budget_items (budget_id, patient_treatment_id, agreed_price)
SELECT
  b.id,
  pt.id,
  COALESCE(pt.final_price, pt.proposed_price, 0)
FROM expired_budget_1, expired_budget_2  b
JOIN patient_treatments pt ON pt.patient_id = b.patient_id
WHERE b.valid_until < NOW()
  AND NOT EXISTS (
    SELECT 1
    FROM public.budget_items bi
    WHERE bi.budget_id = b.id
      AND bi.patient_treatment_id = pt.id
  )
)
SELECT 'patient_profile_seeded' AS status;


COMMIT;

