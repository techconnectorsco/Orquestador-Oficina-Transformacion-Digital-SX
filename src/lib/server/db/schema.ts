import {
	pgTable,
	uuid,
	text,
	varchar,
	boolean,
	integer,
	timestamp,
	index,
	uniqueIndex,
	jsonb
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
// TABLA: equipo
// ============================================
export const equipo = pgTable('equipo', {
	id: uuid('id').primaryKey().defaultRandom(),
	nombre: text('nombre').notNull(),
	cargo: text('cargo').notNull(),
	descripcion: text('descripcion'),
	email: text('email'),
	fotoUrl: text('foto_url'),
	color: text('color').default('#3b82f6'),
	orden: integer('orden').default(0),
	estaActivo: boolean('esta_activo').default(true),
	visible: boolean('visible').default(true),
	redesSociales: jsonb('redes_sociales').default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TABLA: casos_exito
// ============================================
export const casosExito = pgTable('casos_exito', {
	id: uuid('id').primaryKey().defaultRandom(),
	titulo: text('titulo').notNull(),
	descripcion: text('descripcion').notNull(),
	industria: text('industria'),
	tipoAutomatizacion: text('tipo_automatizacion'),
	metricasPublicas: jsonb('metricas_publicas'),
	imagenUrl: text('imagen_url'),
	estaPublicado: boolean('esta_publicado').default(true),
	orden: integer('orden').default(0),
	clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
	mostrarCliente: boolean('mostrar_cliente').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TABLA: automatizaciones
// ============================================
export const automatizaciones = pgTable('automatizaciones', {
	id: uuid('id').primaryKey().defaultRandom(),
	clienteId: uuid('cliente_id').notNull().references(() => clientes.id, { onDelete: 'cascade' }),
	nombre: text('nombre').notNull(),
	descripcion: text('descripcion'),
	tipo: text('tipo').notNull(),
	repoUrl: text('repo_url'),
	frecuencia: text('frecuencia'),
	configDocker: jsonb('config_docker').default({}),
	estaActiva: boolean('esta_activa').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TABLA: ejecuciones
// ============================================
export const ejecuciones = pgTable('ejecuciones', {
	id: uuid('id').primaryKey().defaultRandom(),
	automatizacionId: uuid('automatizacion_id').notNull().references(() => automatizaciones.id, { onDelete: 'cascade' }),
	fechaInicio: timestamp('fecha_inicio', { withTimezone: true }).defaultNow(),
	fechaFin: timestamp('fecha_fin', { withTimezone: true }),
	estado: text('estado').default('en_ejecucion'),
	metricas: jsonb('metricas').default({}),
	logSalida: text('log_salida'),
	causaError: text('causa_error'),
	observaciones: text('observaciones'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ============================================
// TABLA: proyectos_software
// ============================================
export const proyectosSoftware = pgTable('proyectos_software', {
	id: uuid('id').primaryKey().defaultRandom(),
	clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
	nombre: varchar('nombre').notNull(),
	descripcion: text('descripcion'),
	urlAcceso: text('url_acceso'),
	tecnologias: text('tecnologias'),
	tipo: varchar('tipo'),
	estado: varchar('estado').default('Activo'),
	fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
	capturaPantallaUrl: text('captura_pantalla_url')
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
export type EquipoMiembro = typeof equipo.$inferSelect;
export type CasoExito = typeof casosExito.$inferSelect;
export type Automatizacion = typeof automatizaciones.$inferSelect;
export type Ejecucion = typeof ejecuciones.$inferSelect;
export type ProyectoSoftware = typeof proyectosSoftware.$inferSelect;