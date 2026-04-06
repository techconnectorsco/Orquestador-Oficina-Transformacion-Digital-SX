import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { ejecuciones, automatizaciones, clientes } from '$lib/server/db/schema';
import { eq, inArray, count, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	function fmtSeg(seg: number): string {
		if (seg < 60) return `${seg.toFixed(1)}s`;
		if (seg < 3600) return `${(seg / 60).toFixed(1)}m`;
		return `${(seg / 3600).toFixed(1)}h`;
	}

	function parseDuracion(metricas: unknown): string | null {
		if (!metricas || typeof metricas !== 'object') return null;
		const m = metricas as Record<string, unknown>;
		if (typeof m.tiempo_ejecucion === 'number') return fmtSeg(m.tiempo_ejecucion);
		return null;
	}

	const [totalRow, exitosasRow, erroresRow, recentEjecs] = await Promise.all([
		db.select({ count: count() }).from(ejecuciones),
		db.select({ count: count() }).from(ejecuciones).where(eq(ejecuciones.estado, 'Exitoso')),
		db.select({ count: count() }).from(ejecuciones).where(eq(ejecuciones.estado, 'Error')),
		db.select({ ejecucion: ejecuciones, automatizacion: automatizaciones, cliente: clientes })
			.from(ejecuciones)
			.leftJoin(automatizaciones, eq(ejecuciones.automatizacionId, automatizaciones.id))
			.leftJoin(clientes, eq(automatizaciones.clienteId, clientes.id))
			.orderBy(desc(ejecuciones.fechaInicio))
			.limit(50)
	]);

	const logs = recentEjecs.map((row) => ({
		id: row.ejecucion.id,
		estado: row.ejecucion.estado,
		fechaInicio: row.ejecucion.fechaInicio,
		autoNombre: row.automatizacion?.nombre ?? '—',
		clienteNombre: row.cliente?.nombre ?? '—',
		duracion: parseDuracion(row.ejecucion.metricas)
	}));

	const automations = [...new Set(logs.map((l) => l.autoNombre))].filter((a) => a !== '—');

	return {
		user,
		logs,
		totalCount: totalRow[0]?.count ?? 0,
		stats: {
			total: totalRow[0]?.count ?? 0,
			exitosas: exitosasRow[0]?.count ?? 0,
			errores: erroresRow[0]?.count ?? 0,
			pendientes: 0
		},
		automations
	};
};
