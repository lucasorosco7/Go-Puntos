/**
 * Confirmaciones de GO Puntos ("¿Eliminar esta recompensa?").
 *
 * confirm(opciones) devuelve una promesa con true / false. Hay un único
 * ConfirmHost.vue (en App.vue) que muestra la hoja; así cualquier vista
 * pide confirmación con una línea y sin repetir el diálogo.
 */
import { shallowRef } from 'vue';

/** Confirmación en curso (o null). */
const current = shallowRef(null);

/**
 * @param {object} o
 * @param {string} o.title
 * @param {string} [o.description]
 * @param {string} [o.body]         texto adicional
 * @param {string[]} [o.items]     lista numerada (admite **negrita**)
 * @param {string} [o.confirmText='Confirmar']
 * @param {string} [o.cancelText='Cancelar']
 * @param {''|'danger'} [o.tone]  'danger' pinta el botón de rojo
 * @returns {Promise<boolean>}
 */
export function confirm(o) {
  // Si había otra abierta, se responde "no" antes de reemplazarla
  if (current.value) current.value.resolve(false);
  return new Promise((resolve) => {
    current.value = { confirmText: 'Confirmar', cancelText: 'Cancelar', tone: '', description: '', ...o, resolve };
  });
}

/** Responde la confirmación abierta (lo usa ConfirmHost). */
export function answerConfirm(value) {
  const c = current.value;
  current.value = null;
  if (c) c.resolve(value);
}

export function useConfirm() {
  return { current, confirm, answerConfirm };
}
