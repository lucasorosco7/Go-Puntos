<!--
  Estado vacío: siempre dice qué hacer a continuación.
  La acción (botón o enlace) va en el slot "action".
-->
<script setup>
import BaseIcon from './BaseIcon.vue';

defineProps({
  icon: { type: String, default: 'inbox' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
});
</script>

<template>
  <div class="empty">
    <span class="empty__icon"><BaseIcon :name="icon" :size="24" /></span>
    <p style="font-weight: var(--fw-medium)">{{ title }}</p>
    <p v-if="text" class="muted small" style="max-width: 36ch">{{ text }}</p>
    <div v-if="$slots.action" class="empty__action"><slot name="action" /></div>
  </div>
</template>
