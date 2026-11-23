/**
 * Pruebas del Superadmin (administración de la plataforma) en modo simulado.
 *
 * Recorren los services igual que las pantallas: invitaciones (válidas,
 * vencidas, utilizadas, revocadas), registro de un negocio con invitación,
 * envío a revisión, aprobación y rechazo, suspensión, bloqueo y reactivación,
 * auditoría y permisos. También las reglas puras de src/domain/platform.js.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

// El navegador guarda la sesión y los datos simulados: acá se reemplaza por memoria
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();

const { appConfig } = await import('../src/config/app.config.js');
appConfig.mockLatencyMs = 0;
const S = await import('../src/services/index.js');
const { session } = await import('../src/services/session.js');
const { platform, STATUS_ACTIONS } = await import('../src/domain/platform.js');
const { sha256Hex } = await import('../src/utils/hash.js');
const { checkAccess } = await import('../src/router/access.js');

/** Ingresa y deja la sesión en el contexto indicado ('plataforma', 'staff' o 'cliente'). */
async function loginAs(email, password, type) {
  const r = await S.authService.login({ email, password });
  const staff = r.access.staff[0];
  const context = type === 'plataforma' ? { type } : type === 'staff' ? { type, businessId: staff.businessId, role: staff.role } : { type: 'cliente' };
  session.save({ token: r.token, user: r.user, access: r.access, activeBusinessId: r.memberships[0]?.businessId || null, context });
  return r;
}
const asSuper = () => loginAs('superadmin@gopuntos.demo', 'super1234', 'plataforma');
const rejectsWith = (promise, status) => assert.rejects(promise, (e) => e instanceof S.ApiError && e.status === status);

/* ---------- Reglas puras ---------- */

test('dominio: "vencida" se calcula con la fecha y no es un estado guardado', () => {
  const now = new Date('2026-11-23T12:00:00Z');
  assert.equal(platform.invitationStatus({ status: 'pendiente', expiresAt: '2026-11-20T00:00:00Z' }, now), 'vencida');
  assert.equal(platform.invitationStatus({ status: 'pendiente', expiresAt: '2026-11-30T00:00:00Z' }, now), 'pendiente');
  assert.equal(platform.invitationStatus({ status: 'utilizada', expiresAt: '2026-11-20T00:00:00Z' }, now), 'utilizada');
  assert.equal(platform.requestPhase({ status: 'pendiente', submittedAt: null }), 'preparacion');
  assert.equal(platform.requestPhase({ status: 'pendiente', submittedAt: '2026-11-22' }), 'revision');
});

test('dominio: transiciones permitidas y motivo obligatorio', () => {
  assert.deepEqual(platform.actionsFor('activo'), ['suspender', 'bloquear']);
  assert.deepEqual(platform.actionsFor('suspendido'), ['bloquear', 'reactivar']);
  assert.deepEqual(platform.actionsFor('bloqueado'), ['reactivar']);
  assert.deepEqual(platform.actionsFor('pendiente'), []);
  assert.ok(STATUS_ACTIONS.suspender.reasonRequired && !STATUS_ACTIONS.reactivar.reasonRequired);
  assert.ok(platform.reasonError('corto'));
  assert.equal(platform.reasonError('Motivo suficientemente largo'), '');
});

test('el token se guarda como SHA-256 (igual que crypto de Node)', () => {
  for (const t of ['', 'invitacion-demo', 'ñandú 🎉']) assert.equal(sha256Hex(t), createHash('sha256').update(t).digest('hex'));
});

/* ---------- Rol y permisos ---------- */

test('el Superadmin tiene su propio contexto y no es personal de ningún negocio', async () => {
  const r = await asSuper();
  assert.equal(r.access.platform, true);
  assert.equal(r.access.staff.length, 0);
  assert.equal(r.user.password, undefined);
  const otro = await S.authService.login({ email: 'admin@cvdietetica.com', password: 'admin1234' });
  assert.equal(otro.access.platform, false);
});

test('sólo el Superadmin usa los endpoints de la plataforma (403 para el resto)', async () => {
  await loginAs('admin@cvdietetica.com', 'admin1234', 'staff');
  await rejectsWith(S.platformService.getDashboard(), 403);
  await rejectsWith(S.platformService.createInvitation({ days: 7 }), 403);
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  await rejectsWith(S.platformService.listBusinesses(), 403);
  // y el Superadmin no opera el panel de un negocio
  await asSuper();
  await rejectsWith(S.authService.switchContext({ type: 'staff', businessId: 1 }), 403);
});

