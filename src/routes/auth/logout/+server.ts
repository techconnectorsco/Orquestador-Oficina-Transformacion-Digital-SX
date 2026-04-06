import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.session) {
		await lucia.invalidateSession(locals.session.id);
	}
	const sessionCookie = lucia.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	throw redirect(302, '/');
};

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.session) {
		await lucia.invalidateSession(locals.session.id);
	}
	const sessionCookie = lucia.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	throw redirect(302, '/');
};