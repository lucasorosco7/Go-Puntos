/**
 * Aplicación de la paleta y del modo (claro / oscuro) a la interfaz.
 *
 * Dos datos independientes:
 *   - la PALETA es del negocio (prediseñada o personalizada);
 *   - el MODO es de cada persona: 'claro', 'oscuro' o 'auto' (sigue al
 *     sistema operativo). Se guarda en su cuenta y acá se recuerda en el
 *     navegador para pintarlo antes de que cargue Vue.
 *
 * Funciones:
 *   applyBusinessTheme(business)  paleta del negocio activo (app o panel)
 *   setThemeMode(mode)            modo elegido por la persona
 *   previewTheme(business)        paleta de un negocio sin recordarla (página pública del QR)
 *   resetTheme({ forget })        identidad de GO Puntos en claro (sitio público e ingreso)
 *   restoreTheme()                vuelve a aplicar lo último recordado (pantallas privadas)
 *
 * Es infraestructura de interfaz: guarda sólo variables de color y la
 * preferencia de modo, nunca datos del negocio ni del cliente.
 */
import { DEFAULT_PALETTE, paletteVars } from './palettes.js';

const STORAGE_KEY = 'gopuntos:tema';
const MODE_KEY = 'gopuntos:modo';
export const THEME_MODES = { claro: 'Claro', oscuro: 'Oscuro', auto: 'Automático' };

/** Negocio cuya paleta está aplicada (para re-aplicarla al cambiar de modo). */
let currentBusiness = null;
let mode = readMode();

function readMode() {
  try { return THEME_MODES[localStorage.getItem(MODE_KEY)] ? localStorage.getItem(MODE_KEY) : 'claro'; } catch { return 'claro'; }
}

/** 'auto' → lo que pide el sistema operativo en este momento. */
export function effectiveMode(m = mode) {
  if (m !== 'auto') return m;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

/** Modo elegido por la persona ('claro' | 'oscuro' | 'auto'). */
export const getThemeMode = () => mode;

function setVars(map) {
  const root = document.documentElement;
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.mode = effectiveMode();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', map['--bg']);
}

function varsFor(business, m = effectiveMode()) {
  const b = business || { paletteId: DEFAULT_PALETTE.paletteId, paletteVariant: DEFAULT_PALETTE.variantId };
  return paletteVars(b.paletteId, b.paletteVariant, { custom: b.customPalette, mode: m });
}

function render({ remember = true } = {}) {
  const map = varsFor(currentBusiness);
  setVars(map);
  if (remember) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* sin almacenamiento */ } }
}

/** Aplica la paleta de un negocio (o la de GO Puntos si no hay negocio) en el modo de la persona. */
export function applyBusinessTheme(business) {
  currentBusiness = business || null;
  render();
}

/** Cambia el modo de la persona y lo vuelve a aplicar. */
export function setThemeMode(next) {
  mode = THEME_MODES[next] ? next : 'claro';
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* sin almacenamiento */ }
  if (document.documentElement.dataset.theme !== 'default') render();
}

/** Aplica la paleta de un negocio sin recordarla (página pública del QR). */
export function previewTheme(business) {
  setVars(varsFor(business));
}

/** Quita la paleta del negocio: vuelven los valores de tokens.css (claro). */
export function resetTheme({ forget = false } = {}) {
  const root = document.documentElement;
  Object.keys(varsFor(null, 'claro')).forEach((k) => root.style.removeProperty(k));
  root.dataset.mode = 'claro';
  root.dataset.theme = 'default';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#1F4D3A');
  if (forget) {
    currentBusiness = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nada */ }
  }
}

/** Vuelve a aplicar la última paleta (en el modo actual) al entrar a una pantalla privada. */
export function restoreTheme() {
  delete document.documentElement.dataset.theme;
  if (currentBusiness) { render(); return; }
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (map) setVars(map);
    else render();
  } catch { render(); }
}

// En modo automático, si el sistema cambia de claro a oscuro se vuelve a pintar
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (mode === 'auto' && document.documentElement.dataset.theme !== 'default') render();
  });
}
