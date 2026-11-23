/**
 * Genera src/components/base/icons.js: el registro explícito de íconos de
 * Lucide que usa BaseIcon.vue.
 *
 * Por qué existe: la app usa los nombres de Lucide en kebab-case (igual que
 * la maqueta: "gift", "shield-check") y algunos llegan como datos (el ícono
 * del nivel o del negocio). Importar sólo los que aparecen en el código
 * mantiene el bundle chico.
 *
 * Cómo funciona: recorre src/ buscando textos entre comillas con forma de
 * nombre de ícono y se queda con los que existen en lucide-vue-next.
 *
 * Uso:  npm run iconos   (después de agregar íconos nuevos)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/components/base/icons.js');
const lucidePath = process.env.LUCIDE_PATH || 'lucide-vue-next';
const lucide = await import(lucidePath);

const pascal = (s) => s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(vue|js)$/.test(f.name) && p !== OUT) files.push(p);
  }
})(path.join(ROOT, 'src'));

const names = new Set(['circle']); // "circle" es el ícono de respaldo de BaseIcon
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/['"`]([a-z][a-z0-9]*(?:-[a-z0-9]+)*)['"`]/g)) names.add(m[1]);
}
const found = [...names].filter((n) => lucide[pascal(n)] && lucide[`${pascal(n)}Icon`]).sort();

const lines = [
  '/**',
  ' * Registro de íconos de Lucide usados por GO Puntos (nombre kebab-case → componente).',
  ' * ARCHIVO GENERADO por tools/generar-iconos.mjs: no editar a mano, ejecutar "npm run iconos".',
  ' */',
  'import {',
  ...found.map((n) => `  ${pascal(n)},`),
  "} from 'lucide-vue-next';",
  '',
  'export const icons = {',
  ...found.map((n) => `  '${n}': ${pascal(n)},`),
  '};',
  '',
];
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`icons.js: ${found.length} íconos registrados.`);
