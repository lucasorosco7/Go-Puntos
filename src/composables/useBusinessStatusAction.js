/**
 * Acciones de estado del Superadmin sobre un negocio: suspender, bloquear
 * o reactivar. Las comparten el listado de negocios y la ficha de un negocio.
 *
 * - Suspender y bloquear piden un MOTIVO (se muestra la hoja ReasonSheet).
 * - Reactivar pide sólo confirmación.
 * Después de cada acción se actualizan los contadores del panel (store
 * platform) y se llama a onDone para recargar la vista.
 *
 * Uso:
 *   const { pending, busy, serverError, start, submit, cancel } = useBusinessStatusAction(() => run());
 *   <ReasonSheet v-if="pending" ... @submit="submit" @close="cancel" />
 */
import { ref } from 'vue';
import { STATUS_ACTIONS } from '../domain/platform.js';
import { platformService } from '../services/platformService.js';
import { usePlatformStore } from '../stores/platform.js';
import { confirm } from './useConfirm.js';
import { toast } from './useToast.js';

const DONE = { suspender: 'suspendido', bloquear: 'bloqueado', reactivar: 'reactivado' };

export function useBusinessStatusAction(onDone = () => {}) {
  const platform = usePlatformStore();
  /** Acción con motivo en curso: { business, action, def } */
  const pending = ref(null);
  const busy = ref(false);
  const serverError = ref('');

  async function apply(business, action, reason = '') {
    await platformService.changeBusinessStatus(business.id, { action, reason });
    toast(`${business.name} fue ${DONE[action]}.`);
    platform.refresh().catch(() => {});
    await onDone();
  }

  /** Inicia la acción: reactivar confirma directo; suspender y bloquear abren la hoja de motivo. */
  async function start(business, action) {
    const def = STATUS_ACTIONS[action];
    if (!def.reasonRequired) {
      const ok = await confirm({ title: `¿${def.label} ${business.name}?`, body: def.help, confirmText: def.label });
      if (!ok) return;
      try { await apply(business, action); } catch (err) { toast(err.message, 'error'); }
      return;
    }
    serverError.value = '';
    pending.value = { business, action, def };
  }

  async function submit(reason) {
    const { business, action } = pending.value;
    busy.value = true;
    serverError.value = '';
    try {
      await apply(business, action, reason);
      pending.value = null;
    } catch (err) {
      serverError.value = err.message;
    } finally {
      busy.value = false;
    }
  }

  const cancel = () => { pending.value = null; };

  return { pending, busy, serverError, start, submit, cancel };
}
