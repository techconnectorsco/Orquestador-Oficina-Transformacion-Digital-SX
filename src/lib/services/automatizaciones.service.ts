import { db } from '$lib/server/db';
import {
	automatizaciones,
	ejecuciones,
	clientes,
	type Automatizacion,
	type Ejecucion
} from '$lib/server/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export class AutomatizacionesService {
	async getAll() {
		return await db
			.select({ automatizacion: automatizaciones, cliente: clientes })
			.from(automatizaciones)
			.leftJoin(clientes, eq(automatizaciones.clienteId, clientes.id))
			.orderBy(asc(automatizaciones.nombre));
	}

	async getByCliente(clienteId: string) {
		return await db
			.select({ automatizacion: automatizaciones, cliente: clientes })
			.from(automatizaciones)
			.leftJoin(clientes, eq(automatizaciones.clienteId, clientes.id))
			.where(eq(automatizaciones.clienteId, clienteId))
			.orderBy(asc(automatizaciones.nombre));
	}

	async getById(id: string) {
		const result = await db
			.select({ automatizacion: automatizaciones, cliente: clientes })
			.from(automatizaciones)
			.leftJoin(clientes, eq(automatizaciones.clienteId, clientes.id))
			.where(eq(automatizaciones.id, id))
			.limit(1);
		return result[0] ?? null;
	}

	async getByIdWithLastExecution(id: string) {
		const auto = await this.getById(id);
		if (!auto) return null;

		const ultimaEjecucion = await db
			.select()
			.from(ejecuciones)
			.where(eq(ejecuciones.automatizacionId, id))
			.orderBy(desc(ejecuciones.fechaInicio))
			.limit(1);

		return { ...auto, ultimaEjecucion: ultimaEjecucion[0] ?? null };
	}

	async getEjecuciones(automatizacionId: string, limit = 50) {
		return await db
			.select()
			.from(ejecuciones)
			.where(eq(ejecuciones.automatizacionId, automatizacionId))
			.orderBy(desc(ejecuciones.fechaInicio))
			.limit(limit);
	}

	async getEjecucionesRecientes(clienteId: string, limit = 20) {
		return await db
			.select({ ejecucion: ejecuciones, automatizacion: automatizaciones })
			.from(ejecuciones)
			.innerJoin(automatizaciones, eq(ejecuciones.automatizacionId, automatizaciones.id))
			.where(eq(automatizaciones.clienteId, clienteId))
			.orderBy(desc(ejecuciones.fechaInicio))
			.limit(limit);
	}

	async getAllEjecucionesRecientes(limit = 50) {
		return await db
			.select({ ejecucion: ejecuciones, automatizacion: automatizaciones, cliente: clientes })
			.from(ejecuciones)
			.leftJoin(automatizaciones, eq(ejecuciones.automatizacionId, automatizaciones.id))
			.leftJoin(clientes, eq(automatizaciones.clienteId, clientes.id))
			.orderBy(desc(ejecuciones.fechaInicio))
			.limit(limit);
	}

	async crearEjecucion(data: {
		automatizacionId: string;
		estado: 'Exitoso' | 'Advertencia' | 'Error';
		metricas?: Record<string, unknown>;
		logSalida?: string;
		observaciones?: string;
	}) {
		const result = await db
			.insert(ejecuciones)
			.values({
				automatizacionId: data.automatizacionId,
				estado: data.estado,
				metricas: data.metricas ?? null,
				logSalida: data.logSalida ?? null,
				observaciones: data.observaciones ?? null
			})
			.returning();
		return result[0];
	}

	async toggleRobot(automatizacionId: string, estaActiva: boolean) {
		const result = await db
			.update(automatizaciones)
			.set({ estaActiva, updatedAt: new Date() })
			.where(eq(automatizaciones.id, automatizacionId))
			.returning();
		return result[0];
	}

	async create(data: {
		clienteId: string;
		nombre: string;
		tipo: string;
		descripcion?: string;
		frecuencia?: string;
		repoUrl?: string;
	}) {
		const result = await db.insert(automatizaciones).values(data).returning();
		return result[0];
	}

	async update(id: string, data: Partial<Automatizacion>) {
		const result = await db
			.update(automatizaciones)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(automatizaciones.id, id))
			.returning();
		return result[0];
	}

	async delete(id: string) {
		await db.delete(automatizaciones).where(eq(automatizaciones.id, id));
	}

	async getEstadisticas(clienteId: string) {
		const autos = await this.getByCliente(clienteId);
		const ejecs = await this.getEjecucionesRecientes(clienteId, 1000);

		const totalEjecuciones = ejecs.length;
		const exitosas = ejecs.filter((e) => e.ejecucion.estado === 'Exitoso').length;
		const conAdvertencia = ejecs.filter((e) => e.ejecucion.estado === 'Advertencia').length;
		const conError = ejecs.filter((e) => e.ejecucion.estado === 'Error').length;
		const botsActivos = autos.filter((a) => a.automatizacion.estaActiva).length;
		const tasaExito = totalEjecuciones > 0 ? (exitosas / totalEjecuciones) * 100 : 0;

		const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const ejecucionesPorDia: Record<string, number> = {};
		ejecs
			.filter((e) => new Date(e.ejecucion.fechaInicio) >= hace7Dias)
			.forEach((e) => {
				const fecha = new Date(e.ejecucion.fechaInicio).toISOString().split('T')[0];
				ejecucionesPorDia[fecha] = (ejecucionesPorDia[fecha] || 0) + 1;
			});

		return {
			totalAutomatizaciones: autos.length,
			botsActivos,
			totalEjecuciones,
			exitosas,
			conAdvertencia,
			conError,
			tasaExito: Math.round(tasaExito * 100) / 100,
			ejecucionesPorDia
		};
	}
}

export const automatizacionesService = new AutomatizacionesService();
