/**
 * Formato de datos para mostrar en pantalla (Argentina, es-AR).
 *
 * Puntos, pesos, fechas relativas, nombres de meses, etc. Son funciones
 * puras: no conocen la interfaz ni los datos, sólo transforman valores.
 * Se usan tanto en los componentes como en los mensajes que arma el
 * servidor simulado (por ejemplo, el texto de una notificación).
 */
import { daysBetween, periodStart, startOfDay } from './dates.js';

const numberFmt = new Intl.NumberFormat('es-AR');
const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const shortDateFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const longDateFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'long' });

export const format = {
  /** 1240 → "1.240" */
  points: (n) => numberFmt.format(n),
  /** 150 → "+150", -80 → "−80" (signo menos tipográfico) */
  signedPoints: (n) => (n > 0 ? '+' : '−') + numberFmt.format(Math.abs(n)),
  /** 12600 → "$ 12.600" */
  currency: (n) => currencyFmt.format(n),
  /** "14 sept" */
  shortDate: (iso) => shortDateFmt.format(new Date(iso)).replace('.', ''),
  /** "14 de septiembre de 2026" */
  longDate: (iso) => longDateFmt.format(new Date(iso)),
  /** "14 sept, 18:40" */
  dateTime: (iso) => dateTimeFmt.format(new Date(iso)).replace('.', ''),

  greeting(date = new Date()) {
    const h = date.getHours();
    if (h < 6) return 'Buenas noches';
    if (h < 13) return 'Buen día';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  },

  initials: (first = '', last = '') => (first.charAt(0) + last.charAt(0)).toUpperCase(),

  /** "2026-09" → "septiembre" (o "septiembre 2026" con withYear) */
  period(period, withYear = false) {
    const d = periodStart(period);
    const m = monthFmt.format(d);
    return withYear ? `${m} ${d.getFullYear()}` : m;
  },

  /** "2026-09" → "Septiembre 2026" */
  periodTitle(period) {
    const t = format.period(period, true);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },

  /** 0.183 → "18%" */
  percent: (n, digits = 0) => `${(n * 100).toFixed(digits).replace('.', ',')}%`,

  /** Fecha relativa para listas: "Hoy", "Ayer", "Hace 3 días", "Hace 2 meses". */
  relative(iso, now = new Date()) {
    if (!iso) return 'Nunca';
    const days = daysBetween(startOfDay(iso), startOfDay(now));
    if (days <= 0) {
      const mins = Math.round((now - new Date(iso)) / 60000);
      if (mins < 1) return 'Recién';
      if (mins < 60) return `Hace ${mins} min`;
      return 'Hoy';
    }
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    const months = Math.floor(days / 30);
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  },

  /** plural(3, 'compra', 'compras') → "3 compras" */
  plural: (n, one, many) => `${numberFmt.format(n)} ${n === 1 ? one : many}`,
};
