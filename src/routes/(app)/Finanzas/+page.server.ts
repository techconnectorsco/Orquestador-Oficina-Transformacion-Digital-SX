import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { finanzasService } from '$lib/services/finanzas.service';
import { registroFacturacionSchema } from '$lib/features/finanzas/schemas';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, perfil } = locals;

  if (!user) {
    const form = await superValidate(zod(registroFacturacionSchema));
    return { noAutenticado: true, form, registros: [], esEncargado: false };
  }

  const esEncargado = perfil?.esAdmin ?? false;

  const registros = esEncargado
    ? await finanzasService.getAll()
    : await finanzasService.getByCreadoPor(user.id);

  const form = await superValidate(zod(registroFacturacionSchema));

  return { noAutenticado: false, user, perfil, esEncargado, registros, form };
};

export const actions: Actions = {
  crear: async ({ request, locals }) => {
    const { user, perfil } = locals;
    if (!user) return fail(401, { message: 'No autorizado' });

    const form = await superValidate(request, zod(registroFacturacionSchema));
    if (!form.valid) return fail(400, { form });

    // Calcular montoColonizado server-side para no depender del cliente
    const horas      = Number(form.data.horas);
    const tarifa     = Number(form.data.montoPorHora ?? 0);
    const tipoCambio = Number(form.data.tipoCambio ?? 525);
    const subtotal   = horas * tarifa;
    const conIVA     = subtotal * 1.13;
    const montoColonizado = form.data.moneda === 'Dólares'
      ? (conIVA * tipoCambio).toFixed(2)
      : conIVA.toFixed(2);

    // solicitadoPor se arma del usuario logueado
    const nombreCompleto = perfil?.nombreCompleto
      ?? `${user.firstName} ${user.lastName}`.trim();

    await finanzasService.create({
      creadoPor:       user.id,
      companiaFactura: form.data.companiaFactura,
      cliente:         form.data.cliente,
      tecnicos:        form.data.tecnicos,
      fechaTrabajo:    form.data.fechaTrabajo,
      fechaReportado:  form.data.fechaReportado,
      horas:           form.data.horas,
      moneda:          form.data.moneda,
      montoPorHora:    form.data.montoPorHora,
      tipoVisita:      form.data.tipoVisita,
      descripcion:     form.data.descripcion,
      pagoHorasExtra:  form.data.pagoHorasExtra,
      tipoCambio:      form.data.tipoCambio,
      montoColonizado,
    });

    return { form };
  },

  vincularFactura: async ({ request, locals }) => {
    const { perfil } = locals;
    if (!perfil?.esAdmin) return fail(403, { message: 'Sin permiso' });

    const data          = await request.formData();
    const id            = data.get('id') as string;
    const numeroFactura = data.get('numeroFactura') as string;
    if (!id || !numeroFactura) return fail(400, { message: 'Datos incompletos' });

    await finanzasService.vincularFactura(id, numeroFactura);
    return { success: true };
  }
};