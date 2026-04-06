import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { solicitudesService } from '$lib/services/solicitudes.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	const filtroEstado = url.searchParams.get('estado') as 'pendiente' | 'aprobada' | 'rechazada' | null;

	try {
		let solicitudes;

		if (perfil?.esAdmin) {
			solicitudes = await solicitudesService.getAll(filtroEstado || undefined);
		} else {
			solicitudes = await solicitudesService.getByUser(user.id);
		}

		return json({ solicitudes });
	} catch (err) {
		console.error('[api/solicitudes] GET error:', err);
		return json({ error: 'Error al obtener solicitudes' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user } = locals;

	if (!user) {
		return json({ error: 'No autenticado' }, { status: 401 });
	}

	const body = await request.json();
	const { cliente_id, mensaje } = body;

	if (!cliente_id) {
		return json({ error: 'cliente_id es obligatorio' }, { status: 400 });
	}

	try {
		const solicitud = await solicitudesService.crear(user.id, cliente_id, mensaje);
		return json({ solicitud }, { status: 201 });
	} catch (err: any) {
		if (err?.message?.includes('unique')) {
			return json({ error: 'Ya has solicitado acceso a este cliente' }, { status: 409 });
		}
		console.error('[api/solicitudes] POST error:', err);
		return json({ error: 'Error al crear solicitud' }, { status: 500 });
	}
};
