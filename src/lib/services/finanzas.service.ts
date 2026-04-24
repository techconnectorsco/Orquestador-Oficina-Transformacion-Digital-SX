import { db } from '$lib/server/db';
import { registrosFacturacion, users, perfiles, type RegistroFacturacion } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export class FinanzasService {
  async getByCreadoPor(userId: string) {
    return await db
      .select()
      .from(registrosFacturacion)
      .where(eq(registrosFacturacion.creadoPor, userId))
      .orderBy(desc(registrosFacturacion.createdAt));
  }

  async getAll() {
    return await db
      .select({
        registro: registrosFacturacion,
        nombreUsuario: perfiles.nombreCompleto,
      })
      .from(registrosFacturacion)
      .leftJoin(perfiles, eq(registrosFacturacion.creadoPor, perfiles.id))
      .orderBy(desc(registrosFacturacion.createdAt));
  }

  async create(data: {
    creadoPor:       string;
    companiaFactura: string;
    cliente:         string;
    tecnicos:        string;
    fechaTrabajo?:   string;
    fechaReportado?: string;
    horas:           string;
    moneda:          string;
    montoPorHora?:   string;
    tipoVisita:      string;
    descripcion?:    string;
    pagoHorasExtra?: string;
    tipoCambio:      string;
    montoColonizado?: string;
  }) {
    const result = await db.insert(registrosFacturacion).values(data).returning();
    return result[0];
  }

  async vincularFactura(id: string, numeroFactura: string) {
    const result = await db
      .update(registrosFacturacion)
      .set({ numeroFactura, fechaFactura: new Date(), updatedAt: new Date() })
      .where(eq(registrosFacturacion.id, id))
      .returning();
    return result[0];
  }

  async update(id: string, data: Partial<RegistroFacturacion>) {
    const result = await db
      .update(registrosFacturacion)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(registrosFacturacion.id, id))
      .returning();
    return result[0];
  }
}

export const finanzasService = new FinanzasService();