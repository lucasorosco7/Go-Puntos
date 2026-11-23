/**
 * Carga de datos con estados de "cargando" y "error".
 *
 * Uso típico en una vista:
 *   const { data, loading, error, run } = useAsync(() => customerService.getDashboard());
 *   onMounted(run);
 *
 * Las vistas muestran un esqueleto mientras loading = true y una alerta con
 * "Reintentar" si error tiene valor. Llamar a run() de nuevo vuelve a cargar.
 */
import { ref, shallowRef } from 'vue';

export function useAsync(loader, { immediate = false, keepData = true } = {}) {
  const data = shallowRef(null);
  const error = ref(null);
  const loading = ref(false);
  let ticket = 0;

  /** Ejecuta la carga. Si hay dos cargas seguidas, sólo vale la última. */
  async function run(...args) {
    const mine = ++ticket;
    loading.value = true;
    error.value = null;
    if (!keepData) data.value = null;
    try {
      const result = await loader(...args);
      if (mine === ticket) data.value = result;
      return result;
    } catch (err) {
      if (mine === ticket) error.value = err;
      return undefined;
    } finally {
      if (mine === ticket) loading.value = false;
    }
  }

  if (immediate) run();
  return { data, error, loading, run };
}
