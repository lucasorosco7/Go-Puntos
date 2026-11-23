/**
 * Dominio · Puntos (regla definitiva de GO Puntos).
 *
 * Reglas puras: no conocen la interfaz ni de dónde salen los datos.
 * El backend real debe aplicar EXACTAMENTE estas mismas reglas
 * (este archivo funciona también como especificación).
 *
 * ORDEN ÚNICO DEL CÁLCULO DE UNA COMPRA
 *   1. Importe de la compra. Si no llega a la compra mínima, suma 0 puntos.
 *   2. Puntos base según la equivalencia del negocio ($12.500 / $100 × 1 = 125).
 *   3. × multiplicador del nivel VIGENTE del cliente (Oro ×1,2 → 150).
 *   4. Promociones de puntos:
 *      - Multiplicadoras (puntos_dobles): NO se acumulan entre sí. Se aplica
 *        una sola: la de mayor multiplicador; si empatan, la que termina antes;
 *        si siguen empatadas, la más antigua (×2 → 300).
 *      - Puntos extra (puntos_extra): se suman después del multiplicador, cada
 *        una una sola vez y sólo si el cajero confirma la condición.
 *   5. Redondeo final, una única vez, según la regla del negocio.
 *      Los pasos intermedios NO se redondean.
 *
 * QUÉ SUMA A LOS PUNTOS DEL PERÍODO (nivel, ranking, desafíos de puntos)
 *   Sólo los puntos de COMPRAS. Bonificaciones, premios de desafíos, premios
 *   del ranking y ajustes manuales suman únicamente al saldo disponible.
 */
import { format } from '../utils/format.js';

/** Modos de redondeo que puede elegir el negocio. */
export const ROUNDING = {
  abajo: { label: 'Hacia abajo', hint: '$12.580 → 125 puntos', fn: Math.floor },
  normal: { label: 'Al más cercano', hint: '$12.580 → 126 puntos', fn: Math.round },
  arriba: { label: 'Hacia arriba', hint: '$12.510 → 126 puntos', fn: Math.ceil },
};

/** Tipos de movimiento que cuentan para los puntos del período. */
export const PERIOD_TYPES = ['compra'];

// El 1e-9 evita errores de coma flotante (por ejemplo 149,99999 en vez de 150).
const round = (value, mode) => (ROUNDING[mode] || ROUNDING.abajo).fn(value + 1e-9);
const decimalFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

/**
 * Elige la única promoción multiplicadora que se aplica a una compra.
 * Recibe las promociones elegidas y devuelve { applied, skipped }:
 * la aplicada y las que no se acumulan (para avisarle al cajero).
 */
export function pickMultiplier(offers) {
  const mult = offers.filter((o) => o.type === 'puntos_dobles' && Number(o.value) > 1);
  if (!mult.length) return { applied: null, skipped: [] };
  const ranked = [...mult].sort((a, b) => Number(b.value) - Number(a.value)
    || new Date(a.endDate || '9999-12-31') - new Date(b.endDate || '9999-12-31')
    || a.id - b.id);
  return { applied: ranked[0], skipped: ranked.slice(1) };
}

export const points = {
  ROUNDING,
  PERIOD_TYPES,
  pickMultiplier,

  /**
   * ¿Este movimiento suma a los puntos del período?
   * Sólo las compras con puntos positivos. Por eso un canje nunca baja el
   * nivel ni el puesto en el ranking, y un premio no permite "subir" de nivel.
   */
  countsForPeriod: (type, value) => PERIOD_TYPES.includes(type) && value > 0,

  /** Texto de la equivalencia: "$ 100 = 1 punto". */
  describeRule(rule) {
    return `${format.currency(rule.pesos)} = ${format.plural(rule.points, 'punto', 'puntos')}`;
  },

  /** Subtotal con hasta 2 decimales (para mostrar el desglose paso a paso). */
  formatValue: (n) => decimalFmt.format(n),

  /**
   * Calcula los puntos de una compra siguiendo el orden único.
   *
   * Recibe:
   *   amount: importe en pesos
   *   rule:   regla de puntos del negocio (pesos, points, rounding, minPurchase, applyLevelMultiplier)
   *   level:  nivel VIGENTE del cliente (con su multiplier)
   *   offers: promociones de puntos elegidas (puntos_dobles | puntos_extra)
   *
   * Devuelve { base, total, lines, belowMinimum, skipped }:
   *   lines[] = pasos del cálculo { kind, label, value }, donde value es el
   *   subtotal acumulado (sin redondear) después de ese paso.
   *
   * Estos puntos se suman al saldo disponible y a los puntos del período
   * porque provienen de una compra.
   */
  calculate({ amount, rule, level = null, offers = [] }) {
    const amt = Number(amount) || 0;
    const belowMinimum = amt > 0 && amt < (rule.minPurchase || 0);
    const lines = [];

    // 1 y 2. Puntos base según la equivalencia (sin redondear todavía)
    let value = belowMinimum || amt <= 0 ? 0 : (amt / rule.pesos) * rule.points;
    const base = value;
    lines.push({ kind: 'base', label: `Puntos base: ${format.currency(amt)} (${points.describeRule(rule)})`, value });

    // 3. Multiplicador del nivel vigente (si el negocio lo tiene activado)
    if (value > 0 && rule.applyLevelMultiplier && level && level.multiplier > 1) {
      value *= level.multiplier;
      lines.push({ kind: 'level', label: `Nivel ${level.name} x${decimalFmt.format(level.multiplier)}`, value });
    }

    // 4a. Una sola promoción multiplicadora
    const { applied, skipped } = pickMultiplier(offers);
    if (value > 0 && applied) {
      value *= Number(applied.value);
      lines.push({ kind: 'offer', label: `${applied.title} x${decimalFmt.format(Number(applied.value))}`, value, offerId: applied.id });
    }

    // 4b. Puntos extra (suman después de multiplicar)
    offers.filter((o) => o.type === 'puntos_extra').forEach((o) => {
      if (value <= 0 || (o.minAmount && amt < o.minAmount)) return;
      value += Number(o.value) || 0;
      lines.push({ kind: 'extra', label: `${o.title} (+${format.points(Number(o.value) || 0)})`, value, offerId: o.id });
    });

    // 5. Redondeo final, una única vez
    const total = Math.max(0, round(value, rule.rounding));
    if (total !== value) lines.push({ kind: 'rounding', label: `Redondeo ${ROUNDING[rule.rounding]?.label.toLowerCase() || ''}`, value: total });

    return {
      base: round(base, rule.rounding),
      total,
      lines,
      belowMinimum,
      skipped: skipped.map((o) => ({ id: o.id, title: o.title, value: o.value })),
    };
  },
};
