/**
 * Servicio de métricas del dashboard de GO Puntos.
 *
 * Rangos: hoy, semana (últimos 7 días), mes (período actual) e histórico.
 * Devuelve KPIs (clientes activos, nuevos, compras, facturación registrada,
 * puntos otorgados y canjeados, recompensas canjeadas, recurrencia,
 * desafíos), series para el gráfico, distribución por nivel y segmentos,
 * Top 5 del ranking y actividad reciente.
 *
 * Endpoint previsto: GET /admin/metrics?range=hoy|semana|mes|historico
 * En producción estos números salen de consultas de agregación del backend.
 */
import { http, qs } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/metrics.js').then((m) => m.metricsApi);

/** Rangos disponibles para el selector del dashboard. */
export const METRIC_RANGES = { hoy: 'Hoy', semana: 'Últimos 7 días', mes: 'Este mes', historico: 'Histórico' };

export const metricsService = {
  getDashboard: (range = 'mes') => send({
    mock: async () => (await mocks()).dashboard(range),
    api: () => http.get(`/admin/metrics${qs({ range })}`),
  }),
};
