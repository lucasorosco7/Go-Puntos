/**
 * Persistencia de la sesión.
 *
 * Es el ÚNICO lugar de la app que guarda la sesión en el navegador:
 *   "Recordar sesión" → localStorage (sobrevive al cerrar el navegador)
 *   Sin recordar      → sessionStorage (se borra al cerrar la pestaña)
 *
 * Qué se guarda:
 *   token            credencial que se envía a la API en cada pedido
 *   user             identidad de la cuenta (nombre, email, teléfono). SIN rol.
 *   context          contexto activo de la sesión: con qué "rol" está navegando
 *                    { type: 'cliente' }  o  { type: 'staff', businessId, role: 'owner'|'admin'|'empleado' }
 *                    o  { type: 'plataforma' } (Superadmin)
 *   access           a qué puede acceder la cuenta: paneles de negocios, cantidad de membresías y si es Superadmin
 *   activeBusinessId negocio que el cliente está mirando en la app
 *
 * Los componentes no usan este módulo: lo usan el store de autenticación
 * (para la interfaz) y los services (para mandar token y negocio a la API).
 */

const KEY = 'gopuntos:sesion';

function read() {
  try {
    const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const session = {
  get: read,

  /** Guarda una sesión nueva. remember = true la conserva al cerrar el navegador. */
  save(data, remember = true) {
    this.clear();
    try { (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(data)); } catch { /* sin almacenamiento */ }
  },

  /** Actualiza parte de la sesión en el mismo almacenamiento donde estaba. */
  update(partial) {
    const current = read();
    if (!current) return;
    try {
      const store = localStorage.getItem(KEY) ? localStorage : sessionStorage;
      store.setItem(KEY, JSON.stringify({ ...current, ...partial }));
    } catch { /* sin almacenamiento */ }
  },

  clear() {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch { /* nada */ }
  },

  token: () => read()?.token || null,

  /**
   * Negocio sobre el que se opera (lo que la API recibe como X-Business-Id):
   * en contexto cliente, el negocio que está mirando; en contexto staff, el negocio de su panel.
   */
  businessId() {
    const s = read();
    if (!s) return null;
    return s.context?.type === 'staff' ? s.context.businessId : s.activeBusinessId || null;
  },
};
