<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let clientes = $derived(data.clientes ?? []);

	type Mode = 'crear' | 'editar' | null;
	let mode       = $state<Mode>(null);
	let editTarget = $state<any>(null);
	let guardando  = $state(false);

	let fNombre      = $state('');
	let fSlug        = $state('');
	let fDescripcion = $state('');
	let fLogoUrl     = $state('');
	let fSitioWeb    = $state('');
	let fActivo      = $state(true);

	function slugify(s: string) {
		return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
	}

	function onNombreInput() {
		if (mode === 'crear') fSlug = slugify(fNombre);
	}

	function abrirCrear() {
		mode = 'crear'; editTarget = null;
		fNombre = ''; fSlug = ''; fDescripcion = ''; fLogoUrl = ''; fSitioWeb = ''; fActivo = true;
	}

	function abrirEditar(c: any) {
		mode = 'editar'; editTarget = c;
		fNombre      = c.nombre       ?? '';
		fSlug        = c.slug         ?? '';
		fDescripcion = c.descripcion  ?? '';
		fLogoUrl     = c.logoUrl      ?? '';
		fSitioWeb    = c.sitioWeb     ?? '';
		fActivo      = c.estaActivo   ?? true;
	}

	function cerrarModal() { mode = null; editTarget = null; }

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (guardando) return;
		guardando = true;
		const formEl = e.target as HTMLFormElement;
		const fd = new FormData(formEl);
		fd.set('esta_activo', String(fActivo));
		try {
			const action = mode === 'crear' ? '?/crear' : '?/actualizar';
			const res = await fetch(action, { method: 'POST', body: fd });
			if (res.ok) { cerrarModal(); await invalidateAll(); }
		} finally {
			guardando = false;
		}
	}

	function getInitials(nombre: string) {
		return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
	}

	$effect(() => {
		if (form?.success) cerrarModal();
	});
</script>

<div class="space-y-6 animate-fade-in">

	<!-- Botón flotante -->
	<button
		onclick={abrirCrear}
		class="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl
		       text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500
		       shadow-xl shadow-blue-600/30 transition-all duration-200
		       hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/40"
	>
		<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
		</svg>
		Nuevo cliente
	</button>

	{#if form?.error}
		<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
			{form.error}
		</div>
	{/if}

	<!-- Lista -->
	{#if clientes.length === 0}
		<div class="bg-card border border-dashed border-border rounded-2xl p-16 text-center">
			<p class="text-4xl mb-4">🏢</p>
			<p class="text-sm font-semibold text-foreground mb-1">Sin clientes aún</p>
			<p class="text-xs text-muted-foreground mb-4">Agrega el primer cliente.</p>
			<button onclick={abrirCrear}
			        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
			               bg-blue-600 hover:bg-blue-500 text-white transition-colors">
				+ Agregar cliente
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each clientes as c}
				<div class="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow
				            {!c.estaActivo ? 'opacity-60' : ''}">
					<div class="p-5">
						<!-- Cabecera -->
						<div class="flex items-start gap-4 mb-4">
							<div class="w-14 h-14 rounded-2xl flex items-center justify-center
							            text-base font-extrabold shrink-0 overflow-hidden
							            bg-blue-500/10 border-2 border-blue-500/20">
								{#if c.logoUrl}
									<img src={c.logoUrl} alt={c.nombre} class="w-full h-full object-cover"/>
								{:else}
									<span class="text-blue-600 dark:text-blue-400">{getInitials(c.nombre)}</span>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-bold text-foreground text-sm truncate">{c.nombre}</p>
								<p class="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">/{c.slug}</p>
								{#if c.sitioWeb}
									<a href={c.sitioWeb} target="_blank" rel="noopener"
									   class="text-[11px] text-blue-500 hover:underline truncate block mt-0.5">
										{c.sitioWeb}
									</a>
								{/if}
							</div>
						</div>

						{#if c.descripcion}
							<p class="text-xs text-muted-foreground line-clamp-2 mb-4">{c.descripcion}</p>
						{/if}

						<!-- Toggle visibilidad + Editar -->
						<div class="flex items-center gap-2 pt-3 border-t border-border">
							<form method="POST" action="?/toggleVisibilidad" use:enhance={() => {
								return async ({ update }) => { await update(); await invalidateAll(); };
							}}>
								<input type="hidden" name="id" value={c.id}/>
								<input type="hidden" name="esta_activo" value={String(!c.estaActivo)}/>
								<button type="submit"
								        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold
								               border transition-colors {c.estaActivo
								                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
								                 : 'bg-muted border-border text-muted-foreground'}">
									<span class="w-1.5 h-1.5 rounded-full {c.estaActivo ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
									{c.estaActivo ? 'Visible' : 'Oculto'}
								</button>
							</form>

							<button onclick={() => abrirEditar(c)}
							        class="ml-auto px-4 py-1.5 rounded-xl text-xs font-semibold
							               border border-border text-foreground bg-muted hover:bg-card transition-colors">
								Editar
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal crear/editar -->
{#if mode}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onclick={cerrarModal}></div>

	<div class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
	            w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl
	            overflow-y-auto max-h-[92vh]">

		<div class="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
			<h2 class="text-base font-bold text-foreground">
				{mode === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}
			</h2>
			<button onclick={cerrarModal} aria-label="Cerrar modal" class="text-muted-foreground hover:text-foreground transition-colors">
				<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
				</svg>
			</button>
		</div>

		<form onsubmit={handleSubmit} class="p-6 space-y-5">
			{#if mode === 'editar'}
				<input type="hidden" name="id" value={editTarget.id}/>
			{/if}

			<!-- Nombre + Slug -->
			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label for="f-nombre" class="text-xs font-semibold text-foreground">Nombre <span class="text-red-500">*</span></label>
					<input id="f-nombre" type="text" name="nombre" bind:value={fNombre} oninput={onNombreInput} required
					       class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background
					              border border-zinc-300 dark:border-zinc-600
					              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="f-slug" class="text-xs font-semibold text-foreground">Slug <span class="text-red-500">*</span></label>
					<input id="f-slug" type="text" name="slug" bind:value={fSlug} required
					       class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background font-mono
					              border border-zinc-300 dark:border-zinc-600
					              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
				</div>
			</div>

			<!-- Descripción -->
			<div class="flex flex-col gap-1.5">
				<label for="f-descripcion" class="text-xs font-semibold text-foreground">Descripción</label>
				<textarea id="f-descripcion" name="descripcion" bind:value={fDescripcion} rows="3"
				          class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background resize-none
				                 border border-zinc-300 dark:border-zinc-600
				                 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"></textarea>
			</div>

			<!-- Logo URL -->
			<div class="flex flex-col gap-1.5">
				<label for="f-logo" class="text-xs font-semibold text-foreground">URL del logo</label>
				<input id="f-logo" type="url" name="logo_url" bind:value={fLogoUrl} placeholder="https://..."
				       class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background
				              border border-zinc-300 dark:border-zinc-600
				              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
				{#if fLogoUrl}
					<img src={fLogoUrl} alt="preview" class="mt-1 h-10 object-contain rounded-lg border border-border bg-muted p-1"/>
				{/if}
			</div>

			<!-- Sitio web -->
			<div class="flex flex-col gap-1.5">
				<label for="f-sitio" class="text-xs font-semibold text-foreground">Sitio web</label>
				<input id="f-sitio" type="url" name="sitio_web" bind:value={fSitioWeb} placeholder="https://..."
				       class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background
				              border border-zinc-300 dark:border-zinc-600
				              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
			</div>

			<!-- Visible -->
			<label class="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
				<input type="checkbox" bind:checked={fActivo} class="w-4 h-4 rounded"/>
				<div>
					<p class="text-xs font-semibold text-foreground">Visible para usuarios</p>
					<p class="text-[10px] text-muted-foreground">Si está desmarcado el cliente queda oculto</p>
				</div>
			</label>

			<!-- Botones -->
			<div class="flex gap-3 pt-2 border-t border-border">
				<button type="submit" disabled={guardando}
				        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
				               bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white transition-colors">
					{#if guardando}
						<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12"/>
						</svg>
						Guardando…
					{:else}
						{mode === 'crear' ? 'Crear cliente' : 'Guardar cambios'}
					{/if}
				</button>
				<button type="button" onclick={cerrarModal}
				        class="px-5 py-2.5 rounded-xl text-sm font-semibold
				               border border-border text-foreground hover:bg-muted transition-colors">
					Cancelar
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(12px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in { animation: fade-in 0.4s ease-out forwards; }

	:global(.field-group) {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	:global(.field-label) {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		letter-spacing: 0.01em;
	}
	:global(.field-input) {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		border: 1.5px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-shadow: 0 1px 2px rgba(0,0,0,0.04);
	}
	:global(.field-input::placeholder) {
		color: hsl(var(--muted-foreground) / 0.6);
	}
	:global(.field-input:focus) {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 1px 2px rgba(0,0,0,0.04);
	}
</style>
