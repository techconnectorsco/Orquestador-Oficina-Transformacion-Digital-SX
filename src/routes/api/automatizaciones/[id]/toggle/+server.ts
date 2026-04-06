import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { automatizacionesService } from '$lib/services/automatizaciones.service';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	if (!perfil?.esAdmin) {
		return json({ error: 'Solo administradores pueden cambiar el estado de robots' }, { status: 403 });
	}

	const body = await request.json();
	const { esta_activa } = body;
	const automatizacionId = params.id!;

	if (typeof esta_activa !== 'boolean') {
		return json({ error: 'esta_activa debe ser un booleano' }, { status: 400 });
	}

	try {
		const automatizacion = await automatizacionesService.toggleRobot(automatizacionId, esta_activa);
		return json({
			success: true,
			automatizacion,
			mensaje: `Robot ${esta_activa ? 'activado' : 'desactivado'} correctamente`
		});
	} catch (err) {
		console.error('[toggle] Error:', err);
		return json({ error: 'Error al cambiar estado' }, { status: 500 });
	}
};
