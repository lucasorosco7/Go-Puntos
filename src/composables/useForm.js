/**
 * Manejo de formularios de GO Puntos.
 *
 * Reemplaza a forms.js de la maqueta con el mismo comportamiento:
 *   - valores reactivos (v-model en los BaseField);
 *   - validación con utils/validators.js al enviar y, si se pide, al salir
 *     de cada campo (onBlur);
 *   - el error de un campo se borra cuando la persona lo corrige;
 *   - el error de la API se muestra en su campo (details.field) o en una
 *     alerta arriba del formulario (alert);
 *   - al fallar, el foco va al primer campo con error (accesibilidad).
 *
 * Recibe: valores iniciales y un esquema { campo: [reglas] }.
 * Devuelve: { values, errors, alert, busy, validate, validateField,
 *             setErrors, apiError, reset, submit }.
 */
import { nextTick, reactive, ref, watch } from 'vue';
import { validators } from '../utils/validators.js';

export function useForm(initial = {}, schema = {}, { idPrefix = 'f' } = {}) {
  const values = reactive({ ...initial });
  const errors = reactive({});
  /** Alerta general del formulario: { tone, title, text } o null. */
  const alert = ref(null);
  /** true mientras se envía (para el estado de carga del botón). */
  const busy = ref(false);

  // Borra el error de un campo cuando cambia su valor
  watch(() => ({ ...values }), (now, before) => {
    Object.keys(now).forEach((k) => { if (now[k] !== before[k] && errors[k]) errors[k] = ''; });
  });

  function focusFirst() {
    const first = Object.keys(errors).find((k) => errors[k]);
    if (first) nextTick(() => document.getElementById(`${idPrefix}-${first}`)?.focus());
  }

  /** Reemplaza todos los errores (los que no vienen quedan limpios). */
  function setErrors(map) {
    Object.keys(errors).forEach((k) => { errors[k] = ''; });
    Object.assign(errors, map);
    focusFirst();
  }

  /** Valida todo el esquema. Devuelve true si no hay errores. */
  function validate(extraSchema = null) {
    const found = validators.validate(values, extraSchema || schema);
    setErrors(found);
    alert.value = null;
    return Object.keys(found).length === 0;
  }

  /** Valida un solo campo (al salir del campo, si ya tiene contenido). */
  function validateField(name) {
    if (!schema[name] || !values[name]) return;
    errors[name] = validators.validate(values, { [name]: schema[name] })[name] || '';
  }

  /** Muestra un error de la API en su campo o arriba del formulario. */
  function apiError(err, title = 'No pudimos guardar') {
    const field = err?.details?.field;
    if (field && field in values) setErrors({ [field]: err.message });
    else alert.value = { tone: 'error', title, text: err?.message || 'Ocurrió un error inesperado.' };
  }

  function reset(next = initial) {
    Object.keys(values).forEach((k) => delete values[k]);
    Object.assign(values, next);
    setErrors({});
    alert.value = null;
  }

  /**
   * Envío estándar: valida, ejecuta la acción con estado de carga y, si la
   * API responde con error, lo ubica en el formulario.
   * @param {Function} action async (values) => any
   * @param {object} [o] { title } título de la alerta de error
   */
  async function submit(action, { title } = {}) {
    if (!validate()) return undefined;
    busy.value = true;
    try {
      return await action({ ...values });
    } catch (err) {
      apiError(err, title);
      return undefined;
    } finally {
      busy.value = false;
    }
  }

  return { values, errors, alert, busy, validate, validateField, setErrors, apiError, reset, submit, idPrefix };
}
