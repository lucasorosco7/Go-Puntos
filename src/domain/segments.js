/**
 * Dominio · Segmentos de clientes (automáticos).
 *
 * Se calculan con la actividad del cliente en UN negocio. Un cliente puede
 * estar en varios segmentos a la vez (ej.: VIP y Frecuente), pero tiene un
 * único estado (activo, en riesgo o inactivo). Los usa el administrador
 * para filtrar clientes y elegir el público de una campaña.
 */
import { daysBetween } from '../utils/dates.js';

export const SEGMENTS = {
  vip: { label: 'VIP', tone: 'honey', icon: 'crown', rule: 'Su nivel vigente es el más alto del programa.' },
  frecuente: { label: 'Frecuentes', tone: 'green', icon: 'repeat', rule: '3 compras o más en los últimos 30 días.' },
  nuevo: { label: 'Nuevos', tone: 'sky', icon: 'sparkles', rule: 'Se sumaron hace 30 días o menos.' },
  en_riesgo: { label: 'En riesgo', tone: 'honey', icon: 'triangle-alert', rule: 'Su última compra fue hace 31 a 60 días.' },
  inactivo: { label: 'Inactivos', tone: 'danger', icon: 'moon', rule: 'Más de 60 días sin comprar.' },
};

export const CUSTOMER_STATUS = {
  activo: { label: 'Activo', tone: 'green' },
  en_riesgo: { label: 'En riesgo', tone: 'honey' },
  inactivo: { label: 'Inactivo', tone: 'danger' },
};

export const segments = {
  SEGMENTS,
  STATUS: CUSTOMER_STATUS,

  /**
   * Recibe la membresía, las fechas de compra del cliente en ese negocio y
   * el estado de nivel (domain/levels.js → status()).
   * Devuelve { segments, status, purchases30, daysSinceLast }.
   */
  compute(membership, purchaseDates, levelInfo, now = new Date()) {
    const days = (d) => daysBetween(d, now);
    const sinceLast = membership.lastPurchaseAt ? days(membership.lastPurchaseAt) : Infinity;
    const isNew = days(membership.joinedAt) <= 30;
    const recent = purchaseDates.filter((d) => days(d) <= 30).length;

    const list = [];
    if (levelInfo?.currentIsTop && levelInfo.level.minPoints > 0) list.push('vip');
    if (recent >= 3) list.push('frecuente');
    if (isNew) list.push('nuevo');
    if (!isNew && sinceLast > 30 && sinceLast <= 60) list.push('en_riesgo');
    if (!isNew && sinceLast > 60) list.push('inactivo');

    const status = sinceLast <= 30 || isNew ? 'activo' : sinceLast <= 60 ? 'en_riesgo' : 'inactivo';
    return { segments: list, status, purchases30: recent, daysSinceLast: sinceLast };
  },
};
