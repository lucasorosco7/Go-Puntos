<!--
  Región de avisos breves (toasts). Se monta una sola vez en App.vue.
-->
<script setup>
import { useToast } from '../../composables/useToast.js';
import BaseIcon from './BaseIcon.vue';

const { toasts, dismissToast } = useToast();
</script>

<template>
  <div class="toast-region" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.tone}`" role="status">
      <BaseIcon :name="t.tone === 'error' ? 'circle-alert' : 'circle-check'" :size="18" />
      <span>{{ t.message }}</span>
      <button type="button" class="toast__close" aria-label="Cerrar aviso" @click="dismissToast(t.id)"><BaseIcon name="x" :size="16" /></button>
    </div>
  </div>
</template>
