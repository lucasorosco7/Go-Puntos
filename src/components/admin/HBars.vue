<!--
  Barras horizontales para distribuciones (clientes por nivel,
  recompensas más canjeadas, rachas por duración).
  items: [{ label, value, key? }] · El slot "label" permite poner una insignia.
-->
<script setup>
import { computed } from 'vue';
import { format } from '../../utils/format.js';

const props = defineProps({
  items: { type: Array, required: true },
  fmt: { type: Function, default: (v) => format.points(v) },
  /** Total para los porcentajes; 0 = no mostrar porcentaje. */
  total: { type: Number, default: null },
});
const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)));
const sum = computed(() => props.total ?? props.items.reduce((a, i) => a + i.value, 0));
</script>

<template>
  <ul class="hbars">
    <li v-for="(i, n) in items" :key="i.key ?? n" class="hbars__row">
      <span class="hbars__label"><slot name="label" :item="i">{{ i.label }}</slot></span>
      <span class="hbars__track"><span class="hbars__fill" :style="{ width: `${(i.value / max) * 100}%` }"></span></span>
      <span class="hbars__value tabular">{{ fmt(i.value) }}<template v-if="sum">{{ ' ' }}<small>{{ format.percent(i.value / sum) }}</small></template></span>
    </li>
  </ul>
</template>
