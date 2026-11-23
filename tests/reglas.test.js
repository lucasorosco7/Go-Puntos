/**
 * Pruebas de las reglas de negocio de GO Puntos.
 *
 * Se ejecutan con:  npm test   (usa el runner nativo de Node, sin dependencias)
 *
 * Verifican las reglas definitivas sobre src/domain y sobre los datos de
 * prueba generados por el servidor simulado:
 * - orden único del cálculo de puntos y promociones incompatibles;
 * - sólo las compras suman a los puntos del período;
 * - el nivel de un mes se gana con los puntos del mes anterior;
 * - el cierre mensual no toca el saldo;
 * - los roles viven en el personal del negocio, no en el usuario.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { points } from '../src/domain/points.js';
import { levels } from '../src/domain/levels.js';
import { buildSeed } from '../src/mocks/seed.js';
import { server as S } from '../src/mocks/server.js';

const rule = { pesos: 100, points: 1, rounding: 'abajo', minPurchase: 0, applyLevelMultiplier: true };
const oro = { name: 'Oro', multiplier: 1.2 };
const dobles = { id: 1, type: 'puntos_dobles', value: 2, title: 'Puntos dobles', endDate: '2026-10-10' };
const triples = { id: 2, type: 'puntos_dobles', value: 3, title: 'Puntos triples', endDate: '2026-10-20' };
const extra = { id: 3, type: 'puntos_extra', value: 100, title: 'Combo' };

test('cálculo: $12.500 · $100 = 1 · Oro x1,2 · puntos dobles x2 = 300', () => {
  const r = points.calculate({ amount: 12500, rule, level: oro, offers: [dobles] });
  assert.equal(r.total, 300);
  assert.deepEqual(r.lines.map((l) => l.value), [125, 150, 300]);
});

test('promociones multiplicadoras no se acumulan: se aplica la mayor', () => {
  const r = points.calculate({ amount: 12500, rule, level: oro, offers: [dobles, triples] });
  assert.equal(r.total, 450);
  assert.equal(r.skipped.length, 1);
});

test('puntos extra se suman después del multiplicador', () => {
  assert.equal(points.calculate({ amount: 12500, rule, level: oro, offers: [dobles, extra] }).total, 400);
});

test('el redondeo se hace una sola vez, al final', () => {
  // 125,8 × 1,25 = 157,25 → 157 (redondeo hacia abajo)
  assert.equal(points.calculate({ amount: 12580, rule, level: { name: 'Plata', multiplier: 1.25 } }).total, 157);
});

test('una compra por debajo del mínimo no suma puntos', () => {
  const r = points.calculate({ amount: 800, rule: { ...rule, minPurchase: 1000 }, level: oro, offers: [dobles] });
  assert.equal(r.total, 0);
  assert.ok(r.belowMinimum);
});

test('sólo las compras cuentan para los puntos del período', () => {
  assert.ok(points.countsForPeriod('compra', 10));
  ['bonificacion', 'desafio', 'premio', 'ajuste', 'canje'].forEach((t) => assert.ok(!points.countsForPeriod(t, 10), t));
});

const state = buildSeed(new Date());

test('datos de prueba: ningún movimiento que no sea compra cuenta para el período', () => {
  assert.equal(state.movements.filter((m) => m.countsForPeriod && m.type !== 'compra').length, 0);
});

test('datos de prueba: puntos del mes = suma de las compras del mes', () => {
  const b = state.businesses[0];
  state.memberships.filter((m) => m.businessId === b.id).forEach((m) => {
    const total = state.movements.filter((x) => x.membershipId === m.id && x.period === b.currentPeriod && x.type === 'compra')
      .reduce((a, x) => a + x.points, 0);
    assert.equal(m.periodPoints, total);
  });
});

test('nivel vigente = nivel ganado con los puntos del mes anterior', () => {
  const list = S.levelsOf(state, 1);
  state.memberships.filter((m) => m.businessId === 1 && m.history.length).forEach((m) => {
    const last = m.history[m.history.length - 1];
    assert.equal(m.levelId, levels.forPoints(list, last.points).id);
    assert.equal(last.earnedLevelId, m.levelId);
  });
});

test('clientes sin mes cerrado arrancan en el nivel más bajo', () => {
  const list = S.levelsOf(state, 1);
  state.memberships.filter((m) => m.businessId === 1 && !m.history.length)
    .forEach((m) => assert.equal(m.levelId, levels.base(list).id));
});

test('ejemplo del enunciado: 4.300 → Oro el mes siguiente; 2.100 → Plata el otro', () => {
  const s = buildSeed(new Date());
  const m = s.memberships.find((x) => x.userId === 124 && x.businessId === 1);
  const before = m.balance;
  m.periodPoints = 4300;
  S.closePeriod(s, { businessId: 1, date: new Date() });
  assert.equal(S.levelStatus(s, m).level.name, 'Oro');
  assert.equal(m.periodPoints, 0, 'el cierre reinicia los puntos del mes');
  assert.ok(m.balance >= before, 'el cierre no toca el saldo');
  m.periodPoints = 2100;
  S.closePeriod(s, { businessId: 1, date: new Date() });
  assert.equal(S.levelStatus(s, m).level.name, 'Plata');
  // El premio del ranking va al saldo, no al mes nuevo
  const winner = s.memberships.find((x) => x.id === s.periodCloses.at(-1).winner.membershipId);
  assert.equal(winner.periodPoints, 0);
});

test('un ajuste manual cambia el saldo pero no los puntos del mes', () => {
  const s = buildSeed(new Date());
  const m = s.memberships.find((x) => x.userId === 124 && x.businessId === 1);
  const { balance, periodPoints } = m;
  S.adjustPoints(s, { membershipId: m.id, points: 200, reason: 'prueba', staffUserId: 1, date: new Date() });
  assert.equal(m.balance, balance + 200);
  assert.equal(m.periodPoints, periodPoints);
});

test('un canje baja el saldo pero no los puntos del mes', () => {
  const s = buildSeed(new Date());
  const m = s.memberships.find((x) => x.userId === 124 && x.businessId === 1);
  const reward = s.rewards.find((r) => r.businessId === 1 && r.points <= m.balance && r.status === 'activa' && (r.stock === null || r.stock > 0));
  const { balance, periodPoints } = m;
  S.redeem(s, { membershipId: m.id, rewardId: reward.id, date: new Date() });
  assert.equal(m.balance, balance - reward.points);
  assert.equal(m.periodPoints, periodPoints);
});

test('roles: las cuentas no tienen rol; el personal vive aparte', () => {
  assert.ok(state.users.every((u) => !('role' in u) && !('businessId' in u)));
  // Un dueño por negocio (6 negocios de prueba) + Lucas, empleado de CV Dietética
  assert.equal(state.businessStaff.filter((x) => x.role === 'owner').length, state.businesses.length);
  assert.equal(state.businessStaff.length, state.businesses.length + 1);
  // El Superadmin no es personal de ningún negocio
  const superadmin = state.platformAdmins[0].userId;
  assert.ok(!state.businessStaff.some((x) => x.userId === superadmin));
  // Lucas es empleado de CV Dietética y cliente de Café Aroma con la misma cuenta
  assert.equal(S.staffRow(state, 2, 1)?.role, 'empleado');
  assert.ok(S.membershipOf(state, 2, 2));
});
