/**
 * Utilidades de color de GO Puntos (funciones puras, sin Vue).
 *
 * Las usan el generador de paletas personalizadas, el modo oscuro y las
 * pruebas de contraste. Trabajan con colores hexadecimales "#rrggbb".
 * El contraste sigue la fórmula de WCAG 2.1.
 */

/** "#abc" o "#aabbcc" → [r, g, b] (0-255). */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** [r, g, b] → "#rrggbb" */
export function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** ¿Es un color hexadecimal válido? */
export const isHex = (value) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

/** Normaliza a "#rrggbb" en minúsculas. */
export const normalizeHex = (value) => rgbToHex(hexToRgb(value));

/** Mezcla dos colores: t = 0 → a, t = 1 → b. */
export function mix(a, b, t) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** Luminancia relativa (WCAG). */
export function luminance(hex) {
  const c = hexToRgb(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Relación de contraste entre dos colores (1 a 21). */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Oscurece (hacia negro) o aclara (hacia blanco) un color de a poco hasta
 * que cumpla la condición. Devuelve el primer color que la cumple (o el
 * extremo, si ninguno lo hace).
 */
export function adjustUntil(hex, test, direction = 'darken', step = 0.04) {
  const target = direction === 'darken' ? '#000000' : '#ffffff';
  for (let t = 0; t <= 1.0001; t += step) {
    const c = mix(hex, target, t);
    if (test(c)) return c;
  }
  return target;
}

/** "r g b" para usar en rgb(var(--shadow-rgb) / .2) */
export const rgbTriplet = (hex) => hexToRgb(hex).join(' ');
