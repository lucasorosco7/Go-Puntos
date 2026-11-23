<!--
  Selector de imagen (logo del negocio, imagen de recompensa u oferta).
  La achica en el navegador y la devuelve como dataURL por v-model.
  Con el backend: subir el archivo (POST /uploads) y guardar la URL.
-->
<script setup>
import { ref } from 'vue';
import { resizeImage } from '../../composables/useImageResize.js';
import { toast } from '../../composables/useToast.js';
import BaseIcon from './BaseIcon.vue';

const model = defineModel({ type: [String, null], default: null });
const props = defineProps({
  name: { type: String, default: 'image' },
  label: { type: String, default: 'Imagen' },
  hint: { type: String, default: 'JPG o PNG. Se ajusta automáticamente.' },
  maxSize: { type: Number, default: 320 },
});
const input = ref(null);

async function onChange() {
  const file = input.value?.files?.[0];
  if (!file) return;
  try { model.value = await resizeImage(file, props.maxSize); } catch (err) { toast(err.message, 'error'); }
  input.value.value = '';
}
</script>

<template>
  <div class="field" :data-field="name">
    <span class="field__label">{{ label }}</span>
    <div class="picker">
      <!-- Vista previa o ícono si todavía no hay imagen -->
      <span class="picker__preview">
        <img v-if="model" :src="model" alt="" />
        <BaseIcon v-else name="image-plus" :size="22" />
      </span>
      <div class="picker__actions">
        <label class="btn btn--outline btn--sm">
          <BaseIcon name="upload" :size="16" /> Elegir imagen
          <input ref="input" type="file" accept="image/*" class="sr-only" @change="onChange" />
        </label>
        <button v-if="model" type="button" class="btn btn--ghost btn--sm" @click="model = null">Quitar</button>
        <p class="field__hint">{{ hint }}</p>
      </div>
    </div>
  </div>
</template>
