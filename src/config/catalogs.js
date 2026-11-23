/**
 * Catálogos y valores por defecto de GO Puntos.
 *
 * Son listas cerradas que comparten el frontend, las reglas de dominio
 * y el servidor simulado: rubros, categorías de recompensas, colores e
 * íconos de niveles, roles y la configuración inicial de un negocio nuevo.
 *
 * Igual que con las paletas, el negocio elige entre opciones cerradas
 * (nunca colores o íconos libres) para mantener una interfaz legible.
 */

/** Configuración con la que nace un negocio (asistente de configuración inicial). */
export const BUSINESS_DEFAULTS = {
  pointsRule: { pesos: 100, points: 1, rounding: 'abajo', minPurchase: 0, welcomeBonus: 100, applyLevelMultiplier: true },
  levels: [
    { name: 'Bronce', minPoints: 0, multiplier: 1, icon: 'medal', color: 'bronce',
      description: 'El nivel con el que empezás.', benefits: ['Sumás puntos en cada compra'] },
    { name: 'Plata', minPoints: 1500, multiplier: 1.25, icon: 'award', color: 'plata',
      description: 'Para quienes compran seguido.', benefits: ['25% más de puntos por compra'] },
    { name: 'Oro', minPoints: 4000, multiplier: 1.5, icon: 'crown', color: 'oro',
      description: 'Nuestros clientes más fieles.', benefits: ['50% más de puntos por compra', 'Ofertas exclusivas'] },
  ],
  ranking: { enabled: true, showTop: 5, showPosition: true },
  monthlyPrize: { enabled: false, type: 'puntos', points: 500, rewardId: null, description: '' },
  challengesEnabled: true,
  streaks: { enabled: true, unit: 'semana', remindAtRisk: true },
  notifications: {
    racha: true, desafio: true, oferta: true, recompensa: true, nivel: true,
    ranking: true, cercania: true, campana: true, push: false,
  },
  redemptionValidityDays: 30,
};

/** Rubros disponibles al crear un negocio. */
export const BUSINESS_CATEGORIES = {
  dietetica: 'Dietética / almacén natural', cafeteria: 'Cafetería', panaderia: 'Panadería',
  restaurante: 'Restaurante', almacen: 'Almacén / autoservicio', indumentaria: 'Indumentaria',
  belleza: 'Belleza y estética', farmacia: 'Farmacia / perfumería', libreria: 'Librería', otro: 'Otro rubro',
};

/** Categorías de recompensas y ofertas: nombre visible + ícono de la ilustración. */
export const REWARD_CATEGORIES = {
  descuentos: { label: 'Descuentos', icon: 'percent' },
  almacen: { label: 'Almacén natural', icon: 'wheat' },
  snacks: { label: 'Snacks', icon: 'nut' },
  bebidas: { label: 'Infusiones', icon: 'coffee' },
  cafe: { label: 'Café', icon: 'coffee' },
  panaderia: { label: 'Panadería', icon: 'croissant' },
  experiencias: { label: 'Experiencias', icon: 'ticket' },
  general: { label: 'General', icon: 'gift' },
};

/** Colores permitidos para las insignias de nivel (contraste ya verificado). */
export const LEVEL_COLORS = {
  bronce: { label: 'Bronce', bg: '#f2e3d3', ink: '#80522a', dot: '#a8743f' },
  plata: { label: 'Plata', bg: '#e9edea', ink: '#4f5d55', dot: '#9aa7a0' },
  oro: { label: 'Oro', bg: '#f8e9c4', ink: '#7a520c', dot: '#c48a1a' },
  platino: { label: 'Platino', bg: '#e4ecf2', ink: '#3d5566', dot: '#7f9bb0' },
  marca: { label: 'Color de la marca', bg: 'var(--sage-2)', ink: 'var(--forest)', dot: 'var(--forest)' },
  acento: { label: 'Color de acento', bg: 'var(--honey-2)', ink: 'var(--honey-ink)', dot: 'var(--honey)' },
};

/** Íconos permitidos para las insignias de nivel. */
export const LEVEL_ICONS = ['medal', 'award', 'crown', 'gem', 'star', 'trophy', 'sprout', 'leaf', 'flame', 'coffee'];

/** Íconos que puede usar un negocio sin logo. */
export const BUSINESS_ICONS = ['store', 'leaf', 'coffee', 'croissant', 'shopping-basket', 'utensils', 'shirt', 'sparkles', 'book-open', 'heart-pulse'];

/**
 * Roles administrativos dentro de un negocio (personal del negocio).
 * El rol NO pertenece a la cuenta: una misma persona puede ser cliente
 * de varios negocios y, a la vez, dueña o empleada de otros.
 */
export const STAFF_ROLES = {
  owner: 'Dueño',
  admin: 'Administrador',
  empleado: 'Empleado',
};

/** Nombre visible de cada contexto de sesión. */
export const CONTEXT_LABELS = {
  cliente: 'Cliente',
  ...STAFF_ROLES,
};

/**
 * Tipos de movimiento de puntos: etiqueta e ícono para los historiales.
 * Sólo "compra" cuenta para los puntos del período (ver domain/points.js).
 */
export const MOVEMENT_TYPES = {
  compra: { label: 'Compra', icon: 'shopping-bag' },
  canje: { label: 'Canje', icon: 'gift' },
  bonificacion: { label: 'Bonificación', icon: 'sparkles' },
  vencimiento: { label: 'Vencimiento', icon: 'hourglass' },
  ajuste: { label: 'Ajuste', icon: 'sliders-horizontal' },
  premio: { label: 'Premio', icon: 'trophy' },
  desafio: { label: 'Desafío completado', icon: 'target' },
};
