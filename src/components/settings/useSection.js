/**
 * Ayuda común de las secciones de configuración del negocio.
 *
 * Cada sección expone save() para que la usen tanto el asistente de
 * configuración inicial como la pantalla Configuración. save() valida,
 * llama al service y, si algo falla, muestra el error en la propia sección
 * y vuelve a lanzarlo marcado como "handled" (la pantalla sólo deja de
 * mostrar el estado de carga).
 */
import { useForm } from '../../composables/useForm.js';

export function useSection(initial, schema = {}, idPrefix = 'cfg') {
  const form = useForm(initial, schema, { idPrefix });

  /** Ejecuta el guardado con validación y manejo de errores. */
  async function run(action) {
    if (!form.validate()) {
      const e = new Error('Revisá los datos marcados.');
      e.handled = true;
      throw e;
    }
    try {
      return await action({ ...form.values });
    } catch (err) {
      form.apiError(err);
      err.handled = true;
      throw err;
    }
  }

  return { form, run };
}
