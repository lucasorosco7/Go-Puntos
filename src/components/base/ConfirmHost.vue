<!--
  Hoja de confirmación global. Se monta una sola vez en App.vue y responde
  a confirm() de composables/useConfirm.js.
-->
<script setup>
import { ref } from 'vue';
import { useConfirm } from '../../composables/useConfirm.js';
import BaseSheet from './BaseSheet.vue';

const { current, answerConfirm } = useConfirm();
const accepted = ref(false);

/** Separa "texto **resaltado** texto" en partes para mostrar el resaltado en negrita. */
const parts = (text) => String(text).split(/\*\*(.+?)\*\*/g).map((t, i) => ({ t, b: i % 2 === 1 }));

function onClose() {
  answerConfirm(accepted.value);
  accepted.value = false;
}
</script>

<template>
  <BaseSheet v-if="current" :key="current.title" :title="current.title" :description="current.description" @close="onClose">
    <p v-if="current.body" class="muted">{{ current.body }}</p>
    <!-- Lista de consecuencias (ej.: qué pasa al cerrar el mes). Admite **negrita**. -->
    <ol v-if="current.items" class="small" style="display: grid; gap: 6px; list-style: decimal; padding-left: 18px; margin-top: var(--sp-2)">
      <li v-for="(item, i) in current.items" :key="i"><template v-for="(p, j) in parts(item)" :key="j"><b v-if="p.b">{{ p.t }}</b><template v-else>{{ p.t }}</template></template></li>
    </ol>
    <template #actions="{ close }">
      <button type="button" class="btn btn--lg btn--block" :class="{ 'btn--danger': current.tone === 'danger' }" @click="accepted = true; close()">{{ current.confirmText }}</button>
      <button type="button" class="btn btn--ghost btn--block" @click="close()">{{ current.cancelText }}</button>
    </template>
  </BaseSheet>
</template>
