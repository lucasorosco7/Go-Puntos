/**
 * Dominio · Rachas.
 *
 * Una racha semanal cuenta semanas consecutivas (lunes a domingo) con al
 * menos una compra en un negocio. La semana en curso todavía no rompe la
 * racha: si el cliente no compró esta semana, la racha queda "en riesgo"
 * (y se le puede avisar con una notificación).
 *
 * Las rachas se calculan siempre a partir de las fechas de compra; no hace
 * falta guardarlas (la futura base puede cachearlas si conviene).
 */
import { addDays, dayKey, periodOf, prevPeriod, weekStart } from '../utils/dates.js';
import { format } from '../utils/format.js';

/** Clave de la semana de una fecha: el lunes en formato "AAAA-MM-DD". */
export const weekKey = (date) => dayKey(weekStart(date));
const prevWeekKey = (key) => weekKey(addDays(new Date(`${key}T12:00:00`), -7));

/** Cuenta cuántas claves consecutivas hay hacia atrás desde startKey. */
function countBack(keys, startKey, prev) {
  let n = 0;
  let k = startKey;
  while (keys.has(k)) { n++; k = prev(k); }
  return n;
}

export const streaks = {
  weekKey,

  /**
   * Calcula la racha de un cliente.
   * Recibe las fechas de compra del cliente en ESTE negocio y la fecha actual.
   * Devuelve { weeks, activeThisWeek, atRisk, best, months, lastWeeks }:
   *   weeks: semanas seguidas actuales
   *   atRisk: tiene racha pero todavía no compró esta semana
   *   best: mejor racha histórica
   *   months: meses seguidos con al menos una compra
   *   lastWeeks: últimas 8 semanas (para el mini calendario del perfil)
   */
  compute(purchaseDates, now = new Date()) {
    const weeks = new Set(purchaseDates.map(weekKey));
    const thisWeek = weekKey(now);
    const activeThisWeek = weeks.has(thisWeek);
    const start = activeThisWeek ? thisWeek : prevWeekKey(thisWeek);
    const current = countBack(weeks, start, prevWeekKey);

    // Mejor racha histórica: se mide desde cada semana que cierra un tramo
    let best = 0;
    weeks.forEach((k) => {
      const following = weekKey(addDays(new Date(`${k}T12:00:00`), 7));
      if (!weeks.has(following)) best = Math.max(best, countBack(weeks, k, prevWeekKey));
    });

    // Meses consecutivos con compras
    const months = new Set(purchaseDates.map((d) => periodOf(d)));
    const thisMonth = periodOf(now);
    const monthStart = months.has(thisMonth) ? thisMonth : prevPeriod(thisMonth);
    const monthRun = countBack(months, monthStart, prevPeriod);

    const lastWeeks = [];
    let k = thisWeek;
    for (let i = 0; i < 8; i++) {
      lastWeeks.unshift({ key: k, active: weeks.has(k), current: k === thisWeek });
      k = prevWeekKey(k);
    }

    return {
      weeks: current,
      activeThisWeek,
      atRisk: !activeThisWeek && current >= 1,
      best: Math.max(best, current),
      months: monthRun,
      lastWeeks,
    };
  },

  /** Texto corto para avisos: "Racha de 3 semanas". */
  label(streak) {
    if (!streak || streak.weeks < 1) return 'Sin racha activa';
    return `Racha de ${format.plural(streak.weeks, 'semana', 'semanas')}`;
  },
};
