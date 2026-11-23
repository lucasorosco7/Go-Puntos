/**
 * Guardias de navegación de GO Puntos.
 *
 * IMPORTANTE: son experiencia de usuario, no seguridad. La seguridad real
 * la hará la API validando el token y el rol de la persona en el negocio
 * (encabezado X-Business-Id) en cada pedido.
 *
 * Reglas (en este orden):
 *   1. guestOnly  → con sesión, va a la pantalla de inicio de su contexto
 *                   (salvo mientras se está cerrando la sesión).
 *   2. auth       → sin sesión, va al ingreso con ?next=<ruta pedida>.
 *   3. context    → la ruta es de otro contexto (cliente vs. panel): va a su inicio.
 *   4. roles      → su rol en ESTE negocio no alcanza (ej.: empleado en Dashboard): va a su inicio.
 * El rol siempre sale del contexto activo, nunca de la cuenta.
 */
import { useAuthStore } from '../stores/auth.js';
import { checkAccess } from './access.js';

export { checkAccess, safeNext } from './access.js';

export function installGuards(router) {
  router.beforeEach((to) => checkAccess(to, useAuthStore()));
}
