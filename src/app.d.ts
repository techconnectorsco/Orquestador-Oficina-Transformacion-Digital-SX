import type { Session, User } from 'lucia';
import type { Perfil } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
			perfil: Perfil | null;
		}
		interface PageData {
			user: User | null;
			session: Session | null;
			perfil: Perfil | null;
		}
	}
}

export {};