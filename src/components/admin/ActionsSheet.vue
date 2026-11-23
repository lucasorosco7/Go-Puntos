<!--
  Menú de acciones de una fila del panel (editar, pausar, eliminar…).
  Se abre como hoja: sirve igual en celular y en escritorio.
  actions: [{ label, icon, hint?, tone?: 'danger', run() }]
-->
<script setup>
import BaseIcon from '../base/BaseIcon.vue';
import BaseSheet from '../base/BaseSheet.vue';

defineProps({
  title: { type: String, required: true },
  actions: { type: Array, required: true },
});
const emit = defineEmits(['close']);

function pick(a, close) {
  close();
  a.run();
}
</script>

<template>
  <BaseSheet :title="title" @close="emit('close')">
    <template #default="{ close }">
      <div class="stack">
        <button
          v-for="(a, i) in actions" :key="i" type="button" class="row action-row" :class="{ 'is-danger': a.tone === 'danger' }"
          @click="pick(a, close)"
        >
          <BaseIcon :name="a.icon" :size="19" />
          <span class="row__body">
            <span class="row__title">{{ a.label }}</span>
            <span v-if="a.hint" class="small muted">{{ a.hint }}</span>
          </span>
        </button>
      </div>
    </template>
  </BaseSheet>
</template>
