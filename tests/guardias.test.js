/**
 * Pruebas de las reglas de acceso a las rutas (src/router/access.js).
 * El rol depende del contexto activo: la misma cuenta puede ser cliente,
 * dueña de un negocio o empleada de otro.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAccess, safeNext } from '../src/router/access.js';

/** Imita los getters del store de autenticación para un contexto dado. */
function authFor(context) {
  return {
    isAuthenticated: Boolean(context), leaving: false,
    isClient: context?.type === 'cliente', isStaff: context?.type === 'staff', staffRole: context?.role || null,
    homeFor: () => (context?.type === 'staff' ? (context.role === 'empleado' ? 'caja' : 'dashboard') : context ? 'puntos' : 'landing'),
  };
}
const route = (meta, fullPath = '/x') => ({ meta, fullPath });
const DASHBOARD = route({ auth: true, context: 'staff', roles: ['owner', 'admin'] });
const CAJA = route({ auth: true, context: 'staff', roles: ['owner', 'admin', 'empleado'] });
const PUNTOS = route({ auth: true, context: 'cliente' });
const LOGIN = route({ guestOnly: true });

test('sin sesión: las privadas van al ingreso con next', () => {
  assert.deepEqual(checkAccess(route({ auth: true }, '/app/ranking'), authFor(null)), { name: 'login', query: { next: '/app/ranking' } });
});

test('con sesión: el ingreso redirige al inicio del contexto', () => {
  assert.equal(checkAccess(LOGIN, authFor({ type: 'cliente' })), 'puntos');
  assert.equal(checkAccess(LOGIN, { ...authFor({ type: 'cliente' }), leaving: true }), true);
});

test('dueño y administrador entran al dashboard; el empleado no', () => {
  assert.equal(checkAccess(DASHBOARD, authFor({ type: 'staff', role: 'owner' })), true);
  assert.equal(checkAccess(DASHBOARD, authFor({ type: 'staff', role: 'admin' })), true);
  assert.equal(checkAccess(DASHBOARD, authFor({ type: 'staff', role: 'empleado' })), 'caja');
  assert.equal(checkAccess(CAJA, authFor({ type: 'staff', role: 'empleado' })), true);
});

test('el contexto decide: la misma cuenta como cliente no entra al panel', () => {
  assert.equal(checkAccess(CAJA, authFor({ type: 'cliente' })), 'puntos');
  assert.equal(checkAccess(PUNTOS, authFor({ type: 'staff', role: 'owner' })), 'dashboard');
});

test('next sólo acepta rutas internas', () => {
  assert.equal(safeNext('/unirse/cafe-aroma'), '/unirse/cafe-aroma');
  assert.equal(safeNext('//malicioso.com'), null);
  assert.equal(safeNext('https://malicioso.com'), null);
});
