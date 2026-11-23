/**
 * Handler simulado de métricas del dashboard.
 * Equivale a: GET /admin/metrics?range=hoy|semana|mes|historico
 *
 * En producción estos números los calculará el backend (consultas de
 * agregación sobre movimientos, canjes y membresías).
 */
import { segments as Segments } from '../../domain/segments.js';
import { addDays, dayKey, nextPeriod, periodOf, periodStart, startOfDay } from '../../utils/dates.js';
import { format } from '../../utils/format.js';
import { groupBy, sum } from '../../utils/helpers.js';
import { challenges as Challenges } from '../../domain/challenges.js';
import { offers as Offers } from '../../domain/offers.js';
import { admin } from './common.js';

export const RANGES = { hoy: 'Hoy', semana: 'Últimos 7 días', mes: 'Este mes', historico: 'Histórico' };

/** Desde y hasta de cada rango ("mes" = período actual del negocio). */
function rangeBounds(range, b, now) {
  if (range === 'hoy') return { from: startOfDay(now), to: now };
  if (range === 'semana') return { from: startOfDay(addDays(now, -6)), to: now };
  if (range === 'mes') return { from: periodStart(b.currentPeriod), to: now };
  return { from: new Date(b.createdAt), to: now };
}

/** Intervalos del gráfico: horas (hoy), días (semana/mes) o meses (histórico). */
function buckets(range, from, now) {
  const list = [];
  if (range === 'hoy') {
    for (let h = 8; h <= 21; h++) list.push({ key: h, label: `${h} h`, test: (d) => dayKey(d) === dayKey(now) && d.getHours() === h });
  } else if (range === 'semana' || range === 'mes') {
    for (let d = startOfDay(from); d <= now; d = addDays(d, 1)) {
      const k = dayKey(d);
      const label = range === 'semana' ? new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d).replace('.', '') : String(d.getDate());
      list.push({ key: k, label, test: (x) => dayKey(x) === k });
    }
  } else {
    for (let p = periodOf(from); p <= periodOf(now); p = nextPeriod(p)) {
      list.push({ key: p, label: format.period(p).slice(0, 3), test: (x) => periodOf(x) === p });
    }
  }
  return list;
}

export const metricsApi = {
  dashboard: (range = 'mes') => (s, S, ctx) => {
    const now = new Date();
    const { business: b } = admin(s, S, ctx);
    const { from, to } = rangeBounds(range, b, now);
    const inRange = (d) => { const t = new Date(d); return t >= from && t <= to; };
    const all = s.movements.filter((x) => x.businessId === b.id);
    const mv = all.filter((x) => inRange(x.date));
    const purchases = mv.filter((x) => x.type === 'compra');
    const members = s.memberships.filter((m) => m.businessId === b.id);
    const buyers = new Set(purchases.map((x) => x.membershipId));
    // Regresaron: ya habían comprado antes del rango, o compraron 2+ veces dentro de él
    const returning = [...buyers].filter((id) => all.some((x) => x.membershipId === id && x.type === 'compra' && new Date(x.date) < from)
      || purchases.filter((x) => x.membershipId === id).length >= 2).length;
    const pointsIssued = sum(mv.filter((x) => x.points > 0), (x) => x.points);
    const pointsRedeemed = sum(mv.filter((x) => x.type === 'canje'), (x) => -x.points);
    const redemptions = s.redemptions.filter((r) => r.businessId === b.id && r.source === 'canje' && inRange(r.createdAt));
    const revenue = sum(purchases, (x) => x.amount || 0);

    const levelList = S.levelsOf(s, b.id);
    const byLevel = levelList.map((l) => ({ level: l, count: 0 }));
    members.forEach((m) => { const row = byLevel.find((x) => x.level.id === S.levelStatus(s, m).level.id); if (row) row.count++; });
    const topLevel = [...byLevel].sort((a, c) => c.count - a.count)[0];

    const series = buckets(range, from, now).map((bk) => {
      const items = mv.filter((x) => bk.test(new Date(x.date)));
      const buys = items.filter((x) => x.type === 'compra');
      return {
        label: bk.label, key: bk.key, purchases: buys.length, revenue: sum(buys, (x) => x.amount || 0),
        pointsIssued: sum(items.filter((x) => x.points > 0), (x) => x.points),
        pointsRedeemed: sum(items.filter((x) => x.type === 'canje'), (x) => -x.points),
      };
    });

    const segmentsCount = Object.fromEntries(Object.keys(Segments.SEGMENTS).map((k) => [k, 0]));
    members.forEach((m) => S.insights(s, m, now).segments.forEach((k) => { segmentsCount[k]++; }));
    const names = Object.fromEntries(s.users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    return {
      business: b, levels: levelList, range, rangeLabel: RANGES[range], from: from.toISOString(), to: to.toISOString(),
      kpis: {
        activeCustomers: buyers.size,
        newCustomers: members.filter((m) => inRange(m.joinedAt)).length,
        purchases: purchases.length,
        revenue,
        avgTicket: purchases.length ? Math.round(revenue / purchases.length) : 0,
        pointsIssued,
        pointsRedeemed,
        redemptions: redemptions.length,
        redemptionRate: pointsIssued ? pointsRedeemed / pointsIssued : 0,
        returning,
        returningRate: buyers.size ? returning / buyers.size : 0,
        challengesCompleted: s.challengeCompletions.filter((c) => c.businessId === b.id && inRange(c.completedAt)).length,
        totalCustomers: members.length,
      },
      series,
      byLevel,
      topLevel: topLevel?.count ? topLevel.level : null,
      topRewards: Object.entries(groupBy(redemptions, (r) => r.rewardName)).map(([name, list]) => ({ name, count: list.length }))
        .sort((a, c) => c.count - a.count).slice(0, 5),
      segments: segmentsCount,
      ranking: S.rankingOf(s, b.id).slice(0, 5),
      rankingEnabled: b.ranking.enabled,
      pendingRedemptions: s.redemptions.filter((r) => r.businessId === b.id && r.status === 'pendiente').length,
      liveChallenges: s.challenges.filter((c) => c.businessId === b.id && Challenges.isLive(c, now)).length,
      recent: s.movements.filter((x) => x.businessId === b.id).sort((a, c) => new Date(c.date) - new Date(a.date) || c.id - a.id).slice(0, 6)
        .map((x) => ({ ...x, customer: names[x.userId] })),
      counts: {
        rewards: s.rewards.filter((r) => r.businessId === b.id && r.status === 'activa').length,
        offers: s.offers.filter((o) => o.businessId === b.id && Offers.isLive(o, now)).length,
      },
    };
  },
};
