import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clientesService } from '$lib/services/clientes.service';

export const GET: RequestHandler = async () => {
	try {
		const clientes = await clientesService.getAll();
		return json({ clientes: clientes.map((c) => ({ id: c.id, nombre: c.nombre })) });
	} catch (err) {
		console.error('[api/public/clientes] Error:', err);
		return json({ clientes: [] });
	}
};
