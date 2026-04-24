import { z } from 'zod';

export const registroFacturacionSchema = z.object({
  companiaFactura: z.string().min(1, 'Requerido'),
  cliente:         z.string().min(1, 'Requerido'),
  tecnicos:        z.string().min(1, 'Requerido'),
  fechaTrabajo:    z.string().optional(),
  fechaReportado:  z.string().optional(),
  horas:           z.coerce.string().min(1, 'Requerido'),
  moneda:          z.enum(['Colones', 'Dólares']),
  montoPorHora:    z.coerce.string().optional(),
  tipoVisita:      z.string().min(1, 'Requerido'),
  descripcion:     z.string().optional(),
  pagoHorasExtra:  z.coerce.string().optional(),
  tipoCambio:      z.coerce.string().default('525'),
  montoColonizado: z.coerce.string().optional(),
});

export type RegistroFacturacionSchema = typeof registroFacturacionSchema;