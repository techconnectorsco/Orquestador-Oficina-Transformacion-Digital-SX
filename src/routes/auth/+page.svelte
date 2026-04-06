<script lang="ts">
	import { page } from '$app/stores';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { loginSchema, registerSchema } from '$lib/features/auth/schemas/auth';
	import { debounce } from '$lib/utils/debounce';

	let { data } = $props();

	let mode = $derived($page.url.searchParams.get('mode') || 'login');
	let messageFromUrl = $derived($page.url.searchParams.get('message') || '');

	// ============================================
	// SUPERFORMS: Login
	// ============================================
	const {
		form: loginFormData,
		errors: loginErrors,
		message: loginMessage,
		enhance: loginEnhance,
		submitting: loginSubmitting
	} = superForm(data.loginForm, {
		validators: zodClient(loginSchema)
	});

	// ============================================
	// SUPERFORMS: Registro
	// ============================================
	const {
		form: registerFormData,
		errors: registerErrors,
		message: registerMessage,
		enhance: registerEnhance,
		submitting: registerSubmitting
	} = superForm(data.registerForm, {
		validators: zodClient(registerSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				window.location.href = result.location;
			}
		}
	});

	let showPassword = $state(false);

	// ============================================
	// DETECCIÓN DE DOMINIO
	// ============================================
	let dominioDetectado = $state<{
		found: boolean;
		cliente?: { id: string; nombre: string };
		dominio?: string;
	} | null>(null);
	
	let verificandoDominio = $state(false);

	// Función para verificar el dominio
	async function checkDomain(email: string) {
		// Validar que el email tenga formato básico
		if (!email || !email.includes('@') || !email.split('@')[1]?.includes('.')) {
			dominioDetectado = null;
			return;
		}

		verificandoDominio = true;

		try {
			const response = await fetch('/api/auth/check-domain', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const result = await response.json();
			dominioDetectado = result;

			// Si se detectó un cliente, limpiar la selección manual
			if (result.found && result.cliente) {
				$registerFormData.solicitar_acceso = false;
				$registerFormData.cliente_id = '';
				$registerFormData.mensaje_solicitud = '';
			}
		} catch (error) {
			console.error('Error verificando dominio:', error);
			dominioDetectado = null;
		} finally {
			verificandoDominio = false;
		}
	}

	// Debounce para no hacer muchas llamadas mientras escribe
	const debouncedCheckDomain = debounce(checkDomain, 500);

	// Reactivo: cuando cambia el email, verificar dominio
	$effect(() => {
		const email = $registerFormData.email;
		if (mode === 'register' && email) {
			debouncedCheckDomain(email);
		}
	});

	// Mostrar sección de solicitud manual solo si NO se detectó dominio
	let mostrarSolicitudManual = $derived(
		!dominioDetectado?.found && $registerFormData.solicitar_acceso
	);
</script>

<svelte:head>
	<title>{mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'} | OTD_SX</title>
</svelte:head>

<div class="min-h-screen flex bg-background overflow-y-auto">
	
	<!-- ============================================
	     LADO IZQUIERDO - Branding
	     ============================================ -->
	<div class="hidden xl:flex xl:w-[400px] relative overflow-hidden">
		<div class="auth-grid absolute inset-0 pointer-events-none"></div>
		<div class="blob-blue absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"></div>
		<div class="blob-slate absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none"></div>

		<div class="relative z-10 flex flex-col justify-center px-8 xl:px-12 w-full">
			
				 <a href="https://soportexperto.com"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full no-underline w-fit
				       border border-blue-300/60 dark:border-blue-500/30
				       bg-blue-500/10 hover:bg-blue-500/20
				       transition-colors duration-200"
			>
				<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
				<span class="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">SoporteXperto</span>
			</a>

			<h1 class="font-serif text-2xl xl:text-3xl font-bold leading-[1.15] tracking-tight mb-4 text-foreground">
				Automatización<br />
				<em class="not-italic text-blue-600 dark:text-blue-400">que genera valor</em>
			</h1>

			<p class="text-xs leading-relaxed text-muted-foreground max-w-xs mb-6">
				Oficina de Transformación Digital — automatizamos procesos empresariales.
			</p>

			<div class="grid grid-cols-2 gap-2 max-w-xs">
				{#each [
					{ v: '24+', l: 'Procesos' },
					{ v: '99.8%', l: 'Éxito' }
				] as s}
					<div class="px-3 py-2 rounded-lg border border-border bg-card/50">
						<span class="text-lg font-extrabold leading-none text-blue-600 dark:text-blue-400">{s.v}</span>
						<span class="block text-[8px] uppercase tracking-widest font-semibold text-muted-foreground mt-0.5">{s.l}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- ============================================
	     LADO DERECHO - Formulario
	     ============================================ -->
	<div class="w-full xl:flex-1 flex items-start xl:items-center justify-center px-4 sm:px-6 py-8 xl:py-12 bg-card overflow-y-auto">
		<div class="w-full max-w-md">
			
			<!-- Logo mobile -->
			<div class="xl:hidden text-center mb-8">
				<a href="/" class="inline-flex items-center gap-2 text-2xl font-bold text-foreground no-underline">
					<span class="text-blue-600 dark:text-blue-400">OTD</span>_SX
				</a>
			</div>

			<!-- Header -->
			<div class="mb-8">
				<h2 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					{mode === 'register' ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
				</h2>
				<p class="mt-2 text-sm text-muted-foreground">
					{mode === 'register' 
						? 'Completa tus datos para comenzar' 
						: 'Ingresa tus credenciales para continuar'}
				</p>
			</div>

			<!-- Mensaje de URL -->
			{#if messageFromUrl}
				<div class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
					<svg class="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
					</svg>
					<p class="text-sm text-emerald-600 dark:text-emerald-400">{messageFromUrl}</p>
				</div>
			{/if}

			<!-- ============================================
			     FORMULARIO DE LOGIN
			     ============================================ -->
			{#if mode === 'login'}
				<form method="POST" action="/auth?/login" use:loginEnhance class="space-y-5">
					{#if $loginMessage}
						<div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10">
							<svg class="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<p class="text-sm text-red-600 dark:text-red-400">{$loginMessage}</p>
						</div>
					{/if}

					<!-- Email -->
					<div>
						<label for="login-email" class="block text-sm font-medium mb-2 text-foreground">
							Correo electrónico
						</label>
						<input
							id="login-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={$loginFormData.email}
							class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
							       placeholder:text-muted-foreground
							       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
							       transition-all duration-200"
							class:border-red-500={$loginErrors.email}
							placeholder="tu@email.com"
						/>
						{#if $loginErrors.email}
							<p class="mt-2 text-sm text-red-500">{$loginErrors.email}</p>
						{/if}
					</div>

					<!-- Password -->
					<div>
						<label for="login-password" class="block text-sm font-medium mb-2 text-foreground">
							Contraseña
						</label>
						<div class="relative">
							<input
								id="login-password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="current-password"
								required
								bind:value={$loginFormData.password}
								class="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground
								       placeholder:text-muted-foreground
								       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
								       transition-all duration-200"
								class:border-red-500={$loginErrors.password}
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
							>
								{#if showPassword}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
									</svg>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
									</svg>
								{/if}
							</button>
						</div>
						{#if $loginErrors.password}
							<p class="mt-2 text-sm text-red-500">{$loginErrors.password}</p>
						{/if}
					</div>

					<!-- Forgot password -->
					<div class="flex justify-end">
						<a href="/auth/reset" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
							¿Olvidaste tu contraseña?
						</a>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						disabled={$loginSubmitting}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
						       text-white bg-blue-600 hover:bg-blue-500
						       shadow-lg shadow-blue-600/20
						       disabled:opacity-50 disabled:cursor-not-allowed
						       transition-all duration-200 hover:-translate-y-0.5"
					>
						{#if $loginSubmitting}
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Iniciando sesión...
						{:else}
							Iniciar sesión
							<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
							</svg>
						{/if}
					</button>

					<div class="relative my-6">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-border"></div>
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-card px-3 text-muted-foreground">o</span>
						</div>
					</div>

					<p class="text-center text-sm text-muted-foreground">
						¿No tienes una cuenta?
						<a href="/auth?mode=register" class="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
							Regístrate aquí
						</a>
					</p>
				</form>

			<!-- ============================================
			     FORMULARIO DE REGISTRO
			     ============================================ -->
			{:else}
				<form method="POST" action="/auth?/register" use:registerEnhance class="space-y-5">
					{#if $registerMessage}
						<div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10">
							<svg class="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<p class="text-sm text-red-600 dark:text-red-400">{$registerMessage}</p>
						</div>
					{/if}

					<!-- Nombre completo -->
					<div>
						<label for="nombre_completo" class="block text-sm font-medium mb-2 text-foreground">
							Nombre completo
						</label>
						<input
							id="nombre_completo"
							name="nombre_completo"
							type="text"
							autocomplete="name"
							required
							bind:value={$registerFormData.nombre_completo}
							class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
							       placeholder:text-muted-foreground
							       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
							       transition-all duration-200"
							class:border-red-500={$registerErrors.nombre_completo}
							placeholder="Juan Pérez"
						/>
						{#if $registerErrors.nombre_completo}
							<p class="mt-2 text-sm text-red-500">{$registerErrors.nombre_completo}</p>
						{/if}
					</div>

					<!-- Email con detección de dominio -->
					<div>
						<label for="register-email" class="block text-sm font-medium mb-2 text-foreground">
							Correo electrónico
						</label>
						<div class="relative">
							<input
								id="register-email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={$registerFormData.email}
								class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
								       placeholder:text-muted-foreground
								       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
								       transition-all duration-200"
								class:border-red-500={$registerErrors.email}
								class:border-emerald-500={dominioDetectado?.found}
								placeholder="tu@email.com"
							/>
							{#if verificandoDominio}
								<div class="absolute right-3 top-1/2 -translate-y-1/2">
									<svg class="animate-spin w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								</div>
							{/if}
						</div>
						{#if $registerErrors.email}
							<p class="mt-2 text-sm text-red-500">{$registerErrors.email}</p>
						{/if}
					</div>

					<!-- ============================================
					     ALERTA: Dominio detectado automáticamente
					     ============================================ -->
					{#if dominioDetectado?.found && dominioDetectado.cliente}
						<div class="flex items-start gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
							<svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<div>
								<p class="text-sm font-medium text-emerald-700 dark:text-emerald-300">
									¡Dominio reconocido!
								</p>
								<p class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
									Detectamos que tu correo pertenece a <strong>{dominioDetectado.cliente.nombre}</strong>. 
									Al registrarte, se enviará automáticamente una solicitud de acceso para ver la información de sus automatizaciones.
								</p>
							</div>
						</div>
						<!-- Campo oculto para enviar el cliente detectado -->
						<input type="hidden" name="cliente_id_detectado" value={dominioDetectado.cliente.id} />
						<input type="hidden" name="dominio_detectado" value={dominioDetectado.dominio} />
					{/if}

					<!-- Password -->
					<div>
						<label for="register-password" class="block text-sm font-medium mb-2 text-foreground">
							Contraseña
						</label>
						<div class="relative">
							<input
								id="register-password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="new-password"
								required
								bind:value={$registerFormData.password}
								class="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground
								       placeholder:text-muted-foreground
								       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
								       transition-all duration-200"
								class:border-red-500={$registerErrors.password}
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
							>
								{#if showPassword}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
									</svg>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
									</svg>
								{/if}
							</button>
						</div>
						{#if $registerErrors.password}
							<p class="mt-2 text-sm text-red-500">{$registerErrors.password}</p>
						{:else}
							<p class="mt-2 text-xs text-muted-foreground">Mínimo 8 caracteres, incluyendo una letra y un símbolo</p>
						{/if}
					</div>

					<!-- Campos opcionales -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="empresa" class="block text-sm font-medium mb-2 text-foreground">
								Empresa <span class="text-muted-foreground font-normal">(opcional)</span>
							</label>
							<input
								id="empresa"
								name="empresa"
								type="text"
								bind:value={$registerFormData.empresa}
								class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
								       placeholder:text-muted-foreground
								       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
								       transition-all duration-200"
								placeholder="Tu empresa"
							/>
						</div>
						<div>
							<label for="cargo" class="block text-sm font-medium mb-2 text-foreground">
								Cargo <span class="text-muted-foreground font-normal">(opcional)</span>
							</label>
							<input
								id="cargo"
								name="cargo"
								type="text"
								bind:value={$registerFormData.cargo}
								class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
								       placeholder:text-muted-foreground
								       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
								       transition-all duration-200"
								placeholder="Tu cargo"
							/>
						</div>
					</div>

					<!-- ============================================
					     SECCIÓN: Solicitar acceso manual (solo si NO se detectó dominio)
					     ============================================ -->
					{#if !dominioDetectado?.found && data.clientes && data.clientes.length > 0}
						<div class="pt-2">
							<label class="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
								<input
									type="checkbox"
									name="solicitar_acceso"
									class="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
									bind:checked={$registerFormData.solicitar_acceso}
								/>
								<div>
									<span class="text-sm font-medium text-foreground">
										¿Perteneces a un cliente existente?
									</span>
									<p class="text-xs text-muted-foreground mt-0.5">
										Si tu empresa ya trabaja con nosotros, solicita acceso para ver sus automatizaciones.
									</p>
								</div>
							</label>
						</div>

						<!-- Campos de solicitud manual -->
						{#if mostrarSolicitudManual}
							<div class="space-y-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
								<div>
									<label for="cliente_id" class="block text-sm font-medium mb-2 text-foreground">
										Selecciona la empresa
									</label>
									<select
										id="cliente_id"
										name="cliente_id"
										bind:value={$registerFormData.cliente_id}
										class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
										       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
										       transition-all duration-200"
									>
										<option value="">-- Selecciona un cliente --</option>
										{#each data.clientes as cliente}
											<option value={cliente.id}>{cliente.nombre}</option>
										{/each}
									</select>
									{#if $registerErrors.cliente_id}
										<p class="mt-2 text-sm text-red-500">{$registerErrors.cliente_id}</p>
									{/if}
								</div>

								<div>
									<label for="mensaje_solicitud" class="block text-sm font-medium mb-2 text-foreground">
										¿Cuál es tu relación con esta empresa?
									</label>
									<textarea
										id="mensaje_solicitud"
										name="mensaje_solicitud"
										rows="3"
										bind:value={$registerFormData.mensaje_solicitud}
										class="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground
										       placeholder:text-muted-foreground resize-none
										       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
										       transition-all duration-200"
										placeholder="Ej: Soy el gerente de operaciones y necesito monitorear las automatizaciones..."
									></textarea>
									{#if $registerErrors.mensaje_solicitud}
										<p class="mt-2 text-sm text-red-500">{$registerErrors.mensaje_solicitud}</p>
									{/if}
								</div>

								<p class="text-xs text-blue-600 dark:text-blue-400">
									Tu solicitud será revisada por un administrador. Te notificaremos cuando se apruebe.
								</p>
							</div>
						{/if}
					{/if}

					<!-- Submit -->
					<button
						type="submit"
						disabled={$registerSubmitting}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
						       text-white bg-blue-600 hover:bg-blue-500
						       shadow-lg shadow-blue-600/20
						       disabled:opacity-50 disabled:cursor-not-allowed
						       transition-all duration-200 hover:-translate-y-0.5"
					>
						{#if $registerSubmitting}
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Creando cuenta...
						{:else}
							Crear cuenta
							<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
							</svg>
						{/if}
					</button>

					<div class="relative my-6">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-border"></div>
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-card px-3 text-muted-foreground">o</span>
						</div>
					</div>

					<p class="text-center text-sm text-muted-foreground">
						¿Ya tienes una cuenta?
						<a href="/auth?mode=login" class="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
							Inicia sesión
						</a>
					</p>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.auth-grid {
		background-image:
			linear-gradient(rgb(100 116 139 / 0.08) 1px, transparent 1px),
			linear-gradient(90deg, rgb(100 116 139 / 0.08) 1px, transparent 1px);
		background-size: 56px 56px;
		-webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%);
		mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%);
	}

	.blob-blue {
		background: oklch(0.7 0.15 230 / 0.15);
	}
	:global(.dark) .blob-blue {
		background: oklch(0.5 0.2 230 / 0.2);
	}
	.blob-slate {
		background: oklch(0.8 0.02 240 / 0.2);
	}
	:global(.dark) .blob-slate {
		background: oklch(0.3 0.05 240 / 0.25);
	}
</style>