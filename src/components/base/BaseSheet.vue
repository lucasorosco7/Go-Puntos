<!--
  Hoja inferior / modal de GO Puntos.
  Usa <dialog>: el navegador ya resuelve el foco atrapado y la tecla Escape.
  Se abre al montarse: el padre la muestra con v-if y recibe "close" cuando
  la persona la cierra (botón X, clic afuera, Escape o close() del slot).
  size: 'md' (por defecto) o 'lg' para formularios del panel.
-->
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import BaseIcon from './BaseIcon.vue';

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
});
const emit = defineEmits(['close']);
const dialog = ref(null);

function close() {
  if (dialog.value?.open) dialog.value.close();
}
function onClick(e) {
  // Clic en el fondo oscuro (fuera de la caja) cierra la hoja
  if (e.target === dialog.value) close();
}

onMounted(() => dialog.value?.showModal());
onBeforeUnmount(() => close());
defineExpose({ close });
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="sheet" :class="`sheet--${props.size}`" :aria-label="title" @close="emit('close')" @click="onClick">
      <div class="sheet__box">
        <div class="sheet__grab" aria-hidden="true"></div>
        <button type="button" class="sheet__x" aria-label="Cerrar" @click="close"><BaseIcon name="x" :size="18" /></button>
        <h2 class="sheet__title">{{ title }}</h2>
        <p v-if="description" class="sheet__desc">{{ description }}</p>
        <!-- Contenido de la hoja -->
        <div class="sheet__body"><slot :close="close" /></div>
        <!-- Botones de acción -->
        <div v-if="$slots.actions" class="sheet__actions"><slot name="actions" :close="close" /></div>
      </div>
    </dialog>
  </Teleport>
</template>
