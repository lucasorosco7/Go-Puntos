<!--
  Alerta de GO Puntos (error, éxito o información).
  Los errores se anuncian de inmediato (role="alert"); el resto, con cortesía.
-->
<script setup>
import { computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const props = defineProps({
  /** 'error' | 'success' | 'info' */
  tone: { type: String, default: 'info' },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
});
const iconName = computed(() => ({ error: 'circle-alert', success: 'circle-check', info: 'info' })[props.tone]);
</script>

<template>
  <div class="alert" :class="`alert--${tone}`" :role="tone === 'error' ? 'alert' : 'status'">
    <BaseIcon :name="iconName" :size="20" class="alert__icon" />
    <div>
      <p v-if="title" class="alert__title">{{ title }}</p>
      <p v-if="text">{{ text }}</p>
      <slot />
    </div>
  </div>
</template>
