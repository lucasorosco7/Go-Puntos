/**
 * Reglas de acceso a las rutas (funciones puras, sin Vue).
 *
 * Están separadas de guards.js para poder probarlas con node --test.
 * Reciben la ruta destino y un objeto con los getters del store de
 * autenticación (isAuthenticated, isClient, isStaff, isPlatform, staffRole, leaving, homeFor).
 */

/** Decide si una ruta se puede abrir con la sesión actual. Devuelve true o la ruta alternativa. */
export function checkAccess(to, auth) {
  const meta = to.meta;
  if (meta.guestOnly && auth.isAuthenticated && !auth.leaving) return auth.homeFor();
  if (meta.auth && !auth.isAuthenticated) return { name: 'login', query: { next: to.fullPath } };
  if (meta.context === 'cliente' && !auth.isClient) return auth.homeFor();
  if (meta.context === 'staff' && !auth.isStaff) return auth.homeFor();
  // El panel de la plataforma es sólo del Superadmin (y ser Superadmin no abre los paneles de los negocios)
  if (meta.context === 'plataforma' && !auth.isPlatform) return auth.homeFor();
  if (meta.roles && !meta.roles.includes(auth.staffRole)) return auth.homeFor();
  return true;
}

/** Valida el parámetro ?next del ingreso: sólo rutas internas de la app. */
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

