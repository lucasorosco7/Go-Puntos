<!--
  Identidad del negocio: el logo que subió o, si no tiene, un monograma
  con el ícono elegido, pintado con los colores de su paleta.
-->
<script setup>
import { computed } from 'vue';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({
  /** Negocio (usa logo y logoIcon). */
  business: { type: Object, default: null },
  size: { type: Number, default: 40 },
});
const radius = computed(() => `${Math.round(props.size * 0.3)}px`);
</script>

<template>
  <img v-if="business?.logo" class="biz-logo" :src="business.logo" alt="" :width="size" :height="size" :style="{ borderRadius: radius }" />
  <span v-else class="biz-logo biz-logo--mono" :style="{ width: `${size}px`, height: `${size}px`, borderRadius: radius }" aria-hidden="true">
    <BaseIcon :name="business?.logoIcon || 'store'" :size="Math.round(size * 0.5)" />
  </span>
</template>
