import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, perfiles, clientes } from '$lib/server/db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const busqueda = url.searchParams.get('busqueda') || '';
		const filtroAdmin = url.searchParams.get('filtro_admin') || 'todos';
		const filtroBaneado = url.searchParams.get('filtro_baneado') || 'todos';

		const conditions = [];

		if (busqueda) {
			conditions.push(
				or(
					ilike(perfiles.nombreCompleto, `%${busqueda}%`),
					ilike(perfiles.email, `%${busqueda}%`)
				)
			);
		}
		if (filtroAdmin === 'admin') conditions.push(eq(perfiles.esAdmin, true));
		if (filtroAdmin === 'usuario') conditions.push(eq(perfiles.esAdmin, false));
		if (filtroBaneado === 'baneado') conditions.push(eq(perfiles.estaBaneado, true));
		if (filtroBaneado === 'activo') conditions.push(eq(perfiles.estaBaneado, false));

		const query = db
			.select({ user: users, perfil: perfiles, cliente: clientes })
			.from(perfiles)
			.leftJoin(users, eq(perfiles.id, users.id))
			.leftJoin(clientes, eq(perfiles.clienteId, clientes.id));

		const usuarios = conditions.length
			? await query.where(and(...conditions))
			: await query;

		return json({ success: true, usuarios });
	} catch (err: any) {
		console.error('Error en GET usuarios:', err);
		return json({ error: err.message }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { user_id, esta_baneado, es_admin, cliente_id } = body;

		if (!user_id) {
			return json({ error: 'user_id es obligatorio' }, { status: 400 });
		}

		const updates: Record<string, unknown> = { updatedAt: new Date() };
		if (esta_baneado !== undefined) updates.estaBaneado = esta_baneado;
		if (es_admin !== undefined) updates.esAdmin = es_admin;
		if (cliente_id !== undefined) updates.clienteId = cliente_id;

		await db.update(perfiles).set(updates).where(eq(perfiles.id, user_id));

		return json({ success: true });
	} catch (err: any) {
		console.error('Error en PATCH usuarios:', err);
		return json({ error: err.message }, { status: 500 });
	}
};
