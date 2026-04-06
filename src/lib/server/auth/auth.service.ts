import { db } from '$lib/server/db';
import { users, perfiles, sessions, solicitudesAcceso, dominiosEmpresa, clientes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { lucia } from './lucia';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '$lib/server/email/email.service';

const SALT_ROUNDS = 12;

// ============================================
// TIPOS
// ============================================
export interface LoginResult {
	success: boolean;
	error?: string;
	userId?: string;
	sessionId?: string;
}

export interface RegisterData {
	email: string;
	password: string;
	nombreCompleto: string;
	empresa?: string;
	cargo?: string;
	telefono?: string;
	solicitarAcceso?: boolean;
	clienteId?: string;
	mensajeSolicitud?: string;
}

export interface RegisterResult {
	success: boolean;
	error?: string;
	field?: string;
	userId?: string;
	requiresVerification?: boolean;
	dominioDetectado?: {
		dominio: string;
		clienteId: string;
		clienteNombre: string;
	};
}

// ============================================
// HELPER: Extraer dominio del email
// ============================================
function extractDomain(email: string): string {
	const parts = email.toLowerCase().trim().split('@');
	return parts[1] || '';
}

// ============================================
// HELPER: Buscar cliente por dominio de email
// ============================================
async function findClienteByEmailDomain(email: string): Promise<{
	clienteId: string;
	clienteNombre: string;
	dominio: string;
} | null> {
	const dominio = extractDomain(email);
	
	if (!dominio) return null;

	const [result] = await db
		.select({
			clienteId: dominiosEmpresa.clienteId,
			clienteNombre: clientes.nombre,
			dominio: dominiosEmpresa.dominio
		})
		.from(dominiosEmpresa)
		.innerJoin(clientes, eq(clientes.id, dominiosEmpresa.clienteId))
		.where(
			and(
				eq(dominiosEmpresa.dominio, dominio),
				eq(dominiosEmpresa.estaActivo, true),
				eq(clientes.estaActivo, true)
			)
		)
		.limit(1);

	return result || null;
}

// ============================================
// LOGIN CON EMAIL/PASSWORD (sin cambios)
// ============================================
export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
	try {
		const normalizedEmail = email.toLowerCase().trim();
		
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, normalizedEmail))
			.limit(1);

		if (!user) {
			return { success: false, error: 'Email o contraseña incorrectos' };
		}

		if (!user.passwordHash) {
			return { 
				success: false, 
				error: 'Esta cuenta usa inicio de sesión con Microsoft. Por favor usa el botón de Microsoft.' 
			};
		}

		const validPassword = await bcrypt.compare(password, user.passwordHash);
		if (!validPassword) {
			return { success: false, error: 'Email o contraseña incorrectos' };
		}

		const [perfil] = await db
			.select()
			.from(perfiles)
			.where(eq(perfiles.id, user.id))
			.limit(1);

		if (perfil?.estaBaneado) {
			return { 
				success: false, 
				error: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.' 
			};
		}

		const session = await lucia.createSession(user.id, {});

		return {
			success: true,
			userId: user.id,
			sessionId: session.id
		};
	} catch (error) {
		console.error('[loginWithPassword] Error:', error);
		return { success: false, error: 'Error interno del servidor' };
	}
}

// ============================================
// REGISTRO CON EMAIL/PASSWORD (ACTUALIZADO)
// ============================================
export async function registerWithPassword(data: RegisterData): Promise<RegisterResult> {
	try {
		const email = data.email.toLowerCase().trim();

		// 1. Verificar si el email ya existe
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existingUser) {
			return { 
				success: false, 
				error: 'Este correo electrónico ya está registrado', 
				field: 'email' 
			};
		}

		// 2. Detectar si el dominio del email pertenece a un cliente
		const dominioMatch = await findClienteByEmailDomain(email);

		console.log('[registerWithPassword] Detección de dominio:', {
			email,
			dominio: extractDomain(email),
			clienteEncontrado: dominioMatch?.clienteNombre || 'ninguno'
		});

		// 3. Hash de la contraseña
		const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

		// 4. Token de verificación de email (24 horas)
		const verificationToken = crypto.randomBytes(32).toString('hex');
		const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

		// 5. Separar nombre completo
		const nameParts = data.nombreCompleto.trim().split(' ');
		const firstName = nameParts[0] || '';
		const lastName = nameParts.slice(1).join(' ') || '';

		// 6. Insertar usuario
		const [newUser] = await db
			.insert(users)
			.values({
				email,
				passwordHash,
				firstName,
				lastName,
				emailVerified: false,
				verificationToken,
				verificationTokenExpires: verificationExpires
			})
			.returning();

		if (!newUser) {
			return { success: false, error: 'Error al crear la cuenta' };
		}

		// 7. Crear perfil vinculado al usuario
		await db.insert(perfiles).values({
			id: newUser.id,
			email,
			nombreCompleto: data.nombreCompleto,
			empresa: data.empresa || null,
			cargo: data.cargo || null,
			telefono: data.telefono || null,
			esAdmin: false,
			estaBaneado: false,
			// Si el dominio fue detectado, pre-vincular al cliente (pendiente de aprobación)
			clienteId: null // Se vincula cuando el admin aprueba
		});

		// 8. Lógica de solicitud de acceso
		let solicitudCreada = false;

		if (dominioMatch) {
			// CASO A: Dominio detectado automáticamente
			// Crear solicitud con estado 'auto_detectado' para aprobación rápida del admin
			await db.insert(solicitudesAcceso).values({
				userId: newUser.id,
				clienteId: dominioMatch.clienteId,
				estado: 'auto_detectado',
				mensaje: data.mensajeSolicitud || `Registro automático - dominio ${dominioMatch.dominio} detectado`,
				dominioDetectado: dominioMatch.dominio
			});
			solicitudCreada = true;

			console.log('[registerWithPassword] Solicitud auto-detectada creada:', {
				userId: newUser.id,
				clienteId: dominioMatch.clienteId,
				clienteNombre: dominioMatch.clienteNombre,
				dominio: dominioMatch.dominio
			});

		} else if (data.solicitarAcceso && data.clienteId) {
			// CASO B: Usuario solicitó acceso manualmente a un cliente
			await db.insert(solicitudesAcceso).values({
				userId: newUser.id,
				clienteId: data.clienteId,
				estado: 'pendiente',
				mensaje: data.mensajeSolicitud || null,
				dominioDetectado: null
			});
			solicitudCreada = true;

			console.log('[registerWithPassword] Solicitud manual creada:', {
				userId: newUser.id,
				clienteId: data.clienteId
			});
		}
		// CASO C: Usuario normal sin solicitud de acceso a cliente
		// No se crea ninguna solicitud

		// 9. Enviar email de verificación
		const emailResult = await sendVerificationEmail(email, verificationToken, firstName);
		if (!emailResult.success) {
			console.warn('[registerWithPassword] No se pudo enviar email:', emailResult.error);
		}

		console.log('[registerWithPassword] Usuario registrado:', {
			userId: newUser.id,
			email,
			emailSent: emailResult.success,
			solicitudCreada,
			dominioDetectado: dominioMatch?.dominio || null
		});

		return {
			success: true,
			userId: newUser.id,
			requiresVerification: true,
			dominioDetectado: dominioMatch ? {
				dominio: dominioMatch.dominio,
				clienteId: dominioMatch.clienteId,
				clienteNombre: dominioMatch.clienteNombre
			} : undefined
		};
	} catch (error) {
		console.error('[registerWithPassword] Error:', error);
		return { success: false, error: 'Error al crear la cuenta' };
	}
}

// ============================================
// VERIFICAR EMAIL (sin cambios)
// ============================================
export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
	try {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.verificationToken, token))
			.limit(1);

		if (!user) {
			return { success: false, error: 'Token de verificación inválido' };
		}

		if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
			return { success: false, error: 'El token de verificación ha expirado' };
		}

		await db
			.update(users)
			.set({
				emailVerified: true,
				verificationToken: null,
				verificationTokenExpires: null,
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		return { success: true };
	} catch (error) {
		console.error('[verifyEmail] Error:', error);
		return { success: false, error: 'Error al verificar el email' };
	}
}

// ============================================
// SOLICITAR RESET DE CONTRASEÑA (sin cambios)
// ============================================
export async function requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
	try {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase().trim()))
			.limit(1);

		if (!user) {
			return { success: true };
		}

		if (!user.passwordHash) {
			return { success: true };
		}

		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

		await db
			.update(users)
			.set({
				resetToken,
				resetTokenExpires: resetExpires,
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		const emailResult = await sendPasswordResetEmail(email, resetToken, user.firstName);
		if (!emailResult.success) {
			console.warn('[requestPasswordReset] No se pudo enviar email:', emailResult.error);
		}

		console.log('[requestPasswordReset] Reset solicitado:', {
			email,
			emailSent: emailResult.success
		});

		return { success: true, token: resetToken };
	} catch (error) {
		console.error('[requestPasswordReset] Error:', error);
		return { success: true };
	}
}

// ============================================
// RESETEAR CONTRASEÑA CON TOKEN (sin cambios)
// ============================================
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
	try {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.resetToken, token))
			.limit(1);

		if (!user) {
			return { success: false, error: 'Token de recuperación inválido' };
		}

		if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
			return { success: false, error: 'El token de recuperación ha expirado' };
		}

		const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

		await db
			.update(users)
			.set({
				passwordHash,
				resetToken: null,
				resetTokenExpires: null,
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		await db.delete(sessions).where(eq(sessions.userId, user.id));

		return { success: true };
	} catch (error) {
		console.error('[resetPassword] Error:', error);
		return { success: false, error: 'Error al actualizar la contraseña' };
	}
}

// ============================================
// HELPERS (sin cambios)
// ============================================
export async function getUserById(userId: string) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return user ?? null;
}

export async function getUserByEmail(email: string) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email.toLowerCase().trim()))
		.limit(1);
	return user ?? null;
}