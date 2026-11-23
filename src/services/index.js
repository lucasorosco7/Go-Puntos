/**
 * Índice de la capa de services de GO Puntos.
 *
 * Es la ÚNICA puerta de entrada a los datos: stores, composables y vistas
 * importan desde aquí. Ningún componente accede a localStorage, a los mocks
 * ni a endpoints directamente.
 */
export { authService } from './authService.js';
export { businessService } from './businessService.js';
export { customerService } from './customerService.js';
export { pointsService } from './pointsService.js';
export { rewardService } from './rewardService.js';
export { offerService } from './offerService.js';
export { rankingService } from './rankingService.js';
export { challengeService } from './challengeService.js';
export { campaignService } from './campaignService.js';
export { notificationService } from './notificationService.js';
export { metricsService, METRIC_RANGES } from './metricsService.js';
export { pushService } from './pushService.js';
export { qrService, QR_PREFIX } from './qrService.js';
export { platformService } from './platformService.js';
export { ApiError } from './errors.js';
