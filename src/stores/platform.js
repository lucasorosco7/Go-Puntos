/**
 * Store del panel de la plataforma (Superadmin).
 *
 * Guarda los indicadores globales para el menú lateral (cantidad de
 * solicitudes para revisar) y el dashboard. Las vistas llaman a refresh()
 * después de cada acción (aprobar, rechazar, suspender, invitar…) para que
 * los contadores se actualicen en todo el panel.
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { platformService } from '../services/platformService.js';

export const usePlatformStore = defineStore('platform', () => {
  /** Último dashboard cargado ({ kpis, byStatus, toReview, recent }). */
  const summary = ref(null);
  const error = ref(null);

  async function refresh() {
    try {
      summary.value = await platformService.getDashboard();
      error.value = null;
      return summary.value;
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  function clear() {
    summary.value = null;
    error.value = null;
  }

  return { summary, error, refresh, clear };
});
