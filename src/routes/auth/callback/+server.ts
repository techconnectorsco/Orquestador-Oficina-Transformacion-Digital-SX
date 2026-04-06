import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// El callback OAuth ahora está en /auth/callback/microsoft/+server.ts
export const GET: RequestHandler = async () => {
	throw redirect(302, '/auth/login/microsoft');
};
