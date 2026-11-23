<!--
  Hoja para confirmar una acción del Superadmin que lleva motivo:
  rechazar una solicitud, suspender o bloquear un negocio, o aprobar con
  un comentario opcional. El motivo queda en la auditoría de la plataforma
  (auditoria_plataforma.detalle, hasta 500 caracteres) y, en los
  rechazos, también en solicitudes_negocio.motivo_revision.
  Emite "submit" con el texto; el padre hace el pedido y la cierra.
-->
<script setup>
import { computed, ref } from 'vue';
import { MIN_REASON, platform } from '../../domain/platform.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseSheet from '../base/BaseSheet.vue';

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** Texto informativo sobre las consecuencias de la acción. */
  help: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmar' },
  /** '' | 'danger' (botón rojo) */
  tone: { type: String, default: '' },
  /** El motivo es obligatorio (rechazar, suspender, bloquear). */
  required: { type: Boolean, default: true },
  label: { type: String, default: 'Motivo' },
  placeholder: { type: String, default: '' },
  /** true mientras el padre hace el pedido. */
  busy: Boolean,
  /** Error devuelto por el servidor (texto). */
  serverError: { type: String, default: '' },
});
const emit = defineEmits(['submit', 'close']);
const reason = ref('');
const touched = ref(false);
const error = computed(() => {
  if (!touched.value) return '';
  if (!props.required && !reason.value.trim()) return '';
  return platform.reasonError(reason.value);
});

function submit() {
  touched.value = true;
  if (error.value) return;
  emit('submit', reason.value.trim());
}
</script>

<template>
  <BaseSheet :title="title" :description="description" @close="emit('close')">
    <form novalidate class="reason-form" @submit.prevent="submit">
      <BaseAlert v-if="help" tone="info" :text="help" />
      <BaseAlert v-if="serverError" tone="error" :text="serverError" />
      <BaseField
        v-model="reason" name="reason" :label="required ? label : `${label} (opcional)`" type="textarea" :placeholder="placeholder"
        :error="error" maxlength="500" :hint="required ? `Mínimo ${MIN_REASON} caracteres. Queda registrado en la auditoría.` : 'Queda registrado en la auditoría.'"
        @blur="touched = true"
      />
    </form>
    <template #actions="{ close }">
      <button type="button" class="btn btn--ghost" @click="close">Cancelar</button>
      <BaseButton :variant="tone === 'danger' ? 'danger' : ''" :loading="busy" loading-text="Guardando" @click="submit">{{ confirmText }}</BaseButton>
    </template>
  </BaseSheet>
</template>
