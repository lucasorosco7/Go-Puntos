/**
 * Persistencia de los datos de prueba (sólo modo mock).
 *
 * Guarda en el navegador el estado del servidor simulado para que las
 * compras, canjes y cambios de configuración se mantengan entre recargas.
 * Si cambia la versión de los datos (appConfig.mockDataVersion) se
 * regeneran desde cero con buildSeed().
 *
 * No es una base de datos ni define su estructura: cuando exista el
 * backend, esta carpeta (src/mocks) se deja de usar.
 */
import { appConfig } from '../config/app.config.js';
import { buildSeed } from './seed.js';

const KEY = 'gopuntos:datos-simulados';
let state = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.version === appConfig.mockDataVersion) return saved;
  } catch { /* datos dañados: se regeneran */ }
  const fresh = buildSeed(new Date());
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch { /* sin espacio: queda en memoria */ }
  return fresh;
}

export const mockDb = {
  get() {
    if (!state) state = load();
    return state;
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin espacio */ }
  },
  /** Vuelve a generar todos los datos de prueba (botón "Restablecer datos de prueba"). */
  reset() {
    try { localStorage.removeItem(KEY); } catch { /* nada */ }
    state = null;
  },
};
