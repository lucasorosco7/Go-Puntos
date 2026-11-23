/**
 * Avisos breves (toasts) de GO Puntos.
 *
 * Estado global y reactivo: cualquier vista o store puede llamar a
 * toast('Mensaje') y ToastHost.vue (montado una sola vez en App.vue) los
 * muestra en la región "aria-live" para lectores de pantalla.
 * Como el host vive fuera de las vistas, un aviso sobrevive al cambio de
 * ruta (reemplaza al "mensaje flash" de la maqueta HTML).
 */
import { reactive } from 'vue';

const toasts = reactive([]);
let seq = 0;

/** Quita un aviso por id. */
export function dismissToast(id) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i !== -1) toasts.splice(i, 1);
}

/**
 * Muestra un aviso.
 * @param {string} message  texto visible
 * @param {'success'|'error'} [tone='success']
 * @param {number} [duration=4000] milisegundos visibles
 */
export function toast(message, tone = 'success', duration = 4000) {
  const id = ++seq;
  toasts.push({ id, message, tone });
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function useToast() {
  return { toasts, toast, dismissToast };
}
