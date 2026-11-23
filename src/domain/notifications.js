/**
 * Dominio · Tipos de notificación.
 *
 * Cada tipo automático se puede apagar desde Configuración > Notificaciones
 * (configuración de notificaciones del negocio). Los tipos "celebrate"
 * se muestran además como ventana emergente la primera vez.
 */

export const NOTIFICATION_TYPES = {
  racha: { label: 'Rachas', icon: 'flame', tone: 'honey', emoji: '🔥', description: 'Racha lograda o a punto de perderse.' },
  desafio: { label: 'Desafíos', icon: 'target', tone: 'green', emoji: '🎯', description: 'Desafíos completados o a un paso.' },
  ranking: { label: 'Ranking', icon: 'trophy', tone: 'honey', emoji: '🏆', description: 'Cambios de posición y cierre del mes.' },
  nivel: { label: 'Cambios de nivel', icon: 'medal', tone: 'honey', emoji: '🥇', description: 'Cuando el cliente sube de nivel.' },
  cercania: { label: 'Cerca del siguiente nivel', icon: 'star', tone: 'sky', emoji: '⭐', description: 'Cuando le falta poco para subir.' },
  recompensa: { label: 'Nuevas recompensas', icon: 'gift', tone: 'green', emoji: '🎁', description: 'Al publicar una recompensa.' },
  oferta: { label: 'Nuevas ofertas', icon: 'tag', tone: 'honey', emoji: '🔥', description: 'Al activar una oferta.' },
  campana: { label: 'Campañas del negocio', icon: 'megaphone', tone: 'sky', emoji: '📣', description: 'Mensajes que envía el negocio.' },
  premio: { label: 'Premios', icon: 'party-popper', tone: 'honey', emoji: '🎉', description: 'Premio mensual y desafíos.' },
  puntos: { label: 'Puntos acreditados', icon: 'leaf', tone: 'green', emoji: '🌿', description: 'Resumen de puntos sumados.' },
  sistema: { label: 'Avisos de la cuenta', icon: 'info', tone: 'sky', emoji: 'ℹ️', description: 'Avisos generales.' },
};

export const notificationTypes = {
  TYPES: NOTIFICATION_TYPES,
  /** Tipos que el negocio puede encender o apagar. */
  configurable: ['racha', 'desafio', 'ranking', 'nivel', 'cercania', 'recompensa', 'oferta', 'campana'],
  /** Tipos que merecen una ventana emergente (pop-up) la primera vez. */
  celebrate: ['nivel', 'premio', 'desafio'],
  meta: (type) => NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.sistema,
};
