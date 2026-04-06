<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { data, children } = $props();
</script>

<ModeWatcher defaultMode="light" />

<div class="relative flex min-h-screen flex-col">
	{@render children()}
</div>

<Toaster richColors duration={4000} />
