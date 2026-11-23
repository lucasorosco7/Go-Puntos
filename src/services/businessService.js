/**
 * Servicio de negocios de GO Puntos.
 *
 * Responsabilidad: datos públicos del negocio (página del QR), configuración
 * del programa (identidad, paleta, regla de puntos, ranking, premio, rachas,
 * notificaciones), niveles, configuración inicial, envío a revisión y personal.
 *
 * Las operaciones del panel actúan sobre el negocio del contexto activo
 * (encabezado X-Business-Id). Configurar requiere rol dueño o administrador.
 *
 * Endpoints previstos:
 *   GET   /businesses/:slug/public           → { business, levels, rewards, isMember }
 *   GET   /businesses/:slug/rewards          → [reward]
 *   GET   /business                          → { business, levels, rewards, counts, platform }
 *   PATCH /business            { ...campos } → business
 *   PUT   /business/levels     [level]       → [level]
 *   PATCH /business/onboarding { step, status }   /   POST /business/onboarding/dismiss
 *   POST  /business/submit-review            → { business, …, platform }  (envía la solicitud al Superadmin)
 *   GET   /business/employees                → [persona]
 *   POST  /business/employees  { ... }       → persona (reused = la cuenta ya existía)
 *   PATCH /business/employees/:userId { active }   /   DELETE /business/employees/:userId
 */
import { http } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/businesses.js').then((m) => m.businessesApi);

export const businessService = {
  /** Página pública del negocio (no requiere sesión). Indica si la cuenta ya es miembro. */
  getPublic: (slug) => send({
    mock: async () => (await mocks()).getPublic(slug),
    api: () => http.get(`/businesses/${encodeURIComponent(slug)}/public`),
  }),

  /** Catálogo público de recompensas (landing). */
  publicRewards: (slug) => send({
    mock: async () => (await mocks()).publicRewards(slug),
    api: () => http.get(`/businesses/${encodeURIComponent(slug)}/rewards`),
    ms: 0,
  }),

  /** Negocio del panel activo con niveles, recompensas y contadores. */
  getMine: () => send({
    mock: async () => (await mocks()).mine(),
    api: () => http.get('/business'),
  }),

  /** Guarda cambios parciales de configuración. Devuelve el negocio actualizado. */
  update: (partial) => send({
    mock: async () => (await mocks()).update(partial),
    api: () => http.patch('/business', partial),
    write: true,
  }),

  /** Reemplaza la lista de niveles del negocio (nombres, umbrales, multiplicador, beneficios). */
  saveLevels: (levels) => send({
    mock: async () => (await mocks()).saveLevels(levels),
    api: () => http.put('/business/levels', levels),
    write: true,
  }),

  /** Marca un paso de la configuración inicial: status 'done' | 'skipped'. */
  setOnboardingStep: (step, status = 'done') => send({
    mock: async () => (await mocks()).setOnboardingStep(step, status),
    api: () => http.patch('/business/onboarding', { step, status }),
    write: true, ms: 120,
  }),

  /** Oculta la guía de configuración del dashboard. */
  dismissOnboarding: () => send({
    mock: async () => (await mocks()).dismissOnboarding(),
    api: () => http.post('/business/onboarding/dismiss'),
    write: true, ms: 120,
  }),

  /**
   * Envía la solicitud de alta a revisión del Superadmin (o la reenvía después de
   * un rechazo). El negocio empieza a operar recién cuando la aprueban.
   */
  submitForReview: () => send({
    mock: async () => (await mocks()).submitForReview(),
    api: () => http.post('/business/submit-review'),
    write: true,
  }),

  getEmployees: () => send({
    mock: async () => (await mocks()).employees(),
    api: () => http.get('/business/employees'),
  }),

  /** Alta de un empleado. Si el email ya tiene cuenta de GO Puntos, se reutiliza (una sola cuenta por persona). */
  createEmployee: (data) => send({
    mock: async () => (await mocks()).createEmployee(data),
    api: () => http.post('/business/employees', data),
    write: true,
  }),

  setEmployeeActive: (userId, active) => send({
    mock: async () => (await mocks()).setEmployeeActive(userId, active),
    api: () => http.patch(`/business/employees/${userId}`, { active }),
    write: true,
  }),

  /** Quita el rol de empleado en este negocio. La cuenta de la persona sigue existiendo. */
  removeEmployee: (userId) => send({
    mock: async () => (await mocks()).removeEmployee(userId),
    api: () => http.del(`/business/employees/${userId}`),
    write: true,
  }),
};
