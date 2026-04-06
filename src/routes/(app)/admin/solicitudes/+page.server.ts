import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { solicitudesService } from '$lib/services/solicitudes.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, perfil } = locals;

	if (!user) throw redirect(303, '/auth?mode=login');
	if (!perfil?.esAdmin) throw redirect(303, '/');

	try {
		const solicitudes = await solicitudesService.getAll();
		return { solicitudes };
	} catch (err) {
		console.error('[admin/solicitudes] Load error:', err);
		return { solicitudes: [], error: 'Error cargando solicitudes' };
	}
};

export const actions: Actions = {
	aprobar: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return { error: 'No autenticado' };

		const formData = await request.formData();
		const solicitudId = formData.get('solicitudId') as string;

		try {
			const resultado = await solicitudesService.aprobar(solicitudId, user.id);
			return { success: true, resultado };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Error al aprobar' };
		}
	},

	rechazar: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return { error: 'No autenticado' };

		const formData = await request.formData();
		const solicitudId = formData.get('solicitudId') as string;
		const notas = formData.get('notas') as string;

		try {
			const resultado = await solicitudesService.rechazar(solicitudId, user.id, notas);
			return { success: true, resultado };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Error al rechazar' };
		}
	}
};
