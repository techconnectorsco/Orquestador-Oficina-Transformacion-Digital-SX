import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { casosExitoService } from '$lib/services/casos-exito.service';

export const GET: RequestHandler = async () => {
	try {
		const rows = await casosExitoService.getVisibles();
		const casos = rows.map((r) => ({ ...r.caso, cliente: r.cliente }));
		return json({ casos });
	} catch (err) {
		console.error('[api/public/casos-exito] Error:', err);
		return json({ casos: [] });
	}
};
