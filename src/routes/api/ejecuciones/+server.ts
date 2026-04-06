import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { automatizacionesService } from '$lib/services/automatizaciones.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ ejecuciones: [] });
	}

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;
	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const automatizacionId = url.searchParams.get('automatizacion_id');

	try {
		let ejecuciones: unknown[] = [];

		if (automatizacionId) {
			ejecuciones = await automatizacionesService.getEjecuciones(automatizacionId, limit);
		} else if (esAdmin) {
			ejecuciones = await automatizacionesService.getAllEjecucionesRecientes(limit);
		} else if (clienteId) {
			ejecuciones = await automatizacionesService.getEjecucionesRecientes(clienteId, limit);
		}

		return json({ ejecuciones });
	} catch (err) {
		console.error('Error en GET /api/ejecuciones:', err);
		throw error(500, 'Error al obtener ejecuciones');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = locals;

	if (!user) {
		throw error(401, 'No autenticado');
	}

	const body = await request.json();

	try {
		const ejecucion = await automatizacionesService.crearEjecucion({
			automatizacionId: body.automatizacion_id,
			estado: body.estado,
			metricas: body.metricas ?? null,
			logSalida: body.log_salida ?? null,
			observaciones: body.observaciones ?? null
		});

		return json({ ejecucion }, { status: 201 });
	} catch (err) {
		console.error('Error en POST /api/ejecuciones:', err);
		throw error(500, 'Error al crear ejecución');
	}
};
