import { db } from '$lib/server/db';
import { proyectosSoftware, clientes, type ProyectoSoftware } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export class ProyectosService {
	async getAll() {
		return await db
			.select({ proyecto: proyectosSoftware, cliente: clientes })
			.from(proyectosSoftware)
			.leftJoin(clientes, eq(proyectosSoftware.clienteId, clientes.id))
			.orderBy(asc(proyectosSoftware.nombre));
	}

	async getByCliente(clienteId: string) {
		return await db
			.select({ proyecto: proyectosSoftware, cliente: clientes })
			.from(proyectosSoftware)
			.leftJoin(clientes, eq(proyectosSoftware.clienteId, clientes.id))
			.where(eq(proyectosSoftware.clienteId, clienteId))
			.orderBy(asc(proyectosSoftware.nombre));
	}

	async getById(id: string) {
		const result = await db
			.select({ proyecto: proyectosSoftware, cliente: clientes })
			.from(proyectosSoftware)
			.leftJoin(clientes, eq(proyectosSoftware.clienteId, clientes.id))
			.where(eq(proyectosSoftware.id, id))
			.limit(1);
		return result[0] ?? null;
	}

	async create(data: {
		clienteId?: string;
		nombre: string;
		descripcion?: string;
		urlAcceso?: string;
		tecnologias?: string;
		tipo?: string;
		estado?: string;
	}) {
		const result = await db.insert(proyectosSoftware).values(data).returning();
		return result[0];
	}

	async update(id: string, data: Partial<ProyectoSoftware>) {
		const result = await db
			.update(proyectosSoftware)
			.set(data)
			.where(eq(proyectosSoftware.id, id))
			.returning();
		return result[0];
	}

	async delete(id: string) {
		await db.delete(proyectosSoftware).where(eq(proyectosSoftware.id, id));
	}
}

export const proyectosService = new ProyectosService();
