/**
 * Pruebas de la capa de services en modo simulado (useMocks = true).
 * Verifican la interfaz que usan las vistas: la misma que tendrá la API real.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

// El navegador guarda la sesión y los datos simulados: acá se reemplaza por memoria
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();

const { appConfig } = await import('../src/config/app.config.js');
appConfig.mockLatencyMs = 0;
const S = await import('../src/services/index.js');
const { session } = await import('../src/services/session.js');

async function loginAs(email, password, context) {
  const r = await S.authService.login({ email, password });
  const staff = r.access.staff[0];
  session.save({
    token: r.token, user: r.user, access: r.access, activeBusinessId: r.memberships[0]?.businessId || null,
    context: context === 'staff' ? { type: 'staff', businessId: staff.businessId, role: staff.role } : { type: 'cliente' },
  });
  return r;
}

test('el login devuelve identidad y accesos, sin rol global ni contraseña', async () => {
  const r = await S.authService.login({ email: 'caja@cvdietetica.com', password: 'caja1234' });
  assert.equal(r.user.password, undefined);
  assert.equal(r.user.role, undefined);
  assert.equal(r.access.staff[0].role, 'empleado');
  assert.ok(r.memberships.length >= 1, 'Lucas también es cliente de otro negocio');
});

test('credenciales incorrectas → ApiError 401', async () => {
  await assert.rejects(S.authService.login({ email: 'martina@demo.com', password: 'x' }), (e) => e instanceof S.ApiError && e.status === 401);
});

test('canjear baja el saldo pero no los puntos del mes', async () => {
  await loginAs('martina@demo.com', 'demo1234', 'cliente');
  const before = await S.customerService.getDashboard();
  const reward = before.rewards.find((r) => r.points <= before.membership.balance && (r.stock === null || r.stock > 0));
  const res = await S.rewardService.redeem(reward.id);
  assert.equal(res.membership.balance, before.membership.balance - reward.points);
  assert.equal(res.membership.periodPoints, before.membership.periodPoints);
  assert.match(res.redemption.code, /^[A-Z]+-/);
});

test('la caja cotiza y registra con el orden único del cálculo', async () => {
  await loginAs('admin@cvdietetica.com', 'admin1234', 'staff');
  const [row] = (await S.customerService.list()).rows;
  const quote = await S.pointsService.quote({ membershipId: row.membershipId, amount: 12500, offerIds: [] });
  assert.equal(quote.lines[0].kind, 'base');
  const res = await S.pointsService.registerPurchase({ membershipId: row.membershipId, amount: 12500, offerIds: [] });
  assert.equal(res.movement.points, quote.total);
  assert.equal(res.card.membership.periodPoints, row.periodPoints + quote.total);
});

test('el QR personal identifica al cliente sólo en su negocio', async () => {
  await loginAs('admin@cvdietetica.com', 'admin1234', 'staff');
  const [row] = (await S.customerService.list()).rows;
  const card = await S.qrService.identifyCustomer(S.qrService.customerPayload(row.code));
  assert.equal(card.membership.id, row.membershipId);
  await assert.rejects(S.qrService.identifyCustomer('GOPUNTOS:NO-EXISTE'), (e) => e.status === 404);
});

test('un empleado no puede acceder a métricas (403)', async () => {
  await loginAs('caja@cvdietetica.com', 'caja1234', 'staff');
  await assert.rejects(S.metricsService.getDashboard('mes'), (e) => e.status === 403);
});
