import type { PageServerLoad } from './$types';
import { casosExitoService } from '$lib/services/casos-exito.service';
import { proyectosService } from '$lib/services/proyectos.service';
import { db } from '$lib/server/db';
import { solicitudesAcceso, dominiosEmpresa } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, perfil } = locals;

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;

	type AccesoEstado = 'sin_sesion' | 'con_acceso' | 'dominio_valido_sin_solicitud' | 'dominio_invalido' | 'solicitud_pendiente';
	let accesoEstado: AccesoEstado = 'sin_sesion';
	let dominioCliente: string | null = null;

	if (user) {
		if (esAdmin || clienteId) {
			accesoEstado = 'con_acceso';
		} else {
			const emailDominio = user.email?.split('@')[1] ?? '';

			const [dominioData] = await db
				.select({ dominio: dominiosEmpresa.dominio, clienteId: dominiosEmpresa.clienteId })
				.from(dominiosEmpresa)
				.where(and(eq(dominiosEmpresa.dominio, emailDominio), eq(dominiosEmpresa.estaActivo, true)))
				.limit(1);

			if (dominioData) {
				const [solicitud] = await db
					.select({ id: solicitudesAcceso.id, estado: solicitudesAcceso.estado })
					.from(solicitudesAcceso)
					.where(and(
						eq(solicitudesAcceso.userId, user.id),
						inArray(solicitudesAcceso.estado, ['pendiente'])
					))
					.limit(1);

				accesoEstado = solicitud ? 'solicitud_pendiente' : 'dominio_valido_sin_solicitud';
			} else {
				accesoEstado = 'dominio_invalido';
			}
		}
	}

	const [casos, proyectos] = await Promise.all([
		casosExitoService.getVisibles(),
		proyectosService.getAll()
	]);

	const proyectoMap: Record<string, unknown> = {};
	proyectos.forEach((row) => {
		if (row.proyecto.clienteId) proyectoMap[row.proyecto.clienteId] = row.proyecto;
	});

	return {
		user,
		esAdmin,
		clienteId,
		accesoEstado,
		dominioCliente,
		casos,
		proyectoMap
	};
};
