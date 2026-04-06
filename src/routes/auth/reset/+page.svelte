<script lang="ts">
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { resetPasswordSchema } from '$lib/features/auth/schemas/auth';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting } = superForm(data.form, {
		validators: zodClient(resetPasswordSchema)
	});

	let submitted = $state(false);
</script>

<svelte:head>
	<title>Recuperar contraseña | OTD_SX</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Recuperar contraseña
			</h1>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
				Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
			</p>
		</div>

		{#if $message}
			<div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm">
				{$message}
			</div>
		{/if}

		<form method="POST" use:enhance class="mt-8 space-y-6">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Correo electrónico
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={$form.email}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
						   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						   dark:bg-gray-800 dark:text-white"
					class:border-red-500={$errors.email}
				/>
				{#if $errors.email}
					<p class="mt-1 text-sm text-red-500">{$errors.email}</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={$submitting}
				class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
					   text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
					   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{$submitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
			</button>

			<p class="text-center text-sm text-gray-600 dark:text-gray-400">
				<a href="/auth?mode=login" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
					← Volver al inicio de sesión
				</a>
			</p>
		</form>
	</div>
</div>