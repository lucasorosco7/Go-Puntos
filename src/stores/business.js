/**
 * Store del negocio del panel (contexto staff).
 *
 * Guarda el negocio que se está administrando para que el layout del
 * panel muestre su nombre, logo y estado (pendiente, activo, rechazado,
 * suspendido o bloqueado), el estado de su solicitud de alta y aplique su
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
  /** Estado frente a la plataforma: solicitud de alta, motivos y requisitos para enviarla. */
  const platform = ref(null);
  const error = ref(null);

  /** Carga el negocio del contexto activo y aplica su paleta. */
  async function load() {
    try {
      const r = await businessService.getMine();
      business.value = r.business;
      levels.value = r.levels;
      counts.value = r.counts;
      platform.value = r.platform || null;
      error.value = null;
      applyBusinessTheme(r.business);
      return r;
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  /** Actualiza negocio y estado de plataforma con una respuesta completa ({ business, platform, … }). */
  function setFull(r) {
    if (r.platform) platform.value = r.platform;
    if (r.counts) counts.value = r.counts;
    setBusiness(r.business);
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
    platform.value = null;
    error.value = null;
  }

  return { business, levels, counts, platform, error, load, setBusiness, setFull, clear };
});
