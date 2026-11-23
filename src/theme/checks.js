/**
 * Controles de legibilidad de una paleta (WCAG 2.1).
 *
 * Es la ÚNICA lista de combinaciones texto/fondo que usa la interfaz: la
 * usan las pruebas (tests/paletas.test.js), el generador de paletas
 * personalizadas (para ajustar los colores) y la pantalla de
 * Personalización (para mostrar qué se verificó).
 */
import { contrast } from './color.js';

/**
 * Controles en modo claro.
 * @param {object} b  tokens base de la paleta
 * @param {object} v  variante de acento
 * @returns {{ label, ratio, min, ok }[]}
 */
export function lightChecks(b, v) {
  return [
    ['Texto blanco sobre botón', '#ffffff', b.primary, 4.5],
    ['Texto blanco sobre hover', '#ffffff', b.hover, 4.5],
    ['Texto sobre botón de acento', b.deep, v.accent, 4.5],
    ['Etiqueta de acento', v.accentInk, v.accentSoft, 4.5],
    ['Texto de acento sobre blanco', v.accentInk, '#ffffff', 4.5],
    ['Etiqueta de marca', b.primary, b.soft2, 4.5],
    ['Texto positivo sobre blanco', b.hover, '#ffffff', 4.5],
    ['Texto principal sobre fondo', b.text, b.bg, 7],
    ['Texto secundario sobre fondo', b.textMuted, b.bg, 4.5],
    ['Texto secundario sobre tarjeta', b.textMuted, '#ffffff', 4.5],
    ['Texto tenue sobre tarjeta', b.textSubtle, '#ffffff', 3],
    ['Texto claro sobre tarjeta de puntos', b.onDark, b.primary, 4.5],
    ['Texto claro sobre degradé oscuro', b.onDarkSoft, b.gradA, 3],
    ['Blanco sobre fondo profundo', '#ffffff', b.deep, 7],
  ].map(toCheck);
}

/**
 * Controles en modo oscuro (sobre los tokens ya calculados para ese modo).
 * @param {object} t  tokens del modo oscuro (ver darkMode.js)
 */
export function darkChecks(t) {
  return [
    ['Texto principal sobre fondo', t.text, t.bg, 7],
    ['Texto principal sobre tarjeta', t.text, t.surface, 7],
    ['Texto secundario sobre tarjeta', t.textMuted, t.surface, 4.5],
    ['Texto tenue sobre tarjeta', t.textSubtle, t.surface, 3],
    ['Texto de marca sobre tarjeta', t.primary, t.surface, 4.5],
    ['Texto sobre botón principal', t.onPrimary, t.primary, 4.5],
    ['Texto sobre botón hover', t.onPrimary, t.hover, 4.5],
    ['Etiqueta de marca', t.primary, t.soft2, 4.5],
    ['Etiqueta de acento', t.accentInk, t.accentSoft, 4.5],
    ['Texto sobre botón de acento', t.deep, t.accent, 4.5],
    ['Texto de error sobre tarjeta', t.danger, t.surface, 4.5],
  ].map(toCheck);
}

function toCheck([label, fg, bg, min]) {
  const ratio = contrast(fg, bg);
  return { label, ratio: Math.round(ratio * 100) / 100, min, ok: ratio >= min };
}
