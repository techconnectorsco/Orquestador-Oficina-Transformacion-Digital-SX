import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { clientes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	const rows = await db.select().from(clientes).orderBy(asc(clientes.nombre));
	return { user, clientes: rows };
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const form = await request.formData();
		const nombre = (form.get('nombre') as string)?.trim();
		const slug = (form.get('slug') as string)?.trim();
		if (!nombre || !slug) return fail(400, { error: 'Nombre y slug son requeridos' });
		try {
			await db.insert(clientes).values({
				nombre,
				slug,
				descripcion: (form.get('descripcion') as string)?.trim() || null,
				logoUrl: (form.get('logo_url') as string)?.trim() || null,
				sitioWeb: (form.get('sitio_web') as string)?.trim() || null,
				estaActivo: form.get('esta_activo') !== 'false'
			});
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al crear cliente (el slug puede estar duplicado)' });
		}
	},

	actualizar: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'ID requerido' });
		try {
			await db
				.update(clientes)
				.set({
					nombre: (form.get('nombre') as string)?.trim(),
					slug: (form.get('slug') as string)?.trim(),
					descripcion: (form.get('descripcion') as string)?.trim() || null,
					logoUrl: (form.get('logo_url') as string)?.trim() || null,
					sitioWeb: (form.get('sitio_web') as string)?.trim() || null,
					estaActivo: form.get('esta_activo') !== 'false',
					updatedAt: new Date()
				})
				.where(eq(clientes.id, id));
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al actualizar cliente' });
		}
	},

	toggleVisibilidad: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const estaActivo = form.get('esta_activo') === 'true';
		if (!id) return fail(400, { error: 'ID requerido' });
		try {
			await db
				.update(clientes)
				.set({ estaActivo, updatedAt: new Date() })
				.where(eq(clientes.id, id));
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al cambiar visibilidad' });
		}
	}
};
