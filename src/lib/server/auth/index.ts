export { lucia } from './lucia';
export * from './auth.service';

import { db } from '$lib/server/db';
import { perfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/** Obtiene el perfil completo de un usuario incluyendo permisos */
export async function getUserPerfil(userId: string) {
	const result = await db
		.select()
		.from(perfiles)
		.where(eq(perfiles.id, userId))
		.limit(1);

	return result[0] ?? null;
}

/** Verifica si un usuario es administrador */
export async function isUserAdmin(userId: string): Promise<boolean> {
	const perfil = await getUserPerfil(userId);
	return perfil?.esAdmin === true;
}

/** Verifica si un usuario está baneado */
export async function isUserBanned(userId: string): Promise<boolean> {
	const perfil = await getUserPerfil(userId);
	return perfil?.estaBaneado === true;
}