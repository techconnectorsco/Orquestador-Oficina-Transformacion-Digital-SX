import { lucia, getUserPerfil } from '$lib/server/auth';
import { redirect, error, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// ============================================
// HOOK 1: Validar sesión de Lucia
// ============================================
const authHandle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.perfil = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	// Refrescar cookie si la sesión se renovó
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	// Limpiar cookie si la sesión expiró
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	// Cargar perfil si hay usuario autenticado
	if (user) {
		event.locals.perfil = await getUserPerfil(user.id);
	} else {
		event.locals.perfil = null;
	}

	return resolve(event);
};

// ============================================
// HOOK 2: Auth Guard (protección de rutas)
// ============================================
const authGuard: Handle = async ({ event, resolve }) => {
	const { user, perfil } = event.locals;
	const pathname = event.url.pathname;

	// /admin/* → requiere sesión + esAdmin=true
	if (pathname.startsWith('/admin')) {
		if (!user) {
			throw redirect(303, `/auth?redirect=${encodeURIComponent(pathname)}`);
		}
		if (!perfil?.esAdmin) {
			throw redirect(303, '/');
		}
	}

	// /api/admin/* → devuelve errores JSON
	if (pathname.startsWith('/api/admin')) {
		if (!user) throw error(401, 'No autorizado');
		if (!perfil?.esAdmin) throw error(403, 'Acceso denegado');
	}

	// Usuario ya logueado intentando acceder a /auth → redirigir a home
	if (user && pathname === '/auth') {
		throw redirect(303, '/');
	}

	return resolve(event);
};

// ============================================
// HOOK 3: Headers de seguridad
// ============================================
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.delete('x-sveltekit-page');
	return response;
};

export const handle = sequence(authHandle, authGuard, securityHeaders);