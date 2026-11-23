<!--
  Configuración · Niveles (regla mensual): los puntos que el cliente suma
  con compras en un mes definen su nivel del mes siguiente (no el saldo).
  Se pueden renombrar, cambiar umbrales, multiplicador, insignia, color,
  descripción y beneficios; agregar, quitar y reordenar.
-->
<script setup>
import { ref } from 'vue';
import { LEVEL_COLORS, LEVEL_ICONS } from '../../config/catalogs.js';
import { levels as Levels } from '../../domain/levels.js';
import { toast } from '../../composables/useToast.js';
import { businessService } from '../../services/businessService.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import LevelBadge from '../loyalty/LevelBadge.vue';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
/** Copia editable de los niveles (los beneficios se editan uno por línea). */
const items = ref(Levels.sorted(props.ctx.levels).map((l) => ({ ...l, benefitsText: (l.benefits || []).join('\n') })));
const alert = ref(null);
const iconOptions = LEVEL_ICONS.map((x) => ({ value: x, label: x }));
const colorOptions = Object.entries(LEVEL_COLORS).map(([value, c]) => ({ value, label: c.label }));

function add() {
  const last = items.value[items.value.length - 1];
  items.value.push({ id: null, name: 'Nuevo nivel', minPoints: (last?.minPoints || 0) + 1000, multiplier: 1, icon: 'star', color: 'platino', description: '', benefitsText: '' });
}
function remove(i) {
  if (items.value.length === 1) { toast('El programa necesita al menos un nivel.', 'error'); return; }
  items.value.splice(i, 1);
}
/** Mover cambia el orden: se intercambian los puntos para que sigan siendo crecientes. */
function move(i, dir) {
  const j = i + dir;
  const list = items.value;
  if (j < 0 || j >= list.length) return;
  [list[i].minPoints, list[j].minPoints] = [list[j].minPoints, list[i].minPoints];
  [list[i], list[j]] = [list[j], list[i]];
}

async function save() {
  alert.value = null;
  try {
    return await businessService.saveLevels(items.value.map(({ benefitsText, ...l }) => ({
      ...l, minPoints: Number(l.minPoints) || 0, multiplier: Number(l.multiplier) || 1,
      benefits: String(benefitsText || '').split('\n').map((x) => x.trim()).filter(Boolean),
    })));
  } catch (err) {
    alert.value = { tone: 'error', title: 'No pudimos guardar', text: err.message };
    err.handled = true;
    throw err;
  }
}
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="alert" v-bind="alert" /></div>
  <ol class="stack">
    <li v-for="(l, i) in items" :key="i" class="level-edit">
      <div class="level-edit__head">
        <!-- Insignia en vivo -->
        <span class="level-edit__badge"><LevelBadge :level="l" /></span>
        <div class="level-edit__order">
          <button type="button" class="icon-btn icon-btn--sm" aria-label="Subir" @click="move(i, -1)"><BaseIcon name="chevron-up" :size="16" /></button>
          <button type="button" class="icon-btn icon-btn--sm" aria-label="Bajar" @click="move(i, 1)"><BaseIcon name="chevron-down" :size="16" /></button>
          <button type="button" class="icon-btn icon-btn--sm" aria-label="Eliminar nivel" @click="remove(i)"><BaseIcon name="trash-2" :size="16" /></button>
        </div>
      </div>
      <div class="form-grid form-grid--3">
        <BaseField v-model="l.name" :id-prefix="`nv${i}`" name="name" label="Nombre" field-class="field--compact" />
        <BaseField v-model="l.minPoints" :id-prefix="`nv${i}`" name="minPoints" label="Puntos del mes" type="number" min="0" suffix="pts" field-class="field--compact" />
        <BaseField v-model="l.multiplier" :id-prefix="`nv${i}`" name="multiplier" label="Multiplicador" type="number" min="1" step="0.05" hint="1,25 = 25% más" field-class="field--compact" />
        <BaseField v-model="l.icon" :id-prefix="`nv${i}`" name="icon" label="Insignia" type="select" :options="iconOptions" field-class="field--compact" />
        <BaseField v-model="l.color" :id-prefix="`nv${i}`" name="color" label="Color" type="select" :options="colorOptions" field-class="field--compact" />
        <BaseField v-model="l.description" :id-prefix="`nv${i}`" name="description" label="Descripción" field-class="field--compact" />
      </div>
      <BaseField v-model="l.benefitsText" :id-prefix="`nv${i}`" name="benefits" label="Beneficios (uno por línea)" type="textarea" rows="2" />
    </li>
  </ol>
  <button type="button" class="btn btn--outline btn--sm" style="margin-top: var(--sp-3)" @click="add"><BaseIcon name="plus" :size="16" /> Agregar nivel</button>
  <!-- Explicación de la regla mensual -->
  <div class="card" style="margin-top: var(--sp-4)">
    <p class="small muted">
      <BaseIcon name="calendar-range" :size="14" /> <b>Cómo funciona:</b> si en septiembre un cliente suma 4.300 puntos, en octubre es Oro
      (con sus beneficios) mientras acumula para noviembre. Si en octubre suma 2.100, en noviembre empieza como Plata.
      Los clientes nuevos arrancan en el primer nivel. Premios, bonificaciones y ajustes no cuentan: sólo las compras.
    </p>
  </div>
</template>
