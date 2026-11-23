/**
 * Prueba de contraste de las paletas prediseñadas (WCAG 2.1).
 *
 * Cada combinación de texto y fondo que usa la interfaz debe alcanzar el
 * contraste mínimo, en todas las paletas y variantes. Si se agrega o se
 * modifica una paleta, esta prueba avisa si algún color no es legible.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES } from '../src/theme/palettes.js';

/** Luminancia relativa de un color hexadecimal (fórmula WCAG). */
const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

for (const p of PALETTES) {
  for (const v of p.variants) {
    test(`paleta ${p.name} / ${v.name}`, () => {
      const b = p.base;
      const checks = [
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
      ];
      for (const [label, fg, bg, min] of checks) {
        assert.ok(ratio(fg, bg) >= min, `${label}: ${ratio(fg, bg).toFixed(2)} < ${min}`);
      }
    });
  }
}