test('rutas: el panel de la plataforma es sólo para el contexto plataforma', () => {
  const route = { meta: { auth: true, context: 'plataforma' }, fullPath: '/plataforma' };
  const auth = (ctx) => ({
    isAuthenticated: true, leaving: false, isClient: ctx === 'cliente', isStaff: ctx === 'staff', isPlatform: ctx === 'plataforma',
    staffRole: ctx === 'staff' ? 'owner' : null, homeFor: () => `inicio-${ctx}`,
  });
  assert.equal(checkAccess(route, auth('plataforma')), true);
  assert.equal(checkAccess(route, auth('staff')), 'inicio-staff');
  assert.equal(checkAccess(route, auth('cliente')), 'inicio-cliente');
  const panel = { meta: { auth: true, context: 'staff', roles: ['owner', 'admin'] }, fullPath: '/panel' };
  assert.equal(checkAccess(panel, auth('plataforma')), 'inicio-plataforma');
});

/* ---------- Invitaciones ---------- */

test('invitaciones de prueba: vigente, vencida, utilizada, revocada e inexistente', async () => {
  assert.equal((await S.platformService.validateInvitation('invitacion-demo')).valid, true);
  const cases = { 'invitacion-vencida': /venció/, 'demo-sofia': /ya se usó/, 'invitacion-revocada': /revocada/, 'no-existe': /no es válido/ };
  for (const [token, msg] of Object.entries(cases)) {
    const r = await S.platformService.validateInvitation(token);
    assert.equal(r.valid, false, token);
    assert.match(r.reason, msg);
  }
});

test('crear y revocar una invitación queda en la auditoría; no se revoca dos veces ni una usada', async () => {
  await asSuper();
  const before = (await S.platformService.listAudit()).length;
  const { invitation, token } = await S.platformService.createInvitation({ email: 'nuevo.local@demo.com', days: 7 });
  assert.equal(invitation.status, 'pendiente');
  assert.equal(invitation.tokenHash, undefined, 'el hash no viaja a la interfaz');
  assert.match(token, /^[0-9a-f]{48}$/);
  await S.platformService.revokeInvitation(invitation.id);
  await rejectsWith(S.platformService.revokeInvitation(invitation.id), 409);
  assert.equal((await S.platformService.validateInvitation(token)).valid, false);
  const used = (await S.platformService.listInvitations()).find((i) => i.status === 'utilizada');
  await rejectsWith(S.platformService.revokeInvitation(used.id), 409);
  const audit = await S.platformService.listAudit();
  assert.equal(audit.length, before + 2);
  assert.deepEqual(audit.slice(0, 2).map((a) => a.action), ['revocar_invitacion', 'crear_invitacion']);
});

/* ---------- Registro, revisión y aprobación ---------- */

test('recorrido completo: invitación → registro → envío → aprobación → el negocio opera', async () => {
  await asSuper();
  const { token } = await S.platformService.createInvitation({ email: 'verduleria@demo.com', days: 7 });
  session.clear();

  // Registro con la invitación: negocio pendiente, solicitud en preparación
  const reg = await S.authService.registerBusiness({
    invitationToken: token, businessName: 'Verdulería Central', category: 'almacen',
    firstName: 'Ana', lastName: 'Ríos', email: 'verduleria@demo.com', phone: '381 555-0800', password: 'demo1234',
  });
  session.save({ token: reg.token, user: reg.user, access: reg.access, context: { type: 'staff', businessId: reg.business.id, role: 'owner' } });
  let mine = await S.businessService.getMine();
  assert.equal(mine.business.status, 'pendiente');
  assert.equal(mine.platform.request.phase, 'preparacion');
  // La invitación ya no sirve
  assert.equal((await S.platformService.validateInvitation(token)).valid, false);
  await rejectsWith(S.authService.registerBusiness({ invitationToken: token, businessName: 'Otro', email: 'x@demo.com', password: 'demo1234' }), 410);

  // Sin recompensas no se puede enviar
  await rejectsWith(S.businessService.submitForReview(), 422);
  await S.rewardService.save({ name: 'Bolsa de frutas', points: 200, category: 'general', status: 'activa' });
  mine = await S.businessService.submitForReview();
  assert.equal(mine.platform.request.phase, 'revision');
  await rejectsWith(S.businessService.submitForReview(), 409);

  // Mientras está pendiente no opera: no puede sumar clientes
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  await rejectsWith(S.customerService.join(mine.business.slug), 409);

  // El Superadmin aprueba
  await asSuper();
  const req = (await S.platformService.listRequests()).find((r) => r.business.id === mine.business.id);
  const approved = await S.platformService.approveRequest(req.id, { reason: 'Todo en orden.' });
  assert.equal(approved.status, 'aprobada');
  assert.equal(approved.business.status, 'activo');
  assert.equal((await S.platformService.listAudit())[0].action, 'aprobar_negocio');
  await rejectsWith(S.platformService.approveRequest(req.id), 409);

  // Ya opera: Martina se suma
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  const joined = await S.customerService.join(mine.business.slug);
  assert.ok(joined);
});

