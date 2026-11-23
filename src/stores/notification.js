/**
 * Store de notificaciones: contador de no leídas de la campana.
 *
 * El historial completo lo carga la vista de notificaciones con el
 * service; acá sólo vive el número que muestran la campana y el título.
 * Cuando existan las push reales, el service worker podrá avisar a este
 * store para refrescar el contador sin recargar.
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationService } from '../services/notificationService.js';

export const useNotificationStore = defineStore('notification', () => {
  const unread = ref(0);

  /** Vuelve a pedir el contador al servidor. */
  async function refresh() {
    try {
      const r = await notificationService.unreadCount();
      unread.value = r.count;
    } catch {
      unread.value = 0;
    }
    return unread.value;
  }

  function set(n) {
    unread.value = Math.max(0, Number(n) || 0);
  }

  function clear() {
    unread.value = 0;
  }

  return { unread, refresh, set, clear };
});
