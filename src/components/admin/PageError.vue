<!--
  Error al cargar una página, con botón "Reintentar" (emite "retry").
-->
<script setup>
import BaseAlert from '../base/BaseAlert.vue';

defineProps({
  title: { type: String, required: true },
  error: { type: Object, default: null },
});
const emit = defineEmits(['retry']);
</script>

<template>
  <div>
    <BaseAlert tone="error" :title="title" :text="error?.message || ''" />
    <button type="button" class="btn btn--outline" style="margin-top: var(--sp-3)" @click="emit('retry')">Reintentar</button>
  </div>
</template>
