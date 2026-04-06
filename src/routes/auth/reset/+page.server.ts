import type { PageServerLoad, Actions } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { resetPasswordSchema } from '$lib/features/auth/schemas/auth';
import { requestPasswordReset } from '$lib/server/auth/auth.service';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(resetPasswordSchema))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(resetPasswordSchema));

		if (!form.valid) {
			return message(form, 'Por favor ingresa un correo válido');
		}

		const result = await requestPasswordReset(form.data.email);

		// Siempre mostrar éxito (no revelar si el email existe — previene enumeración)
		return message(form, 'Si el correo existe, recibirás un enlace de recuperación', { status: 200 });
	}
};