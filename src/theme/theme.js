/**
 * Aplicación de la paleta del negocio a la interfaz.
 *
 * - applyBusinessTheme(): aplica la paleta del negocio activo a toda la app
 *   y la recuerda para el próximo arranque (así no "parpadea" el verde por
 *   defecto antes de que lleguen los datos). El script de index.html la
 *   vuelve a aplicar antes de montar Vue.
 * - previewTheme(): aplica una paleta sin recordarla (página pública de un negocio).
 * - resetTheme(): vuelve a la identidad de GO Puntos (sitio público y login).
 *
 * Es infraestructura de interfaz: guarda sólo variables de color, nunca
 * datos del negocio ni del cliente.
 */
import { paletteVars } from './palettes.js';

const STORAGE_KEY = 'gopuntos:tema';

function setVars(map) {
  const root = document.documentElement;
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', map['--forest']);
}

/** Aplica la paleta de un negocio (o la de GO Puntos si no hay negocio). */
export function applyBusinessTheme(business) {
  if (!business) { resetTheme(); return; }
  const map = paletteVars(business.paletteId, business.paletteVariant);
  setVars(map);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* navegador sin almacenamiento */ }
}

/** Aplica una paleta sin recordarla. */
export function previewTheme(paletteId, variantId) {
  setVars(paletteVars(paletteId, variantId));
}

/** Quita la paleta del negocio: vuelven los valores de tokens.css. */
export function resetTheme({ forget = false } = {}) {
  const root = document.documentElement;
  Object.keys(paletteVars('bosque', 'miel')).forEach((k) => root.style.removeProperty(k));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#1F4D3A');
  if (forget) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* nada */ } }
}

/** Aplica la última paleta recordada (se llama al iniciar la app en pantallas privadas). */
export function restoreTheme() {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (map) setVars(map);
  } catch { /* datos dañados: queda la paleta por defecto */ }
}
