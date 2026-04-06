import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { automatizacionesService } from '$lib/services/automatizaciones.service';
import { clientesService } from '$lib/services/clientes.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, perfil } = locals;

	if (!user) throw redirect(303, '/auth?mode=login');
	if (!perfil?.esAdmin) throw redirect(303, '/');

	try {
		const [automatizaciones, clientes] = await Promise.all([
			automatizacionesService.getAll(),
			clientesService.getAll()
		]);

		const robotsEnriquecidos = automatizaciones.map((row) => ({
			...row.automatizacion,
			clienteNombre: row.cliente?.nombre ?? 'Cliente desconocido'
		}));

		return { robots: robotsEnriquecidos, clientes };
	} catch (err) {
		console.error('[admin/robots] Load error:', err);
		return { robots: [], clientes: [], error: 'Error cargando robots' };
	}
};
