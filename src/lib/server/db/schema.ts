import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	index
} from 'drizzle-orm/pg-core';

// ============================================
// TABLA: users
// ============================================
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	microsoftId: text('microsoft_id').unique(),
	firstName: text('first_name').default('').notNull(),
	lastName: text('last_name').default('').notNull(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	verificationToken: text('verification_token'),
	verificationTokenExpires: timestamp('verification_token_expires', { withTimezone: true }),
	resetToken: text('reset_token'),
	resetTokenExpires: timestamp('reset_token_expires', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
	emailIdx: index('users_email_idx').on(table.email),
	microsoftIdIdx: index('users_microsoft_id_idx').on(table.microsoftId)
}));

// ============================================
// TABLA: sessions (Lucia v3 requiere esto)
// ============================================
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

// ============================================
// TABLA: perfiles (Extensión del usuario)
// ============================================
export const perfiles = pgTable('perfiles', {
	id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	nombreCompleto: text('nombre_completo'),
	urlImagen: text('url_imagen'),
	esAdmin: boolean('es_admin').default(false).notNull(),
	estaBaneado: boolean('esta_baneado').default(false).notNull(),
	empresa: text('empresa'),
	cargo: text('cargo'),
	telefono: text('telefono'),
	clienteId: uuid('cliente_id'),
	fechaAprobacion: timestamp('fecha_aprobacion', { withTimezone: true }),
	aprobadoPor: uuid('aprobado_por'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TABLA: clientes (ACTUALIZADA con campos de Supabase)
// ============================================
export const clientes = pgTable('clientes', {
	id: uuid('id').primaryKey().defaultRandom(),
	nombre: text('nombre').notNull(),
	slug: text('slug').notNull().unique(),
	descripcion: text('descripcion'),
	logoUrl: text('logo_url'),
	sitioWeb: text('sitio_web'),
	contactoInfo: jsonb('contacto_info').default({}),
	estaActivo: boolean('esta_activo').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
	slugIdx: uniqueIndex('clientes_slug_idx').on(table.slug)
}));

// ============================================
// TABLA: dominios_empresa (NUEVA)
// ============================================
export const dominiosEmpresa = pgTable('dominios_empresa', {
	id: uuid('id').primaryKey().defaultRandom(),
	clienteId: uuid('cliente_id')
		.notNull()
		.references(() => clientes.id, { onDelete: 'cascade' }),
	dominio: text('dominio').notNull(),
	estaActivo: boolean('esta_activo').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
	dominioIdx: index('dominios_empresa_dominio_idx').on(table.dominio),
	clienteIdx: index('dominios_empresa_cliente_idx').on(table.clienteId)
}));

// ============================================
// TABLA: solicitudes_acceso (ACTUALIZADA)
// ============================================
export const solicitudesAcceso = pgTable('solicitudes_acceso', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	clienteId: uuid('cliente_id')
		.notNull()
		.references(() => clientes.id, { onDelete: 'cascade' }),
	estado: text('estado').default('pendiente').notNull(), // 'pendiente', 'auto_detectado', 'aprobada', 'rechazada'
	mensaje: text('mensaje'),
	notasAdmin: text('notas_admin'),
	dominioDetectado: text('dominio_detectado'), // NUEVO: guardar el dominio que se detectó
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TIPOS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Perfil = typeof perfiles.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type DominioEmpresa = typeof dominiosEmpresa.$inferSelect;
export type SolicitudAcceso = typeof solicitudesAcceso.$inferSelect;