import { db } from '$lib/server/db';
import { casosExito, clientes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

// Tipo que espera el componente (snake_case para compatibilidad con el frontend)
export interface CasoExito {
	id: string;
	titulo: string;
	descripcion: string;
	industria: string | null;
	tipo_automatizacion: string | null;
	metricas_publicas: {
		icon?: string;
		stats?: Array<{ valor: string; label: string }>;
	} | null;
	imagen_url: string | null;
	esta_publicado: boolean | null;
	orden: number | null;
	mostrar_cliente: boolean | null;
	created_at: Date | null;
	updated_at: Date | null;
	clientes: {
		id: string;
		nombre: string;
		slug: string;
		logo_url: string | null;
	} | null;
}

// Transforma el resultado de Drizzle al formato que espera el componente
function transformCasoExito(row: { 
	caso: typeof casosExito.$inferSelect; 
	cliente: typeof clientes.$inferSelect | null 
}): CasoExito {
	return {
		id: row.caso.id,
		titulo: row.caso.titulo,
		descripcion: row.caso.descripcion,
		industria: row.caso.industria,
		tipo_automatizacion: row.caso.tipoAutomatizacion,
		metricas_publicas: row.caso.metricasPublicas as CasoExito['metricas_publicas'],
		imagen_url: row.caso.imagenUrl,
		esta_publicado: row.caso.estaPublicado,
		orden: row.caso.orden,
		mostrar_cliente: row.caso.mostrarCliente,
		created_at: row.caso.createdAt,
		updated_at: row.caso.updatedAt,
		clientes: row.cliente ? {
			id: row.cliente.id,
			nombre: row.cliente.nombre,
			slug: row.cliente.slug,
			logo_url: row.cliente.logoUrl
		} : null
	};
}

export class CasosExitoService {
	async getAll(): Promise<CasoExito[]> {
		const rows = await db
			.select({ caso: casosExito, cliente: clientes })
			.from(casosExito)
			.leftJoin(clientes, eq(casosExito.clienteId, clientes.id))
			.orderBy(asc(casosExito.orden));
		
		return rows.map(transformCasoExito);
	}

	async getVisibles(): Promise<CasoExito[]> {
		const rows = await db
			.select({ caso: casosExito, cliente: clientes })
			.from(casosExito)
			.leftJoin(clientes, eq(casosExito.clienteId, clientes.id))
			.where(eq(casosExito.estaPublicado, true))
			.orderBy(asc(casosExito.orden));
		
		return rows.map(transformCasoExito);
	}

	async getById(id: string): Promise<CasoExito | null> {
		const rows = await db
			.select({ caso: casosExito, cliente: clientes })
			.from(casosExito)
			.leftJoin(clientes, eq(casosExito.clienteId, clientes.id))
			.where(eq(casosExito.id, id))
			.limit(1);
		
		return rows[0] ? transformCasoExito(rows[0]) : null;
	}

	async create(data: {
		titulo: string;
		descripcion: string;
		industria?: string;
		tipoAutomatizacion?: string;
		metricasPublicas?: unknown;
		imagenUrl?: string;
		clienteId?: string;
		orden?: number;
		estaPublicado?: boolean;
		mostrarCliente?: boolean;
	}) {
		const result = await db.insert(casosExito).values(data).returning();
		return result[0];
	}

	async update(id: string, data: Partial<typeof casosExito.$inferInsert>) {
		const result = await db
			.update(casosExito)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(casosExito.id, id))
			.returning();
		return result[0];
	}

	async delete(id: string) {
		await db.delete(casosExito).where(eq(casosExito.id, id));
	}
}

export const casosExitoService = new CasosExitoService();