/**
 * Registro de secciones de configuración del negocio.
 *
 * Cada sección se escribe UNA vez y la usan:
 *   - el asistente de configuración inicial (OnboardingView), en el orden de WIZARD;
 *   - Configuración (SettingsView), en pestañas (TABS), más Empleados y QR.
 *
 * slug: cómo aparece en la URL de Configuración (/panel/configuracion/:slug).
 * required: el asistente no permite omitirla.
 * Cada componente recibe "ctx" ({ business, levels, rewards, offers, challenges })
 * y expone save().
 */
import SettingsChallenges from './SettingsChallenges.vue';
import SettingsIdentity from './SettingsIdentity.vue';
import SettingsInfo from './SettingsInfo.vue';
import SettingsLevels from './SettingsLevels.vue';
import SettingsNotifications from './SettingsNotifications.vue';
import SettingsOffers from './SettingsOffers.vue';
import SettingsPoints from './SettingsPoints.vue';
import SettingsPrize from './SettingsPrize.vue';
import SettingsQr from './SettingsQr.vue';
import SettingsRanking from './SettingsRanking.vue';
import SettingsRewards from './SettingsRewards.vue';
import SettingsSummary from './SettingsSummary.vue';
import SettingsTeam from './SettingsTeam.vue';

export const SECTIONS = {
  info: { slug: 'negocio', tab: 'Negocio', title: 'Información del negocio', icon: 'store', required: true, component: SettingsInfo,
    description: 'Lo que ven tus clientes al sumarse: nombre, logo y cómo encontrarte.' },
  identity: { slug: 'identidad', tab: 'Identidad', title: 'Identidad visual', icon: 'palette', component: SettingsIdentity,
    description: 'Elegí una paleta profesional. Todos los colores de la app se ajustan solos y mantienen buen contraste.' },
  points: { slug: 'puntos', tab: 'Puntos', title: 'Sistema de puntos', icon: 'calculator', required: true, component: SettingsPoints,
    description: 'Cuántos puntos gana un cliente por lo que gasta. Se calcula solo en cada compra.' },
  levels: { slug: 'niveles', tab: 'Niveles', title: 'Niveles', icon: 'medal', component: SettingsLevels,
    description: 'Los puntos que el cliente suma con compras en un mes definen su nivel del mes siguiente (no el saldo). Canjear no baja de nivel.' },
  rewards: { title: 'Recompensas', icon: 'gift', component: SettingsRewards,
    description: 'Lo que tus clientes pueden canjear. Empezá con 2 o 3; después agregás más desde Recompensas.' },
  offers: { title: 'Ofertas iniciales', icon: 'tag', component: SettingsOffers,
    description: 'Promociones para arrancar: descuentos, puntos dobles o beneficios por nivel. Es opcional.' },
  ranking: { slug: 'ranking', tab: 'Ranking', title: 'Ranking mensual', icon: 'trophy', component: SettingsRanking,
    description: 'Tus clientes compiten por los puntos que suman en el mes. Ven el Top 5 y su propia posición.' },
  prize: { slug: 'premio', tab: 'Premio', title: 'Premio mensual', icon: 'party-popper', component: SettingsPrize,
    description: 'Un premio para el #1 del ranking de cada mes. Se entrega solo al cerrar el mes.' },
  challenges: { slug: 'desafios', tab: 'Desafíos y rachas', title: 'Desafíos y rachas', icon: 'target', component: SettingsChallenges,
    description: 'Objetivos con premio y rachas de compras semanales. Aparecen en el perfil del cliente y por notificación, sin recargar la pantalla principal.' },
  notifications: { slug: 'notificaciones', tab: 'Notificaciones', title: 'Notificaciones', icon: 'bell-ring', component: SettingsNotifications,
    description: 'Qué avisos automáticos reciben tus clientes en la campana de la app.' },
  summary: { title: 'Resumen y envío a revisión', icon: 'rocket', component: SettingsSummary,
    description: 'Revisá todo y enviá tu programa a GO Puntos. Cuando lo aprueben, tus clientes podrán sumarse. Podés seguir ajustando después desde Configuración.' },
  team: { slug: 'empleados', tab: 'Empleados', title: 'Empleados', icon: 'id-card', component: SettingsTeam, standalone: true },
  qr: { slug: 'qr', tab: 'QR del negocio', title: 'QR del negocio', icon: 'qr-code', component: SettingsQr, standalone: true },
};

/** Orden del asistente de configuración inicial. */
export const WIZARD = ['info', 'identity', 'points', 'levels', 'rewards', 'offers', 'ranking', 'prize', 'challenges', 'notifications', 'summary'];

/** Pestañas de Configuración (en orden). */
export const TABS = ['info', 'identity', 'points', 'levels', 'ranking', 'prize', 'challenges', 'notifications', 'team', 'qr'];

/** Sección a partir del slug de la URL. */
export const sectionBySlug = (slug) => TABS.find((id) => SECTIONS[id].slug === slug) || 'info';
