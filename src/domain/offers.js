/**
 * Dominio · Ofertas.
 *
 * Tipos de oferta, estados, vigencia, elegibilidad por nivel y los textos
 * cortos que ve el cliente. Las ofertas de puntos (puntos dobles y puntos
 * extra) además intervienen en el cálculo de una compra (domain/points.js).
 */
import { format } from '../utils/format.js';

export const OFFER_TYPES = {
  porcentaje: { label: 'Descuento porcentual', icon: 'percent', valueLabel: 'Porcentaje de descuento', suffix: '%' },
  monto_fijo: { label: 'Descuento fijo', icon: 'banknote', valueLabel: 'Monto a descontar ($)', prefix: '$' },
  puntos_dobles: { label: 'Puntos multiplicados', icon: 'sparkles', valueLabel: 'Multiplicador (2 = puntos dobles)', prefix: 'x', affectsPoints: true },
  puntos_extra: { label: 'Puntos extra', icon: 'circle-plus', valueLabel: 'Puntos extra por compra', suffix: ' pts', affectsPoints: true },
  exclusivo_nivel: { label: 'Beneficio exclusivo por nivel', icon: 'crown', valueLabel: '' },
  temporal: { label: 'Promoción temporal', icon: 'clock', valueLabel: '' },
};

export const OFFER_STATUS = {
  borrador: { label: 'Borrador', tone: '' },
  activa: { label: 'Activa', tone: 'green' },
  programada: { label: 'Programada', tone: 'sky' },
  pausada: { label: 'Pausada', tone: 'honey' },
  finalizada: { label: 'Finalizada', tone: '' },
};

const dayFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });

export const offers = {
  TYPES: OFFER_TYPES,
  STATUS: OFFER_STATUS,

  /**
   * Estado real teniendo en cuenta las fechas.
   * "Programada" y "vencida" no se guardan: una oferta "activa" con fecha
   * de inicio futura está programada, y con fecha de fin pasada, finalizada.
   */
  effectiveStatus(o, now = new Date()) {
    if (o.status !== 'activa') return o.status;
    if (o.startDate && new Date(o.startDate) > now) return 'programada';
    if (o.endDate && new Date(o.endDate) < now) return 'finalizada';
    return 'activa';
  },

  isLive(o, now = new Date()) {
    return offers.effectiveStatus(o, now) === 'activa';
  },

  /** ¿La puede usar un cliente con este nivel vigente? Sin niveles = para todos. */
  isEligible(o, levelId) {
    return !o.levelIds?.length || o.levelIds.includes(levelId);
  },

  /** Las ofertas de puntos se aplican en Caja al registrar una compra. */
  affectsPoints(o) {
    return Boolean(OFFER_TYPES[o.type]?.affectsPoints);
  },

  /** Etiqueta corta: "20% off", "Puntos dobles", "+100 pts". */
  tag(o) {
    if (o.tag) return o.tag;
    const v = Number(o.value);
    switch (o.type) {
      case 'porcentaje': return `${v}% off`;
      case 'monto_fijo': return `${format.currency(v)} off`;
      case 'puntos_dobles': return v === 2 ? 'Puntos dobles' : `Puntos x${v}`;
      case 'puntos_extra': return `+${format.points(v)} pts`;
      case 'exclusivo_nivel': return 'Exclusivo';
      default: return 'Promo';
    }
  },

  /** Tono de color de la etiqueta (siempre dentro de la paleta del negocio). */
  tone(o) {
    if (o.tone) return o.tone;
    return { puntos_dobles: 'honey', puntos_extra: 'green', exclusivo_nivel: 'honey', temporal: 'sky' }[o.type] || 'honey';
  },

  /** Vigencia legible: "Del 15 al 20 de septiembre", "Hasta el 30 de septiembre" o el texto libre del negocio. */
  when(o) {
    if (o.schedule) return o.schedule;
    const s = o.startDate && new Date(o.startDate);
    const e = o.endDate && new Date(o.endDate);
    if (s && e) {
      const sameMonth = s.getMonth() === e.getMonth();
      return sameMonth ? `Del ${s.getDate()} al ${dayFmt.format(e)}` : `Del ${dayFmt.format(s)} al ${dayFmt.format(e)}`;
    }
    if (e) return `Hasta el ${dayFmt.format(e)}`;
    if (s) return `Desde el ${dayFmt.format(s)}`;
    return 'Sin fecha de fin';
  },
};
