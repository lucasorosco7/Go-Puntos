/**
 * Dominio · Niveles (regla definitiva de GO Puntos).
 *
 * Sistema por períodos mensuales:
 * - Los PUNTOS DEL PERÍODO de un mes determinan el nivel que el cliente
 *   tendrá durante el MES SIGUIENTE.
 * - El nivel VIGENTE (el que da beneficios hoy) se guarda en la membresía
 *   (levelId) y sólo cambia en el cierre mensual.
 * - Un cliente nuevo arranca en el nivel más bajo.
 * - El saldo disponible nunca interviene.
 *
 * Ejemplo: septiembre 4.300 pts → octubre es Oro (con sus beneficios)
 *          mientras acumula para noviembre. Octubre 2.100 pts → noviembre Plata.
 */
import { LEVEL_COLORS } from '../config/catalogs.js';
import { nextPeriod } from '../utils/dates.js';

const sorted = (list) => [...list].sort((a, b) => a.minPoints - b.minPoints);

export const levels = {
  /** Niveles ordenados de menor a mayor exigencia. */
  sorted,

  /** El nivel más bajo: con el que arranca todo cliente. */
  base: (list) => sorted(list)[0],

  /** Nivel que corresponde a una cantidad de puntos de un período. */
  forPoints(list, value) {
    const ordered = sorted(list);
    return [...ordered].reverse().find((l) => value >= l.minPoints) || ordered[0];
  },

  /** Nivel inmediatamente superior (o null si ya es el más alto). */
  next(list, current) {
    const ordered = sorted(list);
    const i = ordered.findIndex((l) => l.id === current?.id);
    return i >= 0 ? ordered[i + 1] || null : null;
  },

  /** Nivel vigente de una membresía: el que ganó el período anterior (o el más bajo). */
  current(list, membership) {
    return list.find((l) => l.id === membership.levelId) || levels.base(list);
  },

  /**
   * Todo lo que el cliente necesita ver sobre su nivel.
   *
   * Recibe los niveles del negocio, la membresía y el período actual.
   * Devuelve:
   *   level:  nivel VIGENTE (beneficios de este mes)
   *   earned: nivel que ya aseguró para el mes siguiente con los puntos de este mes
   *   next:   siguiente escalón por encima de "earned" (la próxima meta)
   *   missing / progress: cuánto le falta este mes para ese siguiente escalón
   *   currentIsTop: hoy está en el nivel más alto (segmento VIP)
   */
  status(list, membership, period = null) {
    const periodPoints = membership.periodPoints || 0;
    const level = levels.current(list, membership);
    const earned = levels.forPoints(list, periodPoints);
    const next = levels.next(list, earned);
    return {
      level,
      earned,
      next,
      periodPoints,
      missing: next ? Math.max(0, next.minPoints - periodPoints) : 0,
      progress: next ? Math.min(1, periodPoints / next.minPoints) : 1,
      isTop: !next,
      currentIsTop: !levels.next(list, level),
      nextPeriod: period ? nextPeriod(period) : null,
    };
  },

  /** Colores de la insignia según la opción (cerrada) que eligió el negocio. */
  colors(level) {
    return LEVEL_COLORS[level?.color] || LEVEL_COLORS.marca;
  },
};
