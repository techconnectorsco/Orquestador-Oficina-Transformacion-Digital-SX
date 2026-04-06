import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { casosExitoService } from '$lib/services/casos-exito.service';
import { clientesService } from '$lib/services/clientes.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	const [casosRows, clientes] = await Promise.all([
		casosExitoService.getAll(),
		clientesService.getAll()
	]);

	return {
		user,
		casos: casosRows.map((r) => ({ ...r.caso, cliente: r.cliente })),
		clientes
	};
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const form = await request.formData();
		try {
			await casosExitoService.create({
				titulo: (form.get('titulo') as string)?.trim(),
				descripcion: (form.get('descripcion') as string)?.trim() || undefined,
				clienteId: (form.get('cliente_id') as string) || undefined,
				imagenUrl: (form.get('imagen_url') as string)?.trim() || undefined,
				orden: (form.get('orden') as string) || '0',
				visible: form.get('visible') === 'true'
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Error al crear caso de éxito' });
		}
	},

	eliminar: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		try {
			await casosExitoService.delete(id);
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Error al eliminar' });
		}
	}
};
