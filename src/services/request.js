/**
 * Punto único de despacho de los services de GO Puntos.
 *
 * Cada método de un service declara DOS formas de obtener el mismo dato:
 *   mock → handler del servidor simulado (src/mocks/api/*)
 *   api  → llamada HTTP a la futura API REST (src/services/http.js)
 *
 * Según appConfig.useMocks se usa una u otra. Los componentes y stores sólo
 * ven el resultado: la interfaz es idéntica en los dos modos, así que pasar a
 * la API real es cambiar VITE_USE_MOCKS=false y completar el backend.
 *
 * Los mocks se cargan con import() dinámico: cuando la app funciona contra la
 * API real, el código simulado ni siquiera se descarga.
 */
import { appConfig } from '../config/app.config.js';

/**
 * Ejecuta un pedido.
 * @param {object}   opts
 * @param {Function} opts.mock  async () => handler   (handler(state, server, ctx))
 * @param {Function} opts.api   () => Promise          (llamada real con http.*)
 * @param {boolean}  [opts.write=false]  el handler modifica datos (se guardan los mocks)
 * @param {number}   [opts.ms]           latencia simulada (sólo mocks)
 * @returns {Promise<any>} la respuesta ya lista para usar en la interfaz
 */
export async function send({ mock, api, write = false, ms }) {
  if (!appConfig.useMocks) return api();
  const [{ runMock }, handler] = await Promise.all([import('../mocks/adapter.js'), mock()]);
  return runMock(handler, { write, ...(ms !== undefined && { ms }) });
}

/** Espera simulada para operaciones que todavía no tienen lógica en el servidor simulado. */
export const wait = (ms = appConfig.mockLatencyMs) => new Promise((r) => setTimeout(r, ms));
