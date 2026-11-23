<!--
  Lector de códigos de la Caja (QR personal del cliente o código de canje).
  Hoy la lectura es SIMULADA: se escribe el código o se elige un ejemplo.
  Usa qrService.createReader(): cuando el lector real (cámara) esté
  disponible, este componente mostrará la cámara sin cambiar a quien lo usa.
-->
<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { qrService } from '../../services/qrService.js';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import BaseSheet from '../base/BaseSheet.vue';

const props = defineProps({
  title: { type: String, required: true },
  placeholder: { type: String, default: '' },
  /** Ejemplos para simular la lectura: [{ code, label }] */
  suggestions: { type: Array, default: () => [] },
  /** async (código) => void. Si lanza un error, se muestra en el campo. */
  submit: { type: Function, required: true },
});
const emit = defineEmits(['close']);
const sheet = ref(null);
const code = ref('');
const error = ref('');
const busy = ref(false);
const reader = qrService.createReader();

async function go(value) {
  if (!String(value).trim()) { error.value = 'Escribí o escaneá un código.'; return; }
  busy.value = true;
  try {
    await props.submit(String(value).trim());
    sheet.value.close();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  if (reader.supported) reader.start((text) => go(text));
  await nextTick();
  setTimeout(() => document.getElementById('scan-code')?.focus(), 50);
});
</script>

<template>
  <BaseSheet ref="sheet" :title="title" description="Apuntá la cámara al código. En esta maqueta podés escribirlo o elegir un ejemplo." @close="reader.stop(); emit('close')">
    <!-- Visor de la cámara (simulado) -->
    <div class="scanner" aria-hidden="true"><BaseIcon name="scan-line" :size="40" /></div>
    <form class="stack" novalidate @submit.prevent="go(code)">
      <BaseField
        v-model="code" id-prefix="scan" name="code" label="Código" :placeholder="placeholder" icon="hash" :error="error"
        autocomplete="off" autocapitalize="characters" @update:model-value="error = ''"
      />
      <BaseButton type="submit" block :loading="busy" loading-text="Buscando">Buscar</BaseButton>
    </form>
    <!-- Ejemplos para simular una lectura -->
    <template v-if="suggestions.length">
      <p class="group-title">Simular lectura</p>
      <div class="check-list">
        <button v-for="x in suggestions" :key="x.code" type="button" class="chip" @click="go(x.code)">{{ x.label }}</button>
      </div>
    </template>
  </BaseSheet>
</template>
