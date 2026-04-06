<script lang="ts">
	import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-background flex">
	<SidebarAdmin />
	<main class="flex-1 xl:pl-80 pl-4 sm:pl-6 pr-4 sm:pr-8 pt-24 pb-8">
		{@render children()}
	</main>
</div>
