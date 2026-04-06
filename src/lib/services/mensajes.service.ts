import { db } from '$lib/server/db';
import { mensajes, respuestasMensaje, clientes, users } from '$lib/server/db/schema';
import { eq, desc, count, and } from 'drizzle-orm';

export class MensajesService {
	async getByCliente(clienteId: string) {
		return await db
			.select({ mensaje: mensajes, cliente: clientes, autor: users })
			.from(mensajes)
			.leftJoin(clientes, eq(mensajes.clienteId, clientes.id))
			.leftJoin(users, eq(mensajes.autorId, users.id))
			.where(eq(mensajes.clienteId, clienteId))
			.orderBy(desc(mensajes.createdAt));
	}

	async getAll(filtroEstado?: string) {
		const base = db
			.select({ mensaje: mensajes, cliente: clientes, autor: users })
			.from(mensajes)
			.leftJoin(clientes, eq(mensajes.clienteId, clientes.id))
			.leftJoin(users, eq(mensajes.autorId, users.id));

		if (filtroEstado) {
			return await base
				.where(eq(mensajes.estado, filtroEstado))
				.orderBy(desc(mensajes.createdAt));
		}
		return await base.orderBy(desc(mensajes.createdAt));
	}

	async getById(mensajeId: string) {
		const [mensaje] = await db
			.select({ mensaje: mensajes, cliente: clientes, autor: users })
			.from(mensajes)
			.leftJoin(clientes, eq(mensajes.clienteId, clientes.id))
			.leftJoin(users, eq(mensajes.autorId, users.id))
			.where(eq(mensajes.id, mensajeId))
			.limit(1);

		if (!mensaje) return null;

		const respuestas = await db
			.select({ respuesta: respuestasMensaje, autor: users })
			.from(respuestasMensaje)
			.leftJoin(users, eq(respuestasMensaje.autorId, users.id))
			.where(eq(respuestasMensaje.mensajeId, mensajeId))
			.orderBy(respuestasMensaje.createdAt);

		return { ...mensaje, respuestas };
	}

	async crear(params: {
		clienteId: string;
		autorId: string;
		asunto: string;
		contenido: string;
		tipo?: string;
		automatizacionId?: string;
	}) {
		const result = await db
			.insert(mensajes)
			.values({
				clienteId: params.clienteId,
				autorId: params.autorId,
				asunto: params.asunto,
				contenido: params.contenido,
				tipo: params.tipo ?? 'general',
				automatizacionId: params.automatizacionId ?? null,
				estado: 'abierto',
				leidoPorAdmin: false,
				leidoPorCliente: true
			})
			.returning();
		return result[0];
	}

	async responder(mensajeId: string, autorId: string, contenido: string) {
		return await db.transaction(async (tx) => {
			const [respuesta] = await tx
				.insert(respuestasMensaje)
				.values({ mensajeId, autorId, contenido })
				.returning();

			await tx
				.update(mensajes)
				.set({ estado: 'en_proceso', updatedAt: new Date() })
				.where(and(eq(mensajes.id, mensajeId), eq(mensajes.estado, 'abierto')));

			return respuesta;
		});
	}

	async cambiarEstado(
		mensajeId: string,
		nuevoEstado: 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'
	) {
		const result = await db
			.update(mensajes)
			.set({ estado: nuevoEstado, updatedAt: new Date() })
			.where(eq(mensajes.id, mensajeId))
			.returning();
		return result[0];
	}

	async marcarLeido(mensajeId: string, porAdmin: boolean) {
		const field = porAdmin ? { leidoPorAdmin: true } : { leidoPorCliente: true };
		const result = await db
			.update(mensajes)
			.set({ ...field, updatedAt: new Date() })
			.where(eq(mensajes.id, mensajeId))
			.returning();
		return result[0];
	}

	async contarNoLeidos(params: { clienteId?: string; porAdmin?: boolean }): Promise<number> {
		const field = params.porAdmin ? mensajes.leidoPorAdmin : mensajes.leidoPorCliente;
		const conditions = [eq(field, false)];
		if (params.clienteId) conditions.push(eq(mensajes.clienteId, params.clienteId));

		const result = await db
			.select({ count: count() })
			.from(mensajes)
			.where(and(...conditions));
		return result[0]?.count ?? 0;
	}
}

export const mensajesService = new MensajesService();
