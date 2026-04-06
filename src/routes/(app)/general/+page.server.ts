import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { automatizaciones, proyectosSoftware, ejecuciones } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	const [autos, proyectos, ejecs] = await Promise.all([
		db.select({ id: automatizaciones.id, estaActiva: automatizaciones.estaActiva }).from(automatizaciones),
		db.select({ id: proyectosSoftware.id }).from(proyectosSoftware),
		db.select({
			id: ejecuciones.id,
			estado: ejecuciones.estado,
			fechaInicio: ejecuciones.fechaInicio,
			autoNombre: automatizaciones.nombre
		})
			.from(ejecuciones)
			.leftJoin(automatizaciones, eq(ejecuciones.automatizacionId, automatizaciones.id))
			.orderBy(asc(ejecuciones.fechaInicio))
	]);

	const rpasActivos = autos.filter((a) => a.estaActiva).length;
	const proyectosCulminados = proyectos.length;
	const totalEjecuciones = ejecs.length;
	const exitosas = ejecs.filter((e) => e.estado === 'Exitoso').length;
	const tasaExito = totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 100) : 0;

	// Chart 1: Actividad mensual por automatización
	const seriesMap: Record<string, Record<string, number>> = {};
	const monthsSet = new Set<string>();

	ejecs.forEach((e) => {
		if (!e.autoNombre || !e.fechaInicio) return;
		const month = new Date(e.fechaInicio).toISOString().slice(0, 7);
		monthsSet.add(month);
		if (!seriesMap[e.autoNombre]) seriesMap[e.autoNombre] = {};
		seriesMap[e.autoNombre][month] = (seriesMap[e.autoNombre][month] ?? 0) + 1;
	});

	const months = [...monthsSet].sort();
	const chartData = {
		months,
		series: Object.entries(seriesMap).map(([name, d]) => ({
			name,
			data: months.map((m) => d[m] ?? 0)
		}))
	};

	// Chart 2: Heatmap — últimas 52 semanas
	const dailyMap: Record<string, number> = {};
	ejecs.forEach((e) => {
		if (!e.fechaInicio) return;
		const day = new Date(e.fechaInicio).toISOString().slice(0, 10);
		dailyMap[day] = (dailyMap[day] ?? 0) + 1;
	});

	const today = new Date();
	const heatmapCells: { date: string; count: number; week: number; dow: number }[] = [];
	for (let w = 51; w >= 0; w--) {
		for (let d = 0; d <= 6; d++) {
			const date = new Date(today);
			date.setDate(today.getDate() - (w * 7 + (6 - d)));
			const dateStr = date.toISOString().slice(0, 10);
			heatmapCells.push({ date: dateStr, count: dailyMap[dateStr] ?? 0, week: 51 - w, dow: d });
		}
	}
	const heatmapMax = Math.max(...heatmapCells.map((c) => c.count), 1);

	// Chart 3: Scatter
	const scatterPoints: { hour: number; dow: number; auto: string }[] = [];
	ejecs.forEach((e) => {
		if (!e.autoNombre || !e.fechaInicio) return;
		const dt = new Date(e.fechaInicio);
		scatterPoints.push({ hour: dt.getUTCHours(), dow: dt.getUTCDay(), auto: e.autoNombre });
	});

	// Chart 4: Acumulado
	const cumulativeSeries = Object.entries(seriesMap).map(([name, d]) => {
		let cum = 0;
		return { name, data: months.map((m) => { cum += d[m] ?? 0; return cum; }) };
	});

	return {
		user,
		rpasActivos,
		proyectosCulminados,
		totalEjecuciones,
		tasaExito,
		chartData,
		heatmapCells,
		heatmapMax,
		scatterPoints,
		cumulativeSeries
	};
};
