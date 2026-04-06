import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { automatizacionesService } from '$lib/services/automatizaciones.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, perfil } = locals;

	if (!user) {
		throw error(401, 'No autenticado');
	}

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;
	const clienteIdParam = url.searchParams.get('cliente_id');

	try {
		const targetClienteId = esAdmin ? clienteIdParam || clienteId : clienteId;

		if (!targetClienteId) {
			return json({ estadisticas: null });
		}

		const estadisticas = await automatizacionesService.getEstadisticas(targetClienteId);
		return json({ estadisticas });
	} catch (err) {
		console.error('Error en GET /api/estadisticas:', err);
		throw error(500, 'Error al obtener estadísticas');
	}
};
