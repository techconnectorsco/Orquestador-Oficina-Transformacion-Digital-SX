import { db } from '$lib/server/db';
import { solicitudesAcceso, perfiles, clientes, users } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export class SolicitudesService {
	async getByUser(userId: string) {
		return await db
			.select({ solicitud: solicitudesAcceso, cliente: clientes })
			.from(solicitudesAcceso)
			.leftJoin(clientes, eq(solicitudesAcceso.clienteId, clientes.id))
			.where(eq(solicitudesAcceso.userId, userId))
			.orderBy(desc(solicitudesAcceso.createdAt));
	}

	async getAll(filtroEstado?: 'pendiente' | 'aprobada' | 'rechazada') {
		const base = db
			.select({ solicitud: solicitudesAcceso, cliente: clientes, user: users, perfil: perfiles })
			.from(solicitudesAcceso)
			.leftJoin(clientes, eq(solicitudesAcceso.clienteId, clientes.id))
			.leftJoin(users, eq(solicitudesAcceso.userId, users.id))
			.leftJoin(perfiles, eq(solicitudesAcceso.userId, perfiles.id));

		if (filtroEstado) {
			return await base
				.where(eq(solicitudesAcceso.estado, filtroEstado))
				.orderBy(desc(solicitudesAcceso.createdAt));
		}
		return await base.orderBy(desc(solicitudesAcceso.createdAt));
	}

	async contarPendientes(): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(solicitudesAcceso)
			.where(eq(solicitudesAcceso.estado, 'pendiente'));
		return result[0]?.count ?? 0;
	}

	async crear(userId: string, clienteId: string, mensaje?: string) {
		const result = await db
			.insert(solicitudesAcceso)
			.values({ userId, clienteId, estado: 'pendiente', mensaje: mensaje ?? null })
			.returning();
		return result[0];
	}

	async aprobar(solicitudId: string, _adminId: string) {
		return await db.transaction(async (tx) => {
			const [solicitud] = await tx
				.select()
				.from(solicitudesAcceso)
				.where(eq(solicitudesAcceso.id, solicitudId))
				.limit(1);

			if (!solicitud) throw new Error('Solicitud no encontrada');

			await tx
				.update(solicitudesAcceso)
				.set({ estado: 'aprobada', updatedAt: new Date() })
				.where(eq(solicitudesAcceso.id, solicitudId));

			await tx
				.update(perfiles)
				.set({ clienteId: solicitud.clienteId, updatedAt: new Date() })
				.where(eq(perfiles.id, solicitud.userId));

			return { success: true };
		});
	}

	async rechazar(solicitudId: string, _adminId: string, notas?: string) {
		const result = await db
			.update(solicitudesAcceso)
			.set({ estado: 'rechazada', notasAdmin: notas ?? null, updatedAt: new Date() })
			.where(eq(solicitudesAcceso.id, solicitudId))
			.returning();
		return result[0];
	}
}

export const solicitudesService = new SolicitudesService();
