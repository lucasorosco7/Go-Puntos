/**
 * Adaptador del modo mock: reemplaza al cliente HTTP.
 *
 * Los services llaman a runMock(handler) en lugar de http.get/post cuando
 * appConfig.useMocks = true. runMock simula lo que pasa en una llamada real:
 *   1. espera un poco (latencia de red) para ver los estados de carga;
 *   2. arma el "contexto del pedido" como lo recibiría la API:
 *      { userId (del token), businessId (encabezado X-Business-Id) };
 *   3. ejecuta el handler sobre los datos de prueba;
 *   4. guarda los cambios si el handler escribe;
 *   5. devuelve una COPIA de los datos (como un JSON de la API) y convierte
 *      los errores del servidor simulado en ApiError.
 */
import { appConfig } from '../config/app.config.js';
import { ApiError } from '../services/errors.js';
import { session } from '../services/session.js';
import { clone } from '../utils/helpers.js';
import { mockDb } from './db.js';
import { server, ServerError } from './server.js';

/** Contexto del pedido: quién llama y sobre qué negocio (igual que los encabezados HTTP). */
function requestContext() {
  const token = session.token();
  const userId = token && token.startsWith('mock-token-') ? Number(token.replace('mock-token-', '')) : null;
  return { userId, businessId: session.businessId() };
}

/**
 * Ejecuta un handler del servidor simulado.
 * handler(state, server, ctx) → datos de respuesta
 * opciones: write (guarda cambios), ms (latencia simulada)
 */
export async function runMock(handler, { write = false, ms = appConfig.mockLatencyMs } = {}) {
  if (ms) await new Promise((r) => setTimeout(r, ms));
  try {
    const result = handler(mockDb.get(), server, requestContext());
    if (write) mockDb.save();
    return clone(result ?? null);
  } catch (err) {
    if (err instanceof ServerError) throw new ApiError(err.message, err.status, err.details);
    throw err;
  }
}

export { mockDb };
