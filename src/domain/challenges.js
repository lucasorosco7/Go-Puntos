/**
 * Dominio · Desafíos.
 *
 * El PROGRESO de un desafío no se guarda: se calcula con los movimientos
 * del cliente dentro de la vigencia del desafío. Lo único que se guarda es
 * cuándo lo completó, para premiarlo una sola vez.
 *
 * El premio en puntos de un desafío suma sólo al SALDO disponible: no cuenta
 * para el nivel ni el ranking (ver domain/points.js).
 */
import { addDays, dayKey } from '../utils/dates.js';
import { format } from '../utils/format.js';
import { sum } from '../utils/helpers.js';
import { weekKey } from './streaks.js';

/** Tipos de desafío disponibles, con su unidad y un ejemplo para el formulario. */
export const CHALLENGE_TYPES = {
  compras: { label: 'Cantidad de compras', icon: 'shopping-bag', unit: ['compra', 'compras'], defaultGoal: 3, example: 'Realizá 3 compras este mes' },
  puntos: { label: 'Conseguir puntos', icon: 'leaf', unit: ['punto', 'puntos'], defaultGoal: 500, example: 'Conseguí 500 puntos' },
  semanas: { label: 'Semanas consecutivas', icon: 'flame', unit: ['semana', 'semanas'], defaultGoal: 3, example: 'Comprá durante 3 semanas seguidas' },
  visitas: { label: 'Visitas (días distintos)', icon: 'store', unit: ['visita', 'visitas'], defaultGoal: 4, example: 'Visitá el local 4 veces' },
  primer_canje: { label: 'Primer canje', icon: 'gift', unit: ['canje', 'canjes'], defaultGoal: 1, example: 'Canjeá tu primera recompensa' },
  compra_antes: { label: 'Comprar antes de una fecha', icon: 'calendar-clock', unit: ['compra', 'compras'], defaultGoal: 1, example: 'Hacé una compra antes del viernes' },
};

export const CHALLENGE_STATUS = {
  borrador: { label: 'Borrador', tone: '' },
  activo: { label: 'Activo', tone: 'green' },
  pausado: { label: 'Pausado', tone: 'honey' },
  finalizado: { label: 'Finalizado', tone: '' },
};

const inWindow = (date, c) => {
  const t = new Date(date).getTime();
  return (!c.startDate || t >= new Date(c.startDate).getTime()) && (!c.endDate || t <= new Date(c.endDate).getTime());
};

export const challenges = {
  TYPES: CHALLENGE_TYPES,
  STATUS: CHALLENGE_STATUS,

  /** Está activo y dentro de sus fechas. */
  isLive(c, now = new Date()) {
    return c.status === 'activo' && (!c.startDate || new Date(c.startDate) <= now) && (!c.endDate || new Date(c.endDate) >= now);
  },

  /** Estado real según las fechas: un desafío "activo" vencido se muestra como finalizado. */
  effectiveStatus(c, now = new Date()) {
    if (c.status === 'activo' && c.endDate && new Date(c.endDate) < now) return 'finalizado';
    return c.status;
  },

  /**
   * Progreso de un cliente en un desafío.
   * Recibe el desafío, los movimientos del cliente en ESTE negocio y el
   * registro de completado (si existe).
   * Devuelve { value, goal, pct, done, missing }.
   */
  progress(c, movements, completion = null) {
    const inside = movements.filter((m) => inWindow(m.date, c));
    const purchases = inside.filter((m) => m.type === 'compra');
    let value = 0;
    switch (c.type) {
      case 'compras':
      case 'compra_antes':
        value = purchases.length;
        break;
      case 'visitas':
        value = new Set(purchases.map((m) => dayKey(m.date))).size;
        break;
      case 'puntos':
        // Sólo puntos que cuentan para el período (es decir, de compras)
        value = sum(inside.filter((m) => m.points > 0 && m.countsForPeriod), (m) => m.points);
        break;
      case 'primer_canje':
        value = inside.filter((m) => m.type === 'canje').length;
        break;
      case 'semanas': {
        // Mejor tramo de semanas consecutivas dentro de la vigencia
        const keys = new Set(purchases.map((m) => weekKey(m.date)));
        let best = 0;
        keys.forEach((k) => {
          let n = 0;
          let d = new Date(`${k}T12:00:00`);
          while (keys.has(weekKey(d))) { n++; d = addDays(d, -7); }
          best = Math.max(best, n);
        });
        value = best;
        break;
      }
      default:
        value = 0;
    }
    const goal = Number(c.goal) || 1;
    const done = Boolean(completion) || value >= goal;
    return { value: Math.min(value, goal), goal, pct: Math.min(1, value / goal), done, missing: Math.max(0, goal - value) };
  },

  /** "Te falta 1 compra" / "¡Completado!" */
  missingText(c, p) {
    const [one, many] = CHALLENGE_TYPES[c.type]?.unit || ['paso', 'pasos'];
    return p.done ? '¡Completado!' : `Te ${p.missing === 1 ? 'falta' : 'faltan'} ${format.plural(p.missing, one, many)}`;
  },

  /** Texto del premio: "+150 puntos" o el premio libre que cargó el negocio. */
  rewardText(c) {
    if (c.rewardPoints) return `+${format.points(c.rewardPoints)} puntos`;
    return c.rewardText || 'Premio sorpresa';
  },
};
