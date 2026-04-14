import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { dominiosEmpresa, clientes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================
// POST /api/auth/check-domain
// Verifica si un email pertenece a un cliente registrado
// ============================================
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email || typeof email !== 'string') {
			return json({ found: false });
		}

		// Extraer dominio del email
		const parts = email.toLowerCase().trim().split('@');
		const dominio = parts[1];

		if (!dominio || !dominio.includes('.')) {
			return json({ found: false });
		}

		// Buscar en dominios_empresa
		const [result] = await db
			.select({
				clienteId: clientes.id,
				clienteNombre: clientes.nombre,
				dominio: dominiosEmpresa.dominio
			})
			.from(dominiosEmpresa)
			.innerJoin(clientes, eq(clientes.id, dominiosEmpresa.clienteId))
			.where(
				and(
					eq(dominiosEmpresa.dominio, dominio),
					eq(dominiosEmpresa.estaActivo, true),
					eq(clientes.estaActivo, true)
				)
			)
			.limit(1);

		if (result) {
			return json({
				found: true,
				cliente: {
					id: result.clienteId,
					nombre: result.clienteNombre
				},
				dominio: result.dominio
			});
		}

		return json({ found: false });

	} catch (error) {
		console.error('[check-domain] Error:', error);
		return json({ found: false });
	}
};