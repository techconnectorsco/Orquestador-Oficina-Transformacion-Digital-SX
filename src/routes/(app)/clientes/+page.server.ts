import type { PageServerLoad } from './$types';
import { clientesService } from '$lib/services/clientes.service';
import { automatizacionesService } from '$lib/services/automatizaciones.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	const [todosClientes, todasAutos] = await Promise.all([
		clientesService.getAll(),
		automatizacionesService.getAll()
	]);

	const ejecucionesMap: Record<string, number> = {};

	const clientesEnriquecidos = todosClientes.map((c) => {
		const autosDeCliente = todasAutos.filter((a) => a.automatizacion.clienteId === c.id);
		return {
			...c,
			botsActivos: autosDeCliente.filter((a) => a.automatizacion.estaActiva).length,
			totalBots: autosDeCliente.length,
			totalEjecuciones: ejecucionesMap[c.id] ?? 0
		};
	});

	return {
		user,
		clientes: clientesEnriquecidos
	};
};
