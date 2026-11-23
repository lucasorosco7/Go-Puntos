<!--
  Barra de progreso accesible (role="progressbar").
  value: de 0 a 1. Las variantes (bar--honey, bar--level, bar--onDark)
  llegan por "mod".
-->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 },
  label: { type: String, required: true },
  mod: { type: String, default: '' },
});
const pct = computed(() => Math.round(Math.max(0, Math.min(1, props.value || 0)) * 100));
</script>

<template>
  <div class="bar" :class="mod" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct" :aria-label="label">
    <i :style="{ width: `${pct}%` }"></i>
  </div>
</template>
