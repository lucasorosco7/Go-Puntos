/**
 * Validadores de formularios.
 *
 * Cada validador recibe el valor del campo (y todos los valores del
 * formulario) y devuelve un mensaje de error en español, o "" si está bien.
 * Se combinan en un esquema { campo: [reglas] } que evalúa validate().
 *
 * Importante: esta validación es para la experiencia de usuario.
 * La API debe volver a validar todo del lado del servidor.
 */

export const validators = {
  /** Campo obligatorio con mensaje completo (formularios del negocio). */
  filled: (message) => (v) => (String(v ?? '').trim() ? '' : message),

  /** Campo obligatorio de datos personales: "Ingresá tu email." */
  required: (label) => (v) => (String(v ?? '').trim() ? '' : `Ingresá tu ${label}.`),

  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim()) ? '' : 'Revisá el email: debería verse como nombre@dominio.com.'),

  phone: (v) => (String(v ?? '').replace(/\D/g, '').length >= 10 ? '' : 'Ingresá el teléfono con código de área (10 dígitos).'),

  password(v) {
    const value = String(v ?? '');
    if (value.length < 8) return 'La contraseña necesita al menos 8 caracteres.';
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Combiná letras y números.';
    return '';
  },

  /** Repetición de contraseña: compara con el campo "password" del mismo formulario. */
  matches: (field = 'password', message = 'Las contraseñas no coinciden.') => (v, all) => (v === all[field] ? '' : message),

  positive: (label) => (v) => (Number(v) > 0 ? '' : `Ingresá ${label} mayor a cero.`),

  /**
   * Evalúa un esquema { campo: [reglas] } y devuelve { campo: primerError }.
   * Un objeto vacío significa que el formulario es válido.
   */
  validate(values, schema) {
    const errors = {};
    Object.entries(schema).forEach(([field, rules]) => {
      for (const rule of rules) {
        const msg = rule(values[field], values);
        if (msg) { errors[field] = msg; break; }
      }
    });
    return errors;
  },
};
