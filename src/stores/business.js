/**
 * Store del negocio del panel (contexto staff).
 *
 * Guarda el negocio que se está administrando para que el layout del
 * panel muestre su nombre, logo, estado (borrador / activo) y aplique su
 * paleta. Las vistas que editan la configuración llaman a setBusiness()
 * con la respuesta del servicio para que todo se actualice en vivo.
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { businessService } from '../services/businessService.js';
import { applyBusinessTheme } from '../theme/theme.js';

export const useBusinessStore = defineStore('business', () => {
  /** Negocio del panel activo (o null mientras carga). */
  const business = ref(null);
  /** Niveles del negocio. */
  const levels = ref([]);
  /** Contadores para menús y avisos: clientes, recompensas, ofertas, desafíos, empleados. */
  const counts = ref({});
  const error = ref(null);

  /** Carga el negocio del contexto activo y aplica su paleta. */
  async function load() {
    try {
      const r = await businessService.getMine();
      business.value = r.business;
      levels.value = r.levels;
      counts.value = r.counts;
      error.value = null;
      applyBusinessTheme(r.business);
      return r;
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  /** Reemplaza el negocio con la versión guardada (y su paleta). */
  function setBusiness(b) {
    business.value = b;
    applyBusinessTheme(b);
  }

  /** Se llama al cerrar sesión o cambiar de contexto. */
  function clear() {
    business.value = null;
    levels.value = [];
    counts.value = {};
    error.value = null;
  }

  return { business, levels, counts, error, load, setBusiness, clear };
});
