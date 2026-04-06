import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { equipo } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	const equipoRows = await db.select().from(equipo).orderBy(asc(equipo.orden));
	return { user, equipo: equipoRows };
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const form = await request.formData();
		try {
			await db.insert(equipo).values({
				nombre: (form.get('nombre') as string)?.trim(),
				cargo: (form.get('cargo') as string)?.trim() || '',
				descripcion: (form.get('descripcion') as string)?.trim() || null,
				email: (form.get('email') as string)?.trim() || null,
				fotoUrl: (form.get('foto_url') as string)?.trim() || null,
				color: (form.get('color') as string)?.trim() || '#3b82f6',
				orden: parseInt(form.get('orden') as string) || 0,
				visible: form.get('visible') === 'true',
				estaActivo: form.get('activo') !== 'false',
				redesSociales: []
			});
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al crear miembro del equipo' });
		}
	},

	actualizar: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'ID requerido' });
		try {
			await db
				.update(equipo)
				.set({
					nombre: (form.get('nombre') as string)?.trim(),
					cargo: (form.get('cargo') as string)?.trim() || '',
					descripcion: (form.get('descripcion') as string)?.trim() || null,
					email: (form.get('email') as string)?.trim() || null,
					fotoUrl: (form.get('foto_url') as string)?.trim() || null,
					color: (form.get('color') as string)?.trim() || '#3b82f6',
					orden: parseInt(form.get('orden') as string) || 0,
					visible: form.get('visible') === 'true',
					estaActivo: form.get('activo') !== 'false',
					updatedAt: new Date()
				})
				.where(eq(equipo.id, id));
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al actualizar miembro' });
		}
	},

	eliminar: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		try {
			await db.delete(equipo).where(eq(equipo.id, id));
			return { success: true };
		} catch {
			return fail(500, { error: 'Error al eliminar' });
		}
	}
};
