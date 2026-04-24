<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { registroFacturacionSchema } from '$lib/features/finanzas/schemas';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { RegistroFacturacionSchema } from '$lib/features/finanzas/schemas';
  import { toast } from 'svelte-sonner';

  const IVA = 0.13;
  const TIPO_CAMBIO_DEFAULT = 525;

  const COMPANIAS = [
    'Hardware y Network S.A.',
    'Corporación Latinoamericana de Tecnología T.I. S.A.',
    'Soportexperto.com S.A.'
  ];

  type RegistroDetalle = {
    id:              string;
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
    onclose,
    form: initialForm,
    solicitadoPor = '',
    modoDetalle   = false,
    registro      = null,
  }: {
    onclose:       () => void;
    form:          SuperValidated<RegistroFacturacionSchema>;
    solicitadoPor: string;
    modoDetalle:   boolean;
    registro:      RegistroDetalle | null;
  } = $props();

  const { form, enhance, submitting, errors } = superForm(initialForm, {
    validators: zod(registroFacturacionSchema),
    onResult({ result }) {
      if (result.type === 'success') {
        toast.success('Registro guardado correctamente');
        onclose();
      }
    }
  });

  // En modo detalle los cálculos usan los datos del registro
  let horas      = $derived(modoDetalle ? (registro?.horas ?? 0)        : (Number($form.horas) || 0));
  let tarifa     = $derived(modoDetalle ? (registro?.montoPorHora ?? 0) : (Number($form.montoPorHora) || 0));
  let tipoCambio = $derived(modoDetalle ? (registro?.tipoCambio ?? TIPO_CAMBIO_DEFAULT) : (Number($form.tipoCambio) || TIPO_CAMBIO_DEFAULT));
  let monedaActual = $derived(modoDetalle ? (registro?.moneda ?? 'Colones') : $form.moneda);

  let subtotalColones    = $derived(monedaActual === 'Colones' ? horas * tarifa : 0);
  let subtotalColonesIVA = $derived(subtotalColones * (1 + IVA));
  let subtotalDolares    = $derived(monedaActual === 'Dólares' ? horas * tarifa : 0);
  let subtotalDolaresIVA = $derived(subtotalDolares * (1 + IVA));
  let montoColonizado    = $derived(
    monedaActual === 'Dólares' ? subtotalDolaresIVA * tipoCambio : subtotalColonesIVA
  );
  let hayMontos = $derived(horas > 0 && tarifa > 0);

  let cargandoTC = $state(false);
  let mensajeTC  = $state('');

  async function actualizarTipoCambio() {
    cargandoTC = true;
    mensajeTC  = '';
    await new Promise(r => setTimeout(r, 700));
    mensajeTC  = 'API no conectada aún — ingresa el valor manualmente.';
    cargandoTC = false;
  }

  function fmt(n: number, dec = 2) {
    return n.toLocaleString('es-CR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  // Clases compartidas para inputs
  const inputBase = `w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background
    border border-zinc-300 dark:border-zinc-600
    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`;
  const inputReadonly = `w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-muted/50
    border border-zinc-300 dark:border-zinc-600 cursor-not-allowed opacity-70`;
</script>

<form method="POST" action="?/crear" use:enhance>
<div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

  <!-- Header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-border">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </div>
      <div>
        <h2 class="text-sm font-bold text-foreground">
          {modoDetalle ? 'Detalle del Registro' : 'Nuevo Registro de Facturación'}
        </h2>
        <p class="text-xs text-muted-foreground">
          {modoDetalle ? 'Vista de solo lectura' : 'Completa los datos del servicio prestado'}
        </p>
      </div>
    </div>
    <button type="button" onclick={onclose}
      class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
             hover:bg-muted hover:text-foreground transition-colors">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <!-- Campos -->
  <div class="p-6 space-y-5">

    <!-- No. Factura QuickBooks — siempre visible -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-foreground flex items-center gap-2">
        No. Factura QuickBooks
        <span class="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Se asignará automáticamente
        </span>
      </label>
      <input type="text"
        value={modoDetalle ? (registro?.numeroFactura ?? '') : ''}
        readonly
        placeholder="Pendiente — se asignará desde QuickBooks"
        class={inputReadonly}/>
      {#if !modoDetalle}
        <p class="text-[11px] text-muted-foreground">
          El número se vinculará automáticamente cuando la factura sea emitida en QuickBooks.
        </p>
      {/if}
    </div>

    <!-- Solicitado por -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-foreground">Solicitado por</label>
      <input type="text"
        value={modoDetalle ? registro?.solicitadoPor : solicitadoPor}
        readonly
        class={inputReadonly}/>
      {#if !modoDetalle}
        <p class="text-[11px] text-muted-foreground">Se toma de tu cuenta automáticamente</p>
      {/if}
    </div>

    <!-- Fila 1: Compañía / Cliente -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Compañía en la que se factura</label>
        {#if modoDetalle}
          <input type="text" value={registro?.companiaFactura ?? ''} readonly class={inputReadonly}/>
        {:else}
          <select name="companiaFactura" bind:value={$form.companiaFactura}
            class="{inputBase} {$errors.companiaFactura ? 'border-red-500' : ''}">
            <option value="">Seleccionar compañía...</option>
            {#each COMPANIAS as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
          {#if $errors.companiaFactura}
            <p class="text-[11px] text-red-500">{$errors.companiaFactura}</p>
          {/if}
        {/if}
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Cliente</label>
        {#if modoDetalle}
          <input type="text" value={registro?.cliente ?? ''} readonly class={inputReadonly}/>
        {:else}
          <input type="text" name="cliente" bind:value={$form.cliente}
            placeholder="Nombre del cliente"
            class="{inputBase} {$errors.cliente ? 'border-red-500' : ''}"/>
          {#if $errors.cliente}
            <p class="text-[11px] text-red-500">{$errors.cliente}</p>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Fila 2: Técnicos / Tipo de Visita -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Técnicos</label>
        {#if modoDetalle}
          <input type="text" value={registro?.tecnicos ?? ''} readonly class={inputReadonly}/>
        {:else}
          <input type="text" name="tecnicos" bind:value={$form.tecnicos}
            placeholder="Técnico(s) asignado(s)"
            class="{inputBase} {$errors.tecnicos ? 'border-red-500' : ''}"/>
          {#if $errors.tecnicos}
            <p class="text-[11px] text-red-500">{$errors.tecnicos}</p>
          {/if}
        {/if}
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Tipo de Visita</label>
        {#if modoDetalle}
          <input type="text" value={registro?.tipoVisita ?? ''} readonly class={inputReadonly}/>
        {:else}
          <input type="text" name="tipoVisita" bind:value={$form.tipoVisita}
            placeholder="Ej: Visita Cliente sin Contrato"
            class="{inputBase} {$errors.tipoVisita ? 'border-red-500' : ''}"/>
          {#if $errors.tipoVisita}
            <p class="text-[11px] text-red-500">{$errors.tipoVisita}</p>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Fila 3: Fechas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Fecha del Trabajo</label>
        {#if modoDetalle}
          <input type="text" value={registro?.fechaTrabajo || '—'} readonly class={inputReadonly}/>
        {:else}
          <input type="date" name="fechaTrabajo" bind:value={$form.fechaTrabajo} class={inputBase}/>
        {/if}
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Fecha de Reportado</label>
        {#if modoDetalle}
          <input type="text" value={registro?.fechaReportado || '—'} readonly class={inputReadonly}/>
        {:else}
          <input type="date" name="fechaReportado" bind:value={$form.fechaReportado} class={inputBase}/>
        {/if}
      </div>
    </div>

    <!-- Fila 4: Moneda / Horas / Monto por hora -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Moneda</label>
        {#if modoDetalle}
          <input type="text" value={registro?.moneda ?? ''} readonly class={inputReadonly}/>
        {:else}
          <select name="moneda" bind:value={$form.moneda} class={inputBase}>
            <option value="Colones">Colones (₡)</option>
            <option value="Dólares">Dólares ($)</option>
          </select>
        {/if}
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Horas Trabajadas</label>
        {#if modoDetalle}
          <input type="text" value={registro?.horas ?? ''} readonly class={inputReadonly}/>
        {:else}
          <input type="number" name="horas" bind:value={$form.horas}
            min="0.25" step="0.25"
            class="{inputBase} {$errors.horas ? 'border-red-500' : ''}"/>
          {#if $errors.horas}
            <p class="text-[11px] text-red-500">{$errors.horas}</p>
          {/if}
        {/if}
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">
          Monto por Hora
          <span class="ml-1 font-normal text-muted-foreground">
            ({modoDetalle ? registro?.moneda === 'Dólares' ? 'USD' : 'CRC' : $form.moneda === 'Dólares' ? 'USD' : 'CRC'})
          </span>
        </label>
        {#if modoDetalle}
          <input type="text"
            value={registro?.montoPorHora != null
              ? registro.moneda === 'Dólares'
                ? `$${fmt(registro.montoPorHora)}`
                : `₡${fmt(registro.montoPorHora, 0)}`
              : '—'}
            readonly class={inputReadonly}/>
        {:else}
          <input type="number" name="montoPorHora" bind:value={$form.montoPorHora}
            min="0" step="0.01" placeholder="0.00" class={inputBase}/>
        {/if}
      </div>
    </div>

    <!-- Fila 5: Pago horas extra / Tipo de cambio -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Pago Horas Extra</label>
        {#if modoDetalle}
          <input type="text"
            value={registro?.pagoHorasExtra != null ? fmt(registro.pagoHorasExtra) : '—'}
            readonly class={inputReadonly}/>
        {:else}
          <input type="number" name="pagoHorasExtra" bind:value={$form.pagoHorasExtra}
            min="0" step="0.01" placeholder="0.00" class={inputBase}/>
        {/if}
      </div>
      <div class="space-y-1.5 sm:col-span-2">
        <label class="text-xs font-semibold text-foreground">
          Tipo de Cambio
          <span class="ml-1 font-normal text-muted-foreground">(₡ por $1 USD)</span>
        </label>
        {#if modoDetalle}
          <input type="text" value={`₡${registro?.tipoCambio ?? TIPO_CAMBIO_DEFAULT}`} readonly class={inputReadonly}/>
        {:else}
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₡</span>
              <input type="number" name="tipoCambio" bind:value={$form.tipoCambio}
                min="1" step="1"
                class="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm text-foreground bg-background
                       border border-zinc-300 dark:border-zinc-600
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"/>
            </div>
            <button type="button" onclick={actualizarTipoCambio} disabled={cargandoTC}
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap
                     border border-border text-muted-foreground hover:bg-muted hover:text-foreground
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {#if cargandoTC}
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Actualizando...
              {:else}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
                Actualizar
              {/if}
            </button>
          </div>
          {#if mensajeTC}
            <p class="text-[11px] text-amber-600 dark:text-amber-400">{mensajeTC}</p>
          {:else}
            <p class="text-[11px] text-muted-foreground">
              Consulta el valor oficial en
              <a href="https://www.bccr.fi.cr" target="_blank" rel="noopener"
                 class="text-blue-500 hover:text-blue-400 underline underline-offset-2">bccr.fi.cr</a>
            </p>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Descripción -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-foreground">Descripción de la Línea para la Factura</label>
      {#if modoDetalle}
        <textarea rows={3} readonly class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-muted/50
               border border-zinc-300 dark:border-zinc-600 cursor-not-allowed opacity-70 resize-none">
          {registro?.descripcion || '—'}
        </textarea>
      {:else}
        <textarea name="descripcion" bind:value={$form.descripcion} rows={3}
          placeholder="Describe el servicio prestado para incluir en la factura..."
          class="w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-background resize-none
                 border border-zinc-300 dark:border-zinc-600
                 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        ></textarea>
      {/if}
    </div>

    <!-- Panel de cálculo -->
    {#if hayMontos}
      <div class="rounded-xl border border-border bg-muted/40 overflow-hidden">
        <div class="px-4 py-2.5 border-b border-border bg-muted/60">
          <p class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Cálculo automático — IVA 13%
          </p>
        </div>
        <div class="divide-y divide-border">
          {#if monedaActual === 'Colones'}
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs text-muted-foreground">Monto Factura Colones</span>
              <span class="text-xs font-semibold text-foreground">₡{fmt(subtotalColones)}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs text-muted-foreground">Colones + IVA (13%)</span>
              <span class="text-xs font-semibold text-foreground">₡{fmt(subtotalColonesIVA)}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5 bg-emerald-500/5">
              <span class="text-xs font-bold text-foreground">Monto Colonizado</span>
              <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400">₡{fmt(montoColonizado)}</span>
            </div>
          {:else}
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs text-muted-foreground">Monto Factura Dólares</span>
              <span class="text-xs font-semibold text-foreground">${fmt(subtotalDolares)}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs text-muted-foreground">Dólares + IVA (13%)</span>
              <span class="text-xs font-semibold text-foreground">${fmt(subtotalDolaresIVA)}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-xs text-muted-foreground">
                Colonizado
                <span class="text-muted-foreground/60 ml-1">(${fmt(subtotalDolaresIVA)} × ₡{tipoCambio})</span>
              </span>
              <span class="text-xs font-semibold text-foreground">₡{fmt(montoColonizado)}</span>
            </div>
            <div class="flex items-center justify-between px-4 py-2.5 bg-emerald-500/5">
              <span class="text-xs font-bold text-foreground">Total final colonizado</span>
              <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400">₡{fmt(montoColonizado)}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
    {#if modoDetalle}
      <button type="button" onclick={onclose}
        class="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border
               text-muted-foreground hover:bg-muted transition-colors">
        Cerrar
      </button>
    {:else}
      <button type="button" onclick={onclose}
        class="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border
               text-muted-foreground hover:bg-muted transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={$submitting}
        class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
               bg-blue-600 hover:bg-blue-500 text-white
               shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5
               disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
        {#if $submitting}
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Guardando...
        {:else}
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          Guardar Registro
        {/if}
      </button>
    {/if}
  </div>

</div>
</form>