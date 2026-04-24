<script lang="ts">
  import ListaFinanzas from '$lib/components/app/finanzas/lista_finanzas.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Nombre del operador logueado — prioriza nombreCompleto del perfil
  let solicitadoPor = $derived(
    data.perfil?.nombreCompleto ??
    `${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''}`.trim()
  );

  let registros = $derived(
    (data.registros ?? []).map((item: any) => {
      const r = item.registro ?? item;
      const nombreUsuario = item.nombreUsuario ?? null;
      return {
        id:              r.id,
        creadoPor:       r.creadoPor,
        solicitadoPor:   nombreUsuario ?? solicitadoPor,
        companiaFactura: r.companiaFactura,
        cliente:         r.cliente ?? '—',
        tecnicos:        r.tecnicos,
        fechaTrabajo:    r.fechaTrabajo ?? '',
        fechaReportado:  r.fechaReportado ?? '',
        horas:           Number(r.horas),
        moneda:          r.moneda as 'Colones' | 'Dólares',
        montoPorHora:    r.montoPorHora != null ? Number(r.montoPorHora) : null,
        tipoVisita:      r.tipoVisita,
        descripcion:     r.descripcion ?? '',
        pagoHorasExtra:  r.pagoHorasExtra != null ? Number(r.pagoHorasExtra) : null,
        tipoCambio:      Number(r.tipoCambio),
        montoColonizado: r.montoColonizado != null ? Number(r.montoColonizado) : null,
        numeroFactura:   r.numeroFactura ?? null,
      };
    })
  );
</script>

{#if data.noAutenticado}
  <div class="space-y-6">
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.18em] mb-2 text-blue-600 dark:text-blue-400">
        Gestión Principal
      </p>
      <h1 class="text-3xl font-bold text-foreground">Finanzas</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Registros de facturación y horas de soporte técnico
      </p>
    </div>
    <div class="rounded-2xl border border-border bg-card shadow-sm p-16 flex flex-col items-center gap-3 text-center">
      <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <svg class="w-7 h-7 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <p class="text-base font-bold text-foreground">Acceso restringido</p>
      <p class="text-sm text-muted-foreground max-w-sm">
        Necesitas iniciar sesión para ver los registros de facturación.
        Usa el ícono de perfil en la esquina superior derecha para acceder.
      </p>
    </div>
  </div>

{:else}
  <div class="space-y-6 animate-fade-in">
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.18em] mb-2 text-blue-600 dark:text-blue-400">
        Gestión Principal
      </p>
      <h1 class="text-3xl font-bold text-foreground">Finanzas</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Registros de facturación y horas de soporte técnico
      </p>
    </div>
    <ListaFinanzas
      {registros}
      form={data.form}
      esEncargado={data.esEncargado}
      {solicitadoPor}
    />
  </div>
{/if}

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.45s ease-out forwards;
  }
</style>