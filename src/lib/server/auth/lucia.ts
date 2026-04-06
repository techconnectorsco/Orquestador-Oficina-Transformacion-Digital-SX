import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { dev } from '$app/environment';

// Crear el adaptador de Drizzle para PostgreSQL
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// secure: true en producción, false en desarrollo
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			firstName: attributes.first_name,
			lastName: attributes.last_name,
			emailVerified: attributes.email_verified,
			microsoftId: attributes.microsoft_id
		};
	}
});

// Declaración de tipos para Lucia
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	email: string;
	first_name: string;
	last_name: string;
	email_verified: boolean;
	microsoft_id: string | null;
}