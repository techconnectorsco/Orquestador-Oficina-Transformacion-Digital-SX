import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = locals;

	if (!user) {
		return json({ url_imagen: null });
	}

	return json({ url_imagen: user.avatarUrl ?? null });
};
