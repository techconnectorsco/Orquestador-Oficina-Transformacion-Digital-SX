import { redirect, error } from '@sveltejs/kit';
import { microsoft, lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, perfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

interface MicrosoftGraphUser {
	id: string;           // UUID — Microsoft Object ID
	displayName?: string;
	givenName?: string;
	surname?: string;
	mail?: string;        // Can be null for some tenants
	userPrincipalName?: string; // Fallback email
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('microsoft_oauth_state');
	const storedCodeVerifier = cookies.get('microsoft_oauth_code_verifier');

	if (!code || !state || !storedState || state !== storedState || !storedCodeVerifier) {
		throw error(400, 'Invalid OAuth state');
	}

	try {
		// Exchange code for tokens
		const tokens = await microsoft.validateAuthorizationCode(code, storedCodeVerifier);

		// Fetch user info from Microsoft Graph
		const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});

		if (!graphResponse.ok) {
			throw error(400, 'Failed to fetch user info from Microsoft');
		}

		const msUser: MicrosoftGraphUser = await graphResponse.json();

		// Resolve email: prefer mail, fallback to userPrincipalName
		const email = msUser.mail || msUser.userPrincipalName;
		if (!email) {
			throw error(400, 'No email provided by Microsoft account');
		}

		const firstName = msUser.givenName || msUser.displayName?.split(' ')[0] || '';
		const lastName = msUser.surname || msUser.displayName?.split(' ').slice(1).join(' ') || '';

		// Look up existing user by providerId (Microsoft Object ID)
		let existingUser = await db
			.select()
			.from(users)
			.where(eq(users.providerId, msUser.id))
			.limit(1)
			.then((rows) => rows[0] ?? null);

		// Fallback: look up by email
		if (!existingUser) {
			existingUser = await db
				.select()
				.from(users)
				.where(eq(users.email, email))
				.limit(1)
				.then((rows) => rows[0] ?? null);
		}

		let userId: string;

		if (existingUser) {
			userId = existingUser.id;

			// Update provider info if missing or outdated
			if (existingUser.provider !== 'microsoft' || existingUser.providerId !== msUser.id) {
				await db
					.update(users)
					.set({
						provider: 'microsoft',
						providerId: msUser.id,
						firstName,
						lastName,
						verified: true,
						updatedAt: new Date()
					})
					.where(eq(users.id, userId));
			}
		} else {
			// Create new user — use Microsoft Object ID as the UUID primary key
			const now = new Date();
			const inserted = await db
				.insert(users)
				.values({
					id: msUser.id, // Microsoft Object ID is already a UUID
					email,
					provider: 'microsoft',
					providerId: msUser.id,
					firstName,
					lastName,
					role: 'USER',
					verified: true,
					receiveEmail: true,
					createdAt: now,
					updatedAt: now
				})
				.returning({ id: users.id });

			userId = inserted[0].id;

			// Create profile for new user
			await db.insert(perfiles).values({
				id: userId,
				email,
				nombreCompleto: `${firstName} ${lastName}`.trim() || null,
				esAdmin: false,
				estaBaneado: false
			});
		}

		// Check if banned
		const perfil = await db
			.select({ estaBaneado: perfiles.estaBaneado })
			.from(perfiles)
			.where(eq(perfiles.id, userId))
			.limit(1)
			.then((rows) => rows[0] ?? null);

		if (perfil?.estaBaneado) {
			throw redirect(
				303,
				'/auth?message=' + encodeURIComponent('Tu cuenta ha sido suspendida. Contacta a soporte.')
			);
		}

		// Create Lucia session
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// Clean up OAuth cookies
		cookies.delete('microsoft_oauth_state', { path: '/' });
		cookies.delete('microsoft_oauth_code_verifier', { path: '/' });
	} catch (e) {
		console.error('OAuth callback error:', e);
		if (e instanceof Response) throw e;
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Error durante la autenticación');
	}

	throw redirect(302, '/');
};
