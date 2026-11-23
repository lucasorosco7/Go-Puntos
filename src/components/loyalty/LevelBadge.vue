<!--
  Insignia de nivel (Bronce, Plata, Oro o los que defina el negocio).
  Los colores salen de la configuración del nivel (domain/levels.js → colors).
-->
<script setup>
import { computed } from 'vue';
import { levels as Levels } from '../../domain/levels.js';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({
  level: { type: Object, default: null },
  /** 'sm' | 'md' | 'lg' */
  size: { type: String, default: 'md' },
  /** false = sólo el ícono. */
  showLabel: { type: Boolean, default: true },
});
const style = computed(() => {
  const c = Levels.colors(props.level || {});
  return { '--lv-bg': c.bg, '--lv-ink': c.ink, '--lv-dot': c.dot };
});
</script>

<template>
  <span v-if="level" class="level-badge" :class="`level-badge--${size}`" :style="style">
    <BaseIcon :name="level.icon || 'medal'" :size="size === 'lg' ? 18 : 13" /><span v-if="showLabel">{{ level.name }}</span>
  </span>
</template>
