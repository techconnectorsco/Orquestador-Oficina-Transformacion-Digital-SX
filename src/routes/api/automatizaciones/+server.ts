import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { automatizacionesService } from '$lib/services/automatizaciones.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ automatizaciones: [] });
	}

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;
	const clienteIdParam = url.searchParams.get('cliente_id');

	try {
		let automatizaciones: unknown[] = [];

		if (esAdmin) {
			if (clienteIdParam) {
				automatizaciones = await automatizacionesService.getByCliente(clienteIdParam);
			} else {
				automatizaciones = await automatizacionesService.getAll();
			}
		} else if (clienteId) {
			automatizaciones = await automatizacionesService.getByCliente(clienteId);
		}

		const automatizacionesConEjecucion = await Promise.all(
			automatizaciones.map(async (auto: any) => {
				const id = auto?.automatizacion?.id ?? auto?.id;
				return id ? (await automatizacionesService.getByIdWithLastExecution(id)) ?? auto : auto;
			})
		);

		return json({ automatizaciones: automatizacionesConEjecucion });
	} catch (err) {
		console.error('Error en GET /api/automatizaciones:', err);
		throw error(500, 'Error al obtener automatizaciones');
	}
};