test('rechazo con motivo obligatorio, reenvío y nueva revisión', async () => {
  await asSuper();
  const req = (await S.platformService.listRequests()).find((r) => r.phase === 'revision' && r.business.name === 'Panadería La Espiga');
  await rejectsWith(S.platformService.rejectRequest(req.id, { reason: '' }), 422);
  const rejected = await S.platformService.rejectRequest(req.id, { reason: 'Falta un teléfono de contacto del local.' });
  assert.equal(rejected.status, 'rechazada');
  assert.equal(rejected.business.status, 'rechazado');

  // El dueño ve el motivo y reenvía
  await loginAs('panaderia@demo.com', 'demo1234', 'staff');
  let mine = await S.businessService.getMine();
  assert.equal(mine.platform.request.phase, 'rechazada');
  assert.match(mine.platform.request.reason, /teléfono/);
  mine = await S.businessService.submitForReview();
  assert.equal(mine.business.status, 'pendiente');
  assert.equal(mine.platform.request.phase, 'revision');
});

/* ---------- Suspensión, bloqueo y reactivación ---------- */

test('suspender corta la operación; bloquear quita el panel; reactivar la devuelve (saldos intactos)', async () => {
  // Saldo de Martina en Café Aroma antes de los cambios
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  session.update({ activeBusinessId: 2 });
  const balance = (await S.customerService.getDashboard()).membership.balance;

  await asSuper();
  await rejectsWith(S.platformService.changeBusinessStatus(2, { action: 'suspender', reason: 'corto' }), 422);
  await rejectsWith(S.platformService.changeBusinessStatus(2, { action: 'reactivar' }), 409);
  const suspended = await S.platformService.changeBusinessStatus(2, { action: 'suspender', reason: 'Prueba de suspensión automática.' });
  assert.equal(suspended.status, 'suspendido');
  assert.match(suspended.statusReason.detail, /Prueba de suspensión/);

  // Suspendido: el panel abre, pero no registra compras
  await loginAs('admin@cafearoma.com', 'admin1234', 'staff');
  const [row] = (await S.customerService.list()).rows;
  await rejectsWith(S.pointsService.registerPurchase({ membershipId: row.membershipId, amount: 5000, offerIds: [] }), 409);

  // Bloqueado: el panel no está disponible (403 con código)
  await asSuper();
  await S.platformService.changeBusinessStatus(2, { action: 'bloquear', reason: 'Prueba de bloqueo automática.' });
  await loginAs('admin@cafearoma.com', 'admin1234', 'staff');
  await assert.rejects(S.businessService.getMine(), (e) => e.status === 403 && e.details?.code === 'BUSINESS_BLOCKED');

  // El cliente no puede canjear, pero conserva su saldo
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  session.update({ activeBusinessId: 2 });
  const d = await S.customerService.getDashboard();
  assert.equal(d.business.status, 'bloqueado');
  assert.equal(d.membership.balance, balance);
  const reward = d.rewards.find((r) => r.points <= balance);
  if (reward) await rejectsWith(S.rewardService.redeem(reward.id), 409);

  // Reactivar
  await asSuper();
  const back = await S.platformService.changeBusinessStatus(2, { action: 'reactivar' });
  assert.equal(back.status, 'activo');
  const actions = (await S.platformService.listAudit()).slice(0, 3).map((a) => a.action);
  assert.deepEqual(actions, ['reactivar_negocio', 'bloquear_negocio', 'suspender_negocio']);
});

test('dashboard global: los indicadores salen de los datos y cambian con las acciones', async () => {
  await asSuper();
  const before = (await S.platformService.getDashboard()).kpis;
  assert.equal(before.businesses, before.active + before.pending + before.suspended + before.blocked + before.rejected);
  await S.platformService.changeBusinessStatus(1, { action: 'suspender', reason: 'Prueba del dashboard global.' });
  const after = (await S.platformService.getDashboard()).kpis;
  assert.equal(after.active, before.active - 1);
  assert.equal(after.suspended, before.suspended + 1);
  await S.platformService.changeBusinessStatus(1, { action: 'reactivar' });
});

test('un rol por persona y negocio: un cliente no puede ser empleado del mismo negocio', async () => {
  await loginAs('admin@cvdietetica.com', 'admin1234', 'staff');
  await rejectsWith(S.businessService.createEmployee({ firstName: 'Martina', lastName: 'López', email: 'martina@demo.com' }), 409);
});
