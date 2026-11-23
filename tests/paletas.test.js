/**
 * Prueba de contraste de las paletas (WCAG 2.1), en modo claro y oscuro.
 *
 * Cada combinación de texto y fondo que usa la interfaz debe alcanzar el
 * contraste mínimo (lista única en src/theme/checks.js):
 *   - en todas las paletas prediseñadas y sus variantes;
 *   - en el modo oscuro derivado de cada una;
 *   - en paletas personalizadas creadas con colores cualesquiera (el
 *     generador tiene que ajustarlas hasta que sean legibles).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { darkChecks, lightChecks } from '../src/theme/checks.js';
import { darkTokens } from '../src/theme/darkMode.js';
import { buildCustomPalette } from '../src/theme/paletteBuilder.js';
import { PALETTES, paletteVars } from '../src/theme/palettes.js';

const fallas = (checks) => checks.filter((c) => !c.ok).map((c) => `${c.label}: ${c.ratio} < ${c.min}`);

for (const p of PALETTES) {
  for (const v of p.variants) {
    test(`paleta ${p.name} / ${v.name}: modo claro`, () => {
      assert.deepEqual(fallas(lightChecks(p.base, v)), []);
    });
    test(`paleta ${p.name} / ${v.name}: modo oscuro`, () => {
      assert.deepEqual(fallas(darkChecks(darkTokens(p.base, v))), []);
    });
  }
}

test('paleta personalizada: cualquier par de colores termina siendo legible en claro y oscuro', () => {
  // Generador pseudoaleatorio con semilla fija: la prueba siempre usa los mismos colores
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed; };
  const color = () => `#${(rnd() & 0xffffff).toString(16).padStart(6, '0')}`;
  const extremos = [['#ffffff', '#ffffff'], ['#000000', '#000000'], ['#ffff00', '#00ffff'], ['#ff0000', '#00ff00']];
  const pares = [...extremos, ...Array.from({ length: 300 }, () => [color(), color()])];
  for (const [primary, accent] of pares) {
    const r = buildCustomPalette({ primary, accent });
    assert.deepEqual(fallas(r.checks), [], `claro ${primary} / ${accent}`);
    assert.deepEqual(fallas(darkChecks(darkTokens(r.palette.base, r.variant))), [], `oscuro ${primary} / ${accent}`);
  }
});

test('paleta personalizada: avisa cuando ajusta un color y no toca los que ya sirven', () => {
  const claro = buildCustomPalette({ primary: '#ffcc00', accent: '#e6a73a' });
  assert.ok(claro.adjustments.some((a) => a.includes('color principal')));
  const bien = buildCustomPalette({ primary: '#1f4d3a', accent: '#e6a73a' });
  assert.equal(bien.palette.base.primary, '#1f4d3a');
  assert.equal(bien.variant.accent, '#e6a73a');
});

test('paletteVars entrega los mismos tokens en claro y en oscuro', () => {
  const claro = paletteVars('bosque', 'miel');
  const oscuro = paletteVars('bosque', 'miel', { mode: 'oscuro' });
  assert.deepEqual(Object.keys(claro).sort(), Object.keys(oscuro).sort());
  assert.equal(claro['color-scheme'], 'light');
  assert.equal(oscuro['color-scheme'], 'dark');
  const custom = paletteVars('personalizada', 'propia', { custom: { primary: '#7b2cbf', accent: '#ffb703' } });
  assert.notEqual(custom['--forest'], claro['--forest']);
});
