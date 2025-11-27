import type { Patient, WhatsAppMessageTemplate } from '@/types/domain';

export const whatsappTemplates: WhatsAppMessageTemplate[] = [
  {
    id: 'budget',
    label: 'Presupuesto',
    buildMessage: ({ patient, amount, summary }) =>
      `Hola ${patient.firstName}, te comparto tu presupuesto para los tratamientos acordados. Total: ${
        amount ? `$${amount.toFixed(2)}` : 'Consultar'
      }. ${summary ?? 'Por favor confirma si deseas iniciar el tratamiento.'}`,
  },
  {
    id: 'appointment',
    label: 'Recordatorio de cita',
    buildMessage: ({ patient, summary }) =>
      `Hola ${patient.firstName}, te recordamos tu cita ${summary ?? ''}. Cualquier cambio avísame por favor.`,
  },
];

export function buildWhatsAppUrl(phone: string, message: string): string {
  const sanitized = phone.replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitized}?text=${encodedMessage}`;
}

export function getDefaultPatientMessage(patient: Patient): string {
  return `Hola ${patient.firstName}, ¿cómo te encuentras hoy?`;
}
