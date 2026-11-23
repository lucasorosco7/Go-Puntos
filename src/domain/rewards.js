/**
 * Dominio · Recompensas y canjes.
 *
 * Una recompensa se VE en el catálogo si está activa y dentro de sus fechas;
 * se puede CANJEAR si además tiene stock. Un canje genera un código único
 * que el cliente muestra en el local y que valida un administrador o empleado.
 */
import { format } from '../utils/format.js';
import { randomCode } from '../utils/helpers.js';

export const REWARD_STATUS = {
  activa: { label: 'Activa', tone: 'green' },
  pausada: { label: 'Pausada', tone: 'honey' },
  finalizada: { label: 'Finalizada', tone: '' },
};

export const REDEMPTION_STATUS = {
  pendiente: { label: 'Para retirar', tone: 'honey', icon: 'clock' },
  entregado: { label: 'Entregado', tone: 'green', icon: 'circle-check' },
  vencido: { label: 'Vencido', tone: 'danger', icon: 'hourglass' },
  anulado: { label: 'Anulado', tone: '', icon: 'x' },
};

export const rewards = {
  STATUS: REWARD_STATUS,
  REDEMPTION_STATUS,

  /** Sin stock cargado (null) significa "sin límite". */
  hasStock: (r) => r.stock === null || r.stock === undefined || r.stock > 0,

  inDates(r, now = new Date()) {
    return (!r.validFrom || new Date(r.validFrom) <= now) && (!r.validTo || new Date(r.validTo) >= now);
  },

  /** Se muestra en el catálogo del cliente (aunque esté agotada). */
  isVisible(r, now = new Date()) {
    return (r.status || 'activa') === 'activa' && rewards.inDates(r, now);
  },

  /** Se puede canjear ahora. */
  isAvailable(r, now = new Date()) {
    return rewards.isVisible(r, now) && rewards.hasStock(r);
  },

  stockText(r) {
    if (r.stock === null || r.stock === undefined) return 'Sin límite';
    if (r.stock <= 0) return 'Agotado';
    return `${format.points(r.stock)} disponibles`;
  },

  /** Estado real de un canje: uno pendiente que pasó su vencimiento está vencido. */
  redemptionStatus(red, now = new Date()) {
    if (red.status === 'pendiente' && red.expiresAt && new Date(red.expiresAt) < now) return 'vencido';
    return red.status;
  },

  /** Código de canje: prefijo del negocio + 4 + 2 caracteres. Ej.: CV-7K3P-Q9 */
  newCode(prefix) {
    return `${prefix}-${randomCode(4)}-${randomCode(2)}`;
  },

  /** La recompensa disponible más barata que todavía no le alcanza (meta de la tarjeta de puntos). */
  nextReward(balance, list) {
    return list.filter((r) => rewards.isAvailable(r) && r.points > balance).sort((a, b) => a.points - b.points)[0] || null;
  },

  /** Progreso del saldo hacia una recompensa. */
  progressTo(balance, reward) {
    if (!reward) return { progress: 1, missing: 0 };
    return { progress: Math.min(1, balance / reward.points), missing: Math.max(0, reward.points - balance) };
  },
};
