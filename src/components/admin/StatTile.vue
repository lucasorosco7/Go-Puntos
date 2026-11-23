<!--
  Indicador (KPI) del panel: etiqueta con ícono, valor y aclaración.
-->
<script setup>
import BaseIcon from '../base/BaseIcon.vue';

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  icon: { type: String, default: '' },
  /** '' | 'accent' */
  tone: { type: String, default: '' },
  /** Valor en letra más chica (textos largos como el premio del mes). */
  compact: Boolean,
});
</script>

<template>
  <div class="stat" :class="tone ? `stat--${tone}` : ''">
    <p class="stat__label"><BaseIcon v-if="icon" :name="icon" :size="15" />{{ label }}</p>
    <p class="stat__value tabular"><span v-if="compact" style="font-size: var(--fs-md)">{{ value }}</span><template v-else>{{ value }}</template></p>
    <p v-if="hint || $slots.hint" class="stat__hint"><slot name="hint">{{ hint }}</slot></p>
  </div>
</template>
