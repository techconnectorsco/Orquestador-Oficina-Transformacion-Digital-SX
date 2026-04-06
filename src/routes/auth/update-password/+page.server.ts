import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { updatePasswordSchema } from '$lib/features/auth/schemas/auth';
import { resetPassword } from '$lib/server/auth/auth.service';
import { AUTH_REDIRECT_PATHS } from '$lib/features/auth/config/auth';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/auth?mode=login');
	}

	return {
		form: await superValidate(zod(updatePasswordSchema)),
		token
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;

		const form = await superValidate(formData, zod(updatePasswordSchema));

		if (!form.valid) {
			return message(form, 'Por favor revisa los errores');
		}

		if (!token) {
			return message(form, 'Token inválido', { status: 400 });
		}

		const result = await resetPassword(token, form.data.password);

		if (!result.success) {
			return message(form, result.error || 'Error al actualizar contraseña', { status: 400 });
		}

		throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.PASSWORD_UPDATE);
	}
};