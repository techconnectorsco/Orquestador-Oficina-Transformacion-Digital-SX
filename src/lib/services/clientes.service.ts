import { db } from '$lib/server/db';
import { clientes, type Cliente } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export class ClientesService {
	async getAll(): Promise<Cliente[]> {
		return await db.select().from(clientes).orderBy(asc(clientes.nombre));
	}

	async getById(id: string): Promise<Cliente | null> {
		const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
		return result[0] ?? null;
	}

	async getBySlug(slug: string): Promise<Cliente | null> {
		const result = await db.select().from(clientes).where(eq(clientes.slug, slug)).limit(1);
		return result[0] ?? null;
	}

	async create(data: { nombre: string; slug: string }): Promise<Cliente> {
		const result = await db.insert(clientes).values(data).returning();
		return result[0];
	}

	async update(id: string, data: Partial<{ nombre: string; slug: string }>): Promise<Cliente> {
		const result = await db
			.update(clientes)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(clientes.id, id))
			.returning();
		return result[0];
	}

	async delete(id: string): Promise<void> {
		await db.delete(clientes).where(eq(clientes.id, id));
	}
}

export const clientesService = new ClientesService();
