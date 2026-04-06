import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO: videos_publi table not yet migrated to Drizzle schema
export const GET: RequestHandler = async () => {
	return json([]);
};

export const POST: RequestHandler = async () => {
	return json({ error: 'Not implemented' }, { status: 501 });
};
