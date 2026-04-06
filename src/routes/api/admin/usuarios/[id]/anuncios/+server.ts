import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO: anuncios table not part of this platform — stub endpoint
export const GET: RequestHandler = async () => {
	return json({ success: true, anuncios: [] });
};
