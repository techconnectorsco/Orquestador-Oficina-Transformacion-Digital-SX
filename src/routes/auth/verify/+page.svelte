<script lang="ts">
	import { page } from '$app/stores';

	let email = $derived($page.url.searchParams.get('email') || '');
</script>

<svelte:head>
	<title>Verificar email | OTD_SX</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-background">
	<div class="max-w-md w-full text-center">
		
		<!-- Icono -->
		<div class="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8
		            border border-blue-500/30 bg-blue-500/10">
			<svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
			</svg>
		</div>
		
		<!-- Título -->
		<h1 class="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
			Revisa tu correo
		</h1>
		
		<!-- Descripción -->
		<p class="text-sm leading-relaxed mb-2 text-muted-foreground">
			Hemos enviado un enlace de verificación a:
		</p>
		
		{#if email}
			<p class="text-base font-semibold mb-8 text-blue-600 dark:text-blue-400">
				{email}
			</p>
		{/if}

		<!-- Card de instrucciones -->
		<div class="rounded-xl border border-border bg-card p-6 mb-8 text-left">
			<p class="text-xs font-bold uppercase tracking-widest mb-4 text-blue-600 dark:text-blue-400">
				Próximos pasos
			</p>
			<ul class="space-y-3">
				<li class="flex items-start gap-3">
					<span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
					            border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
						1
					</span>
					<span class="text-sm text-muted-foreground">Abre tu bandeja de entrada</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
					            border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
						2
					</span>
					<span class="text-sm text-muted-foreground">Busca el correo de <strong class="text-foreground">OTD_SX</strong></span>
				</li>
				<li class="flex items-start gap-3">
					<span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
					            border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
						3
					</span>
					<span class="text-sm text-muted-foreground">Haz clic en <strong class="text-foreground">"Verificar mi cuenta"</strong></span>
				</li>
			</ul>
		</div>

		<!-- Nota spam -->
		<p class="text-xs text-muted-foreground mb-6">
			¿No lo encuentras? Revisa tu carpeta de <strong class="text-foreground">spam</strong> o correo no deseado.
		</p>
		
		<!-- Link volver -->
		<a
			href="/auth?mode=login"
			class="inline-flex items-center gap-2 text-sm font-semibold no-underline transition-colors
			       text-blue-600 dark:text-blue-400 hover:text-blue-500"
		>
			<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
			</svg>
			Volver al inicio de sesión
		</a>
	</div>
</div>