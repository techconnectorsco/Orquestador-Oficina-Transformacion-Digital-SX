import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO: videos_publi table not yet migrated to Drizzle schema
export const PATCH: RequestHandler = async () => {
	return json({ error: 'Not implemented' }, { status: 501 });
};

export const DELETE: RequestHandler = async () => {
	return json({ error: 'Not implemented' }, { status: 501 });
};
