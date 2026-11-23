/**
 * Dominio · Administración de la plataforma (Superadmin).
 *
 * Reglas puras (sin Vue ni datos) para:
 *   - estados de los negocios          → negocios.estado
 *   - estados de las solicitudes       → solicitudes_negocio.estado
 *   - estados de las invitaciones      → invitaciones_registro.estado (+ "vencida", que se calcula)
 *   - acciones de la auditoría         → auditoria_plataforma.accion
 *   - transiciones permitidas (suspender, bloquear, reactivar)
 *   - requisitos para enviar un negocio a revisión
 *
 * Los valores son EXACTAMENTE los del esquema go_puntos_v2 (CHECK de MySQL).
 * No se agregan estados nuevos: la "configuración incompleta" de un negocio
 * nuevo es un negocio 'pendiente' cuya solicitud todavía no se envió
 * (fecha de envío vacía), no un estado distinto.
 */

/** negocios.estado (CHECK ck_negocios_estado). */
export const BUSINESS_STATUS = {
  pendiente: { label: 'Pendiente', tone: 'honey', icon: 'hourglass' },
  activo: { label: 'Activo', tone: 'green', icon: 'circle-check' },
  rechazado: { label: 'Rechazado', tone: 'danger', icon: 'circle-x' },
  suspendido: { label: 'Suspendido', tone: 'sky', icon: 'circle-pause' },
  bloqueado: { label: 'Bloqueado', tone: 'danger', icon: 'ban' },
};

/** solicitudes_negocio.estado (CHECK ck_solicitud_estado). */
export const REQUEST_STATUS = {
  pendiente: { label: 'Pendiente', tone: 'honey' },
  aprobada: { label: 'Aprobada', tone: 'green' },
  rechazada: { label: 'Rechazada', tone: 'danger' },
};

/**
 * Etapa de una solicitud vista por las personas. Se deriva del estado y de
 * si el dueño ya la envió; no se guarda como estado.
 *   preparacion → pendiente, todavía no enviada (el dueño configura su programa)
 *   revision    → pendiente y enviada (espera la decisión del Superadmin)
 *   aprobada / rechazada
 */
export const REQUEST_PHASES = {
  preparacion: { label: 'En preparación', tone: '', icon: 'pencil' },
  revision: { label: 'En revisión', tone: 'honey', icon: 'hourglass' },
  aprobada: { label: 'Aprobada', tone: 'green', icon: 'circle-check' },
  rechazada: { label: 'Rechazada', tone: 'danger', icon: 'circle-x' },
};

/**
 * invitaciones_registro.estado (CHECK: pendiente | utilizada | revocada).
 * "vencida" NO es un estado guardado: es una invitación pendiente cuya
 * fecha_vencimiento ya pasó.
 */
export const INVITATION_STATUS = {
  pendiente: { label: 'Pendiente', tone: 'honey', icon: 'mail' },
  utilizada: { label: 'Utilizada', tone: 'green', icon: 'circle-check' },
  vencida: { label: 'Vencida', tone: '', icon: 'clock' },
  revocada: { label: 'Revocada', tone: 'danger', icon: 'ban' },
};

/** auditoria_plataforma.accion (CHECK ck_auditoria_accion): las 7 acciones posibles. */
export const AUDIT_ACTIONS = {
  crear_invitacion: { label: 'Creó una invitación', short: 'Invitación creada', icon: 'mail-plus', tone: 'sky' },
  revocar_invitacion: { label: 'Revocó una invitación', short: 'Invitación revocada', icon: 'mail-x', tone: '' },
  aprobar_negocio: { label: 'Aprobó un negocio', short: 'Negocio aprobado', icon: 'circle-check', tone: 'green' },
  rechazar_negocio: { label: 'Rechazó una solicitud', short: 'Solicitud rechazada', icon: 'circle-x', tone: 'danger' },
  suspender_negocio: { label: 'Suspendió un negocio', short: 'Negocio suspendido', icon: 'circle-pause', tone: 'sky' },
  bloquear_negocio: { label: 'Bloqueó un negocio', short: 'Negocio bloqueado', icon: 'ban', tone: 'danger' },
  reactivar_negocio: { label: 'Reactivó un negocio', short: 'Negocio reactivado', icon: 'circle-play', tone: 'green' },
};

/**
 * Cambios de estado que puede hacer el Superadmin sobre un negocio ya aprobado.
 * from: estados desde los que se permite · to: estado resultante.
 */
