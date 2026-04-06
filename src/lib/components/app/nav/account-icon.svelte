<script lang="ts">
	import LoginModal from "$lib/components/auth/loginformmodal.svelte";
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitials } from '$lib/utils';
	import { goto, invalidateAll } from '$app/navigation';

	let { session, user, perfil = null } = $props<{ session: any; user: any; perfil?: any }>();

	let userAvatarUrl = $state<string | null>(perfil?.url_imagen ?? null);

	$effect(() => {
		if (perfil?.url_imagen && userAvatarUrl !== perfil.url_imagen) {
			userAvatarUrl = perfil.url_imagen;
		}
	});

	async function handleLogout() {
		try {
			const response = await fetch('/auth/logout', { method: 'POST' });
			if (response.ok) {
				await invalidateAll();
				goto('/');
			}
		} catch (error) {
			console.error('Error al cerrar sesión:', error);
		}
	}
</script>

{#if user}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="flex items-center gap-2 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
			<Avatar.Root class="size-9 ring-2 ring-blue-500">
				<Avatar.Image src={userAvatarUrl || ''} alt={user.email} />
				<Avatar.Fallback class="bg-blue-500 text-white font-semibold">
					{getInitials(user.nombre || user.email)}
				</Avatar.Fallback>
			</Avatar.Root>
			<span class="hidden md:block max-w-32 grow">
				<span class="block truncate text-sm font-semibold text-gray-900">
					{user.nombre || user.email}
				</span>
			</span>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Item class="hover:bg-blue-50 cursor-pointer">
				<button onclick={() => goto('/Profile')} class="w-full text-left text-blue-600 font-bold">Mi Cuenta</button>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={handleLogout} class="hover:bg-red-50 text-red-600 cursor-pointer font-semibold">
				Cerrar sesión
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<LoginModal />
{/if}
