<script lang="ts">
	import { page } from '$app/stores';

	let errorMessage = $derived($page.url.searchParams.get('message') || 'Ha ocurrido un error');
</script>

<svelte:head>
	<title>Error | OTD_SX</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8 text-center">
		<div>
			<div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
				<svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			
			<h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
				Error de autenticación
			</h1>
			
			<p class="mt-4 text-gray-600 dark:text-gray-300">
				{errorMessage}
			</p>
		</div>

		<div class="space-y-4">
			<a
				href="/auth?mode=login"
				class="inline-block w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
			>
				Volver al inicio de sesión
			</a>
			
			<a
				href="/"
				class="inline-block text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400"
			>
				Ir a la página principal
			</a>
		</div>
	</div>
</div>