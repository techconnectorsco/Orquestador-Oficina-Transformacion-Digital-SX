import { redirect } from '@sveltejs/kit';
import { verifyEmail } from '$lib/server/auth/auth.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { token } = params;
	
	if (!token) {
		throw redirect(303, '/auth/error?message=' + encodeURIComponent('Token no proporcionado'));
	}

	const result = await verifyEmail(token);

	if (result.success) {
		throw redirect(
			303,
			'/auth?mode=login&message=' + encodeURIComponent('Email verificado correctamente. Ya puedes iniciar sesión.')
		);
	} else {
		throw redirect(
			303,
			'/auth/error?message=' + encodeURIComponent(result.error || 'Error al verificar email')
		);
	}
};