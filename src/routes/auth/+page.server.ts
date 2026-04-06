import { redirect, type Actions } from '@sveltejs/kit';
import { loginSchema, registerSchema } from '$lib/features/auth/schemas/auth';
import { message, superValidate, setError } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { AUTH_REDIRECT_PATHS } from '$lib/features/auth/config/auth';
import { loginWithPassword, registerWithPassword } from '$lib/server/auth/auth.service';
import { lucia } from '$lib/server/auth/lucia';
import { db } from '$lib/server/db';
import { clientes } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect si ya está logueado
	if (locals.user) {
		throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.LOGIN);
	}

	const modeParam = url.searchParams.get('mode');
	const mode = modeParam ?? 'login';

	const loginForm = await superValidate(zod(loginSchema));
	const registerForm = await superValidate(zod(registerSchema));

	// Cargar lista de clientes ACTIVOS para el select de registro
	let clientesList: Array<{ id: string; nombre: string }> = [];
	try {
		const result = await db
			.select({ id: clientes.id, nombre: clientes.nombre })
			.from(clientes)
			.where(eq(clientes.estaActivo, true))
			.orderBy(asc(clientes.nombre));
		clientesList = result;
	} catch (err) {
		console.error('[auth/+page.server.ts] Error cargando clientes:', err);
	}

	return {
		user: locals.user,
		session: locals.session,
		loginForm,
		registerForm,
		clientes: clientesList,
		mode
	};
};

export const actions: Actions = {
	login: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return message(form, 'Por favor revisa los errores en el formulario');
		}

		const result = await loginWithPassword(form.data.email, form.data.password);

		if (!result.success) {
			return message(form, result.error || 'Error de autenticación', { status: 400 });
		}

		// Crear y setear cookie de sesión
		const sessionCookie = lucia.createSessionCookie(result.sessionId!);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// Soporta redirect param (ej: venía desde /admin)
		const redirectTo = url.searchParams.get('redirect');
		if (redirectTo) {
			throw redirect(303, redirectTo);
		}

		throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.LOGIN);
	},

	register: async ({ request }) => {
		const form = await superValidate(request, zod(registerSchema));

		// Extraer campos ocultos del formulario (dominio detectado)
		const formData = await request.clone().formData();
		const clienteIdDetectado = formData.get('cliente_id_detectado') as string | null;
		const dominioDetectado = formData.get('dominio_detectado') as string | null;

		if (!form.valid) {
			return message(form, 'Por favor revisa los errores en el formulario');
		}

		// Determinar qué cliente y tipo de solicitud usar
		let clienteIdFinal: string | undefined;
		let esAutoDetectado = false;

		if (clienteIdDetectado && dominioDetectado) {
			// Caso A: Dominio fue detectado automáticamente
			clienteIdFinal = clienteIdDetectado;
			esAutoDetectado = true;
		} else if (form.data.solicitar_acceso && form.data.cliente_id) {
			// Caso B: Usuario solicitó acceso manualmente
			clienteIdFinal = form.data.cliente_id;
			esAutoDetectado = false;
		}
		// Caso C: Usuario normal sin solicitud

		const result = await registerWithPassword({
			email: form.data.email,
			password: form.data.password,
			nombreCompleto: form.data.nombre_completo,
			empresa: form.data.empresa,
			cargo: form.data.cargo,
			telefono: form.data.telefono,
			// Pasar info de solicitud de acceso
			solicitarAcceso: !!clienteIdFinal,
			clienteId: clienteIdFinal,
			mensajeSolicitud: form.data.mensaje_solicitud,
			// Nuevos campos para dominio detectado
			dominioDetectado: dominioDetectado || undefined,
			esAutoDetectado
		});

		if (!result.success) {
			if (result.field) {
				return setError(form, result.field as keyof typeof form.data, result.error || 'Error');
			}
			return message(form, result.error || 'Error al crear la cuenta', { status: 400 });
		}

		// Redirige a página de instrucciones de verificación
		throw redirect(
			303,
			`${AUTH_REDIRECT_PATHS.FLOW.VERIFY}?email=${encodeURIComponent(form.data.email)}`
		);
	}
};