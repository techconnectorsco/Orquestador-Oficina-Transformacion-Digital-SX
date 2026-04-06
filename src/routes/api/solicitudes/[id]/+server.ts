import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { solicitudesService } from '$lib/services/solicitudes.service';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	if (!perfil?.esAdmin) {
		return json({ error: 'Solo admins pueden procesar solicitudes' }, { status: 403 });
	}

	const body = await request.json();
	const { accion, notas } = body;
	const solicitudId = params.id!;

	if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
		return json({ error: 'accion debe ser "aprobar" o "rechazar"' }, { status: 400 });
	}

	try {
		let resultado;
		if (accion === 'aprobar') {
			resultado = await solicitudesService.aprobar(solicitudId, user.id);
		} else {
			resultado = await solicitudesService.rechazar(solicitudId, user.id, notas);
		}
		return json({ solicitud: resultado });
	} catch (err) {
		console.error('[api/solicitudes/[id]] PATCH error:', err);
		return json({ error: 'Error al procesar solicitud' }, { status: 500 });
	}
};
