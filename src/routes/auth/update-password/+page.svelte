<script lang="ts">
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updatePasswordSchema } from '$lib/features/auth/schemas/auth';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting } = superForm(data.form, {
		validators: zodClient(updatePasswordSchema)
	});

	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Nueva contraseña | OTD_SX</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Crear nueva contraseña
			</h1>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
				Ingresa tu nueva contraseña
			</p>
		</div>

		{#if $message}
			<div class="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
				{$message}
			</div>
		{/if}

		<form method="POST" use:enhance class="mt-8 space-y-6">
			<!-- Token oculto -->
			<input type="hidden" name="token" value={data.token} />

			<div class="space-y-4">
				<!-- Nueva contraseña -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Nueva contraseña
					</label>
					<div class="relative mt-1">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							required
							bind:value={$form.password}
							class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
								   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
								   dark:bg-gray-800 dark:text-white pr-10"
							class:border-red-500={$errors.password}
						/>
						<button
							type="button"
							onclick={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>
					{#if $errors.password}
						<p class="mt-1 text-sm text-red-500">{$errors.password}</p>
					{:else}
						<p class="mt-1 text-xs text-gray-500">Mínimo 8 caracteres, incluyendo una letra y un símbolo</p>
					{/if}
				</div>

				<!-- Confirmar contraseña -->
				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Confirmar contraseña
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						required
						bind:value={$form.confirmPassword}
						class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
							   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
							   dark:bg-gray-800 dark:text-white"
						class:border-red-500={$errors.confirmPassword}
					/>
					{#if $errors.confirmPassword}
						<p class="mt-1 text-sm text-red-500">{$errors.confirmPassword}</p>
					{/if}
				</div>
			</div>

			<button
				type="submit"
				disabled={$submitting}
				class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
					   text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
					   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{$submitting ? 'Actualizando...' : 'Actualizar contraseña'}
			</button>
		</form>
	</div>
</div>