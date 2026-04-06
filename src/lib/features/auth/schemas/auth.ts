import { z } from 'zod';

// ============================================
// CONSTANTES
// ============================================
export const PASSWORD_MIN_LENGTH = 8;

// ============================================
// VALIDACIONES BASE
// ============================================

// Validación de email
const emailValidation = z
	.string({ required_error: 'El correo es obligatorio' })
	.trim()
	.min(1, { message: 'El correo es obligatorio' })
	.email({ message: 'Ingrese una dirección de correo válida' })
	.transform((val) => val.toLowerCase());

// Validación de contraseña para login (solo no-vacía)
const loginPasswordValidation = z
	.string()
	.min(1, { message: 'La contraseña no puede estar vacía' });

// Validación completa de contraseña (registro y update)
const passwordValidation = z
	.string({ required_error: 'La contraseña es obligatoria' })
	.trim()
	.min(PASSWORD_MIN_LENGTH, {
		message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
	})
	.regex(/[A-Za-z]/, {
		message: 'La contraseña debe contener al menos una letra'
	})
	.regex(/[^A-Za-z0-9]/, {
		message: 'La contraseña debe contener al menos un símbolo'
	});

// ============================================
// SCHEMAS
// ============================================

// Schema login
export const loginSchema = z.object({
	email: emailValidation,
	password: loginPasswordValidation
});

// Schema registro (base)
export const registerSchema = z.object({
	email: emailValidation,
	password: passwordValidation,
	nombre_completo: z
		.string({ required_error: 'El nombre es obligatorio' })
		.trim()
		.min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
	empresa: z.string().trim().optional().default(''),
	cargo: z.string().trim().optional().default(''),
	telefono: z.string().trim().optional().default(''),
	solicitar_acceso: z.boolean().default(false),
	cliente_id: z.string().optional().default(''),
	mensaje_solicitud: z.string().trim().optional().default('')
}).superRefine((data, ctx) => {
	if (data.solicitar_acceso) {
		if (!data.cliente_id || data.cliente_id === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Debes seleccionar un cliente',
				path: ['cliente_id']
			});
		}
		if (!data.mensaje_solicitud || data.mensaje_solicitud.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Describe tu relación con el cliente',
				path: ['mensaje_solicitud']
			});
		}
	}
});

// Schema reset de contraseña (envío de email)
export const resetPasswordSchema = z.object({
	email: emailValidation
});

// Schema update de contraseña (con token)
export const updatePasswordSchema = z
	.object({
		password: passwordValidation,
		confirmPassword: z.string().trim()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmPassword']
	});

// ============================================
// TIPOS INFERIDOS
// ============================================
export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;