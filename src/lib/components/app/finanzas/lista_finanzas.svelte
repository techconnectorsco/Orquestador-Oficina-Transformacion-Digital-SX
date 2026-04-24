<script lang="ts">
  import FormularioOperador from './formulario_operador.svelte';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { RegistroFacturacionSchema } from '$lib/features/finanzas/schemas';

  const IVA = 0.13;

  type Registro = {
    id:              string;
    creadoPor:       string;
    solicitadoPor:   string;
    companiaFactura: string;
    cliente:         string;
    tecnicos:        string;
    fechaTrabajo:    string;
    fechaReportado:  string;
    horas:           number;
    moneda:          'Colones' | 'Dólares';
    montoPorHora:    number | null;
    tipoVisita:      string;
    descripcion:     string;
    pagoHorasExtra:  number | null;
    tipoCambio:      number;
    montoColonizado: number | null;
    numeroFactura:   string | null;
  };

  let {
    registros     = [],
    form,
    esEncargado   = false,
    solicitadoPor = ''
  }: {
    registros:     Registro[];
    form:          SuperValidated<RegistroFacturacionSchema>;
    esEncargado:   boolean;
    solicitadoPor: string;
  } = $props();

  let clientesUnicos = $derived([
    ...new Set(registros.map(r => r.cliente).filter(Boolean))
  ].sort());

  let companiasUnicas = $derived([
    ...new Set(registros.map(r => r.companiaFactura).filter(Boolean))
  ].sort());

  let mostrarFormulario  = $state(false);
  let registroSeleccionado = $state<Registro | null>(null);
  let modoDetalle        = $state(false);

  let busqueda      = $state('');
  let filtroCliente = $state('');
  let filtroCompania= $state('');
  let filtroMoneda  = $state('');
  let ordenCampo    = $state('');
  let ordenDir      = $state<'asc' | 'desc'>('asc');
  let filtrosAbiertos = $state(false);

  let hayFiltrosActivos = $derived(
    busqueda !== '' || filtroCliente !== '' || filtroCompania !== '' || filtroMoneda !== ''
  );

  let registrosProcesados = $derived.by(() => {
    let lista = [...registros];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(r =>
        r.solicitadoPor.toLowerCase().includes(q)   ||
        r.cliente.toLowerCase().includes(q)          ||
        r.tecnicos.toLowerCase().includes(q)         ||
        r.descripcion.toLowerCase().includes(q)      ||
        r.tipoVisita.toLowerCase().includes(q)       ||
        r.companiaFactura.toLowerCase().includes(q)  ||
        (r.numeroFactura ?? '').toLowerCase().includes(q)
      );
    }
    if (filtroCliente)  lista = lista.filter(r => r.cliente         === filtroCliente);
    if (filtroCompania) lista = lista.filter(r => r.companiaFactura === filtroCompania);
    if (filtroMoneda)   lista = lista.filter(r => r.moneda          === filtroMoneda);
    if (ordenCampo) {
      lista.sort((a, b) => {
        const av = (a as any)[ordenCampo];
        const bv = (b as any)[ordenCampo];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return ordenDir === 'asc' ? cmp : -cmp;
      });
    }
    return lista;
  });

  function abrirDetalle(reg: Registro) {
    registroSeleccionado = reg;
    modoDetalle          = true;
    mostrarFormulario    = false; // cierra el de creación si estaba abierto
  }

  function cerrarPanel() {
    mostrarFormulario    = false;
    modoDetalle          = false;
    registroSeleccionado = null;
  }

  function abrirNuevo() {
    modoDetalle          = false;
    registroSeleccionado = null;
    mostrarFormulario    = !mostrarFormulario;
  }

  function toggleOrden(campo: string) {
    if (ordenCampo === campo) { ordenDir = ordenDir === 'asc' ? 'desc' : 'asc'; }
    else { ordenCampo = campo; ordenDir = 'asc'; }
  }

  function limpiarFiltros() {
    busqueda = ''; filtroCliente = ''; filtroCompania = ''; filtroMoneda = '';
    ordenCampo = ''; ordenDir = 'asc';
  }

  function fmt(n: number, dec = 2) {
    return n.toLocaleString('es-CR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  type Col = { key: string; label: string; align?: 'right'; width: string };
  const cols: Col[] = [
    { key: 'numeroFactura',   label: 'No. Factura',      width: 'min-w-[120px]'  },
    { key: 'solicitadoPor',   label: 'Solicitado Por',   width: 'min-w-[140px]'  },
    { key: 'companiaFactura', label: 'Compañía Factura', width: 'min-w-[220px]'  },
    { key: 'cliente',         label: 'Cliente',          width: 'min-w-[180px]'  },
    { key: 'tecnicos',        label: 'Técnicos',         width: 'min-w-[160px]'  },
    { key: 'fechaTrabajo',    label: 'F. Trabajo',       width: 'min-w-[110px]'  },
    { key: 'fechaReportado',  label: 'F. Reportado',     width: 'min-w-[110px]'  },
    { key: 'horas',           label: 'Hrs',   align: 'right', width: 'min-w-[70px]'  },
    { key: 'moneda',          label: 'Moneda',           width: 'min-w-[90px]'   },
    { key: 'montoPorHora',    label: 'Tarifa', align: 'right', width: 'min-w-[110px]' },
    { key: 'tipoVisita',      label: 'Tipo Visita',      width: 'min-w-[200px]'  },
    { key: 'descripcion',     label: 'Descripción',      width: 'min-w-[280px]'  },
    { key: '_colonizado',     label: 'Colonizado c/IVA', align: 'right', width: 'min-w-[150px]' },
  ];
</script>

<div class="space-y-4">

  <!-- ── Toolbar ───────────────────────────────────────────────── -->
  <div class="bg-card rounded-2xl border border-border shadow-sm p-4">
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Buscar por cliente, técnico, factura, descripción..."
          bind:value={busqueda}
          class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground bg-background
                 border border-zinc-300 dark:border-zinc-600
                 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
      </div>

      <button onclick={() => (filtrosAbiertos = !filtrosAbiertos)}
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors
               {filtrosAbiertos || hayFiltrosActivos
                 ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                 : 'border-border text-muted-foreground hover:bg-muted'}">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        Filtros
        {#if hayFiltrosActivos}
          <span class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
        {/if}
      </button>

      <button onclick={abrirNuevo}
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap
               transition-all duration-200
               {mostrarFormulario && !modoDetalle
                 ? 'bg-zinc-200 dark:bg-zinc-700 text-foreground'
                 : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5'}">
        {#if mostrarFormulario && !modoDetalle}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Cancelar
        {:else}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo Registro
        {/if}
      </button>
    </div>

    {#if filtrosAbiertos}
      <div class="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border" style="animation: filters-in 0.2s ease-out">
        <div class="flex flex-col gap-1 min-w-[220px]">
          <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Compañía</label>
          <select bind:value={filtroCompania}
            class="px-3 py-2 rounded-xl text-sm text-foreground bg-background
                   border border-zinc-300 dark:border-zinc-600
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
            <option value="">Todas</option>
            {#each companiasUnicas as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col gap-1 min-w-[180px]">
          <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cliente</label>
          <select bind:value={filtroCliente}
            class="px-3 py-2 rounded-xl text-sm text-foreground bg-background
                   border border-zinc-300 dark:border-zinc-600
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
            <option value="">Todos</option>
            {#each clientesUnicos as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col gap-1 min-w-[140px]">
          <label class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Moneda</label>
          <select bind:value={filtroMoneda}
            class="px-3 py-2 rounded-xl text-sm text-foreground bg-background
                   border border-zinc-300 dark:border-zinc-600
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
            <option value="">Todas</option>
            <option value="Dólares">Dólares</option>
            <option value="Colones">Colones</option>
          </select>
        </div>
        {#if hayFiltrosActivos}
          <div class="flex items-end">
            <button onclick={limpiarFiltros}
              class="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground
                     hover:text-foreground hover:bg-muted border border-border transition-colors">
              Limpiar
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- ── Formulario / Detalle inline ───────────────────────────── -->
  {#if mostrarFormulario || modoDetalle}
    <div style="animation: form-in 0.25s ease-out">
      <FormularioOperador
        {form}
        {solicitadoPor}
        modoDetalle={modoDetalle}
        registro={registroSeleccionado}
        onclose={cerrarPanel}
      />
    </div>
  {/if}

  <!-- ── Tabla ─────────────────────────────────────────────────── -->
  <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

    {#if esEncargado}
      <div class="px-5 py-2.5 border-b border-border bg-amber-500/5 flex items-center gap-2">
        <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          Vista de encargado — mostrando todos los registros
        </p>
      </div>
    {/if}

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/30">
            {#each cols as col}
              <th class="px-4 py-3 text-left select-none {col.align === 'right' ? 'text-right' : ''} {col.width}">
                <button onclick={() => col.key !== '_colonizado' && toggleOrden(col.key)}
                  class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider
                         text-muted-foreground hover:text-foreground transition-colors
                         {col.align === 'right' ? 'ml-auto' : ''}">
                  {col.label}
                  {#if col.key !== '_colonizado'}
                    {#if ordenCampo === col.key}
                      <svg class="w-3 h-3 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        {#if ordenDir === 'asc'}<path d="M12 19V5M5 12l7-7 7 7"/>
                        {:else}<path d="M12 5v14M5 12l7 7 7-7"/>{/if}
                      </svg>
                    {:else}
                      <svg class="w-3 h-3 opacity-25 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                      </svg>
                    {/if}
                  {/if}
                </button>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each registrosProcesados as reg (reg.id)}
            <tr
              onclick={() => abrirDetalle(reg)}
              class="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer
                     {registroSeleccionado?.id === reg.id ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''}">
              <!-- No. Factura -->
              <td class="px-4 py-3.5">
                {#if reg.numeroFactura}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                               bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {reg.numeroFactura}
                  </span>
                {:else}
                  <span class="text-[11px] text-muted-foreground/60 italic">Pendiente</span>
                {/if}
              </td>
              <!-- Solicitado Por -->
              <td class="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{reg.solicitadoPor}</td>
              <!-- Compañía -->
              <td class="px-4 py-3.5 text-muted-foreground" title={reg.companiaFactura}>
                <span class="block truncate max-w-[200px]">{reg.companiaFactura}</span>
              </td>
              <!-- Cliente -->
              <td class="px-4 py-3.5 text-muted-foreground" title={reg.cliente}>
                <span class="block truncate max-w-[160px]">{reg.cliente || '—'}</span>
              </td>
              <!-- Técnicos -->
              <td class="px-4 py-3.5 text-muted-foreground" title={reg.tecnicos}>
                <span class="block truncate max-w-[140px]">{reg.tecnicos}</span>
              </td>
              <!-- F. Trabajo -->
              <td class="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{reg.fechaTrabajo || '—'}</td>
              <!-- F. Reportado -->
              <td class="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{reg.fechaReportado || '—'}</td>
              <!-- Horas -->
              <td class="px-4 py-3.5 text-foreground font-semibold text-right">{reg.horas || '—'}</td>
              <!-- Moneda -->
              <td class="px-4 py-3.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                            {reg.moneda === 'Dólares'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'}">
                  {reg.moneda}
                </span>
              </td>
              <!-- Tarifa -->
              <td class="px-4 py-3.5 text-foreground font-semibold text-right whitespace-nowrap">
                {#if reg.montoPorHora != null}
                  {reg.moneda === 'Dólares' ? `$${fmt(reg.montoPorHora)}` : `₡${fmt(reg.montoPorHora, 0)}`}
                {:else}—{/if}
              </td>
              <!-- Tipo Visita -->
              <td class="px-4 py-3.5 text-muted-foreground" title={reg.tipoVisita}>
                <span class="block truncate max-w-[180px]">{reg.tipoVisita}</span>
              </td>
              <!-- Descripción -->
              <td class="px-4 py-3.5 text-muted-foreground" title={reg.descripcion}>
                <span class="block truncate max-w-[260px]">{reg.descripcion || '—'}</span>
              </td>
              <!-- Colonizado -->
              <td class="px-4 py-3.5 text-right whitespace-nowrap">
                {#if reg.montoColonizado}
                  <span class="font-semibold text-foreground text-xs">₡{fmt(reg.montoColonizado, 0)}</span>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="13" class="px-4 py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl border border-border bg-muted flex items-center justify-center text-2xl">🔍</div>
                  <p class="text-sm font-semibold text-foreground">Sin resultados</p>
                  <p class="text-xs text-muted-foreground">
                    {hayFiltrosActivos ? 'Prueba ajustando los filtros.' : 'Aún no hay registros de facturación.'}
                  </p>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
      <p class="text-xs text-muted-foreground">
        {registrosProcesados.length} de {registros.length} {registros.length === 1 ? 'registro' : 'registros'}
      </p>
      {#if hayFiltrosActivos}
        <button onclick={limpiarFiltros} class="text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium">
          Limpiar filtros
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes filters-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes form-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>