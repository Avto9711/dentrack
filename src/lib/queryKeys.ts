export const queryKeys = {
  patients: (search = '') => ['patients', search] as const,
  patientDetail: (id: string) => ['patient-detail', id] as const,
  appointments: (scope = 'all') => ['appointments', scope] as const,
  budgets: (patientId?: string) => ['budgets', patientId ?? 'all'] as const,
  treatments: (patientId: string) => ['patient-treatments', patientId] as const,
  treatmentCatalog: ['treatment-catalog'] as const,
  dashboard: {
    todayAppointments: ['dashboard', 'today-appointments'] as const,
    pendingTreatments: ['dashboard', 'pending-treatments'] as const,
  },
};
