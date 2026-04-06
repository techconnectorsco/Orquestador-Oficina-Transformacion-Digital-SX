<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	let loading = $state(false);

	function signInWithMicrosoft() {
		loading = true;
		// Redirigir al endpoint de OAuth
		window.location.href = '/auth/login/microsoft';
	}
</script>

<Button
	type="button"
	variant="outline"
	class="w-full flex items-center justify-center gap-3 py-2.5 border-2 border-input hover:border-ring hover:bg-accent rounded-lg transition-all font-medium text-foreground"
	onclick={signInWithMicrosoft}
	disabled={loading}
>
	{#if loading}
		<Spinner class="w-5 h-5" />
		<span>Conectando...</span>
	{:else}
		<!-- Microsoft Logo -->
		<svg class="w-5 h-5" viewBox="0 0 21 21">
			<rect x="1" y="1" width="9" height="9" fill="#f25022"/>
			<rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
			<rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
			<rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
		</svg>
		<span>Continuar con Microsoft</span>
	{/if}
</Button>