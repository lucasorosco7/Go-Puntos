<!--
  Etiqueta de estado a partir de { label, tone } (ej.: "Activa" en verde).
-->
<script setup>
import BaseIcon from './BaseIcon.vue';

defineProps({
  /** { label, tone } — tone: green | honey | sky | danger | '' */
  meta: { type: Object, default: null },
  icon: { type: String, default: '' },
});
</script>

<template>
  <span class="pill" :class="meta?.tone ? `pill--${meta.tone}` : ''">
    <BaseIcon v-if="icon" :name="icon" :size="12" />{{ meta?.label || '' }}
  </span>
</template>
