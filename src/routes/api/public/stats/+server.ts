import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { automatizaciones, ejecuciones } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';

function formatearNumeroPublico(n: number): string {
	if (n < 100) return `${n}`;
	if (n < 1000) return `${Math.floor(n / 100) * 100}+`;
	if (n < 10000) return `${Math.floor(n / 1000)},000+`;
	return `${Math.floor(n / 1000)},000+`;
}

export const GET: RequestHandler = async () => {
	try {
		const [totalAutos] = await db
			.select({ count: count() })
			.from(automatizaciones)
			.where(eq(automatizaciones.estaActiva, true));

		const [totalExitosas] = await db
			.select({ count: count() })
			.from(ejecuciones)
			.where(eq(ejecuciones.estado, 'Exitoso'));

		const [totalEjecuciones] = await db.select({ count: count() }).from(ejecuciones);

		const todosAutos = await db
			.select({ clienteId: automatizaciones.clienteId })
			.from(automatizaciones)
			.where(eq(automatizaciones.estaActiva, true));

		const clientesUnicos = new Set(todosAutos.map((a) => a.clienteId)).size;

		const tasaExito =
			totalEjecuciones.count > 0
				? Math.round((totalExitosas.count / totalEjecuciones.count) * 1000) / 10
				: 0;

		return json({
			stats: {
				total_automatizaciones_activas: totalAutos.count,
				total_ejecuciones_exitosas: formatearNumeroPublico(totalExitosas.count),
				clientes_activos: clientesUnicos,
				tasa_exito_global: `${tasaExito}%`
			}
		});
	} catch (err) {
		console.error('[api/public/stats] Error:', err);
		return json({
			stats: {
				total_automatizaciones_activas: 0,
				total_ejecuciones_exitosas: '0',
				clientes_activos: 0,
				tasa_exito_global: '0%'
			}
		});
	}
};
