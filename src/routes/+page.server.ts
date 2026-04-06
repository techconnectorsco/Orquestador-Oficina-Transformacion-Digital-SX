/* import type { PageServerLoad } from './$types';
import { casosExitoService } from '$lib/services/casos-exito.service';

export const load: PageServerLoad = async ({ locals }) => {
	const casosExito = await casosExitoService.getVisibles();

	return {
		user: locals.user,
		session: locals.session,
		casosExito
	};
};
 */