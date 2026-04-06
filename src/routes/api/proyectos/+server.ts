import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { proyectosService } from '$lib/services/proyectos.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, perfil } = locals;

	if (!user) {
		return json({ proyectos: [] });
	}

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;
	const clienteIdParam = url.searchParams.get('cliente_id');

	try {
		let proyectos: unknown[] = [];

		if (esAdmin) {
			if (clienteIdParam) {
				proyectos = await proyectosService.getByCliente(clienteIdParam);
			} else {
				proyectos = await proyectosService.getAll();
			}
		} else if (clienteId) {
			proyectos = await proyectosService.getByCliente(clienteId);
		}

		return json({ proyectos });
	} catch (err) {
		console.error('Error en GET /api/proyectos:', err);
		throw error(500, 'Error al obtener proyectos');
	}
};