export const STATUS_ACTIONS = {
  suspender: {
    from: ['activo'], to: 'suspendido', audit: 'suspender_negocio', reasonRequired: true,
    label: 'Suspender', icon: 'circle-pause',
    help: 'El negocio deja de operar temporalmente: no registra compras ni canjes y sus clientes ven el programa pausado. Los saldos se conservan.',
  },
  bloquear: {
    from: ['activo', 'suspendido'], to: 'bloqueado', audit: 'bloquear_negocio', reasonRequired: true,
    label: 'Bloquear', icon: 'ban',
    help: 'El equipo del negocio pierde el acceso al panel y el programa deja de estar disponible para los clientes. Los saldos se conservan.',
  },
  reactivar: {
    from: ['suspendido', 'bloqueado'], to: 'activo', audit: 'reactivar_negocio', reasonRequired: false,
    label: 'Reactivar', icon: 'circle-play',
    help: 'El negocio vuelve a operar normalmente con sus clientes, saldos y configuración.',
  },
};

/** Vigencias que se ofrecen al crear una invitación (días). */
export const INVITATION_DAYS = [3, 7, 14, 30];
/** Largo mínimo del motivo de un rechazo, suspensión o bloqueo. */
export const MIN_REASON = 10;

const time = (d) => new Date(d).getTime();

export const platform = {
  /** Estado visible de una invitación (calcula "vencida"). */
  invitationStatus(inv, now = new Date()) {
    if (inv.status === 'pendiente' && time(inv.expiresAt) <= time(now)) return 'vencida';
    return inv.status;
  },

  /** ¿La invitación todavía permite registrar un negocio? */
  invitationUsable(inv, now = new Date()) {
    return platform.invitationStatus(inv, now) === 'pendiente';
  },

  /** Motivo por el que una invitación no sirve (para mostrarlo en el registro). */
  invitationProblem(inv, now = new Date()) {
    if (!inv) return 'El enlace de invitación no es válido. Revisá que esté completo o pedí uno nuevo.';
    const st = platform.invitationStatus(inv, now);
    if (st === 'utilizada') return 'Esta invitación ya se usó para registrar un negocio. Pedí una nueva si querés registrar otro.';
    if (st === 'revocada') return 'Esta invitación fue revocada por el equipo de GO Puntos.';
    if (st === 'vencida') return 'Esta invitación venció. Pedí una nueva al equipo de GO Puntos.';
    return '';
  },

  /** Etapa de una solicitud: preparacion | revision | aprobada | rechazada. */
  requestPhase(req) {
    if (!req) return null;
    if (req.status === 'pendiente') return req.submittedAt ? 'revision' : 'preparacion';
    return req.status;
  },

  /** ¿Se puede aplicar esta acción (suspender, bloquear, reactivar) al negocio? */
  canApply(action, businessStatus) {
    return Boolean(STATUS_ACTIONS[action]?.from.includes(businessStatus));
  },

  /** Acciones de estado disponibles para un negocio. */
  actionsFor(businessStatus) {
    return Object.keys(STATUS_ACTIONS).filter((a) => platform.canApply(a, businessStatus));
  },

  /** Valida un motivo obligatorio. Devuelve el mensaje de error o ''. */
  reasonError(reason) {
    const text = String(reason || '').trim();
    if (!text) return 'Escribí el motivo.';
    if (text.length < MIN_REASON) return `Contá un poco más (mínimo ${MIN_REASON} caracteres).`;
    if (text.length > 500) return 'El motivo puede tener hasta 500 caracteres.';
    return '';
  },

  /**
   * Requisitos mínimos para enviar el programa a revisión.
   * counts: { levels, rewards } · business: { name, pointsRule }
   * Devuelve [{ key, label, ok }].
   */
  setupChecklist(business, counts) {
    return [
      { key: 'negocio', label: 'Nombre del negocio', ok: Boolean(String(business?.name || '').trim()) },
      { key: 'puntos', label: 'Regla de puntos', ok: Number(business?.pointsRule?.pesos) > 0 && Number(business?.pointsRule?.points) > 0 },
      { key: 'niveles', label: 'Niveles del programa', ok: (counts?.levels || 0) > 0 },
      { key: 'recompensas', label: 'Al menos una recompensa activa', ok: (counts?.rewards || 0) > 0 },
    ];
  },

  /** Motivo listo para insertar en una oración (sin el punto final, que agrega quien lo usa). */
  sentence(text) {
    return String(text || '').trim().replace(/[.\s]+$/, '');
  },

  /** ¿El negocio puede operar con clientes (compras, canjes, sumar clientes, campañas)? */
  isOperational(business) {
    return business?.status === 'activo';
  },

  /** Mensaje para una operación de fidelización en un negocio que no está activo. */
  notOperationalMessage(business) {
    const name = business?.name || 'Este negocio';
    switch (business?.status) {
      case 'pendiente': return `${name} todavía no fue aprobado por GO Puntos. Podrá operar cuando se apruebe su solicitud.`;
      case 'rechazado': return `La solicitud de ${name} fue rechazada. Corregí lo indicado y volvé a enviarla a revisión.`;
      case 'suspendido': return `${name} está suspendido temporalmente. Los puntos se conservan, pero no se pueden registrar operaciones.`;
      case 'bloqueado': return `${name} fue bloqueado y no puede operar en GO Puntos.`;
      default: return `${name} no está disponible.`;
    }
  },
};
