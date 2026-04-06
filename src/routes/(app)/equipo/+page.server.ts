import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { equipo } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	const equipoRows = await db
		.select()
		.from(equipo)
		.where(eq(equipo.visible, true))
		.orderBy(asc(equipo.orden));

	return {
		user,
		equipo: equipoRows
	};
};
