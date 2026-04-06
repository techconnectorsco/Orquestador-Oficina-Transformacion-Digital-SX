import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { solicitudesAcceso, dominiosEmpresa, clientes } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, perfil } = locals;

	if (!user) throw redirect(303, '/auth?mode=login');

	const esAdmin = perfil?.esAdmin === true;
	const clienteId = perfil?.clienteId ?? null;

	if (esAdmin || clienteId) throw redirect(303, '/apps');

	const emailDominio = user.email?.split('@')[1] ?? '';

	const [dominioData] = await db
		.select({ dominio: dominiosEmpresa.dominio, clienteId: dominiosEmpresa.clienteId })
		.from(dominiosEmpresa)
		.where(and(eq(dominiosEmpresa.dominio, emailDominio), eq(dominiosEmpresa.verificado, true)))
		.limit(1);

	let dominioClienteNombre: string | null = null;
	if (dominioData?.clienteId) {
		const [clienteRow] = await db
			.select({ nombre: clientes.nombre })
			.from(clientes)
			.where(eq(clientes.id, dominioData.clienteId))
			.limit(1);
		dominioClienteNombre = clienteRow?.nombre ?? null;
	}

	const [solicitudExistente] = await db
		.select({ id: solicitudesAcceso.id, estado: solicitudesAcceso.estado, createdAt: solicitudesAcceso.createdAt })
		.from(solicitudesAcceso)
		.where(eq(solicitudesAcceso.userId, user.id))
		.orderBy(solicitudesAcceso.createdAt)
		.limit(1);

	return {
		user,
		emailDominio,
		dominioValido: !!dominioData,
		dominioCliente: dominioClienteNombre,
		dominioClienteId: dominioData?.clienteId ?? null,
		solicitudExistente: solicitudExistente ?? null
	};
};

export const actions: Actions = {
	solicitar: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { error: 'No autenticado' });

		const form = await request.formData();
		const mensaje = (form.get('mensaje') as string)?.trim() ?? '';
		const clienteId = form.get('cliente_id') as string;

		if (!clienteId) return fail(400, { error: 'Cliente no identificado' });

		const [existing] = await db
			.select({ id: solicitudesAcceso.id })
			.from(solicitudesAcceso)
			.where(and(
				eq(solicitudesAcceso.userId, user.id),
				inArray(solicitudesAcceso.estado, ['pendiente'])
			))
			.limit(1);

		if (existing) {
			return fail(400, { error: 'Ya tienes una solicitud en proceso' });
		}

		try {
			await db.insert(solicitudesAcceso).values({
				userId: user.id,
				clienteId,
				estado: 'pendiente',
				mensaje: mensaje || null
			});
			return { success: true };
		} catch (err) {
			console.error('[solicitar-acceso] Error:', err);
			return fail(500, { error: 'Error al enviar la solicitud. Intenta de nuevo.' });
		}
	}
};
