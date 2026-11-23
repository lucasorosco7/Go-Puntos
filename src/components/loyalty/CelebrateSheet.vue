<!--
  Ventana de celebración (nivel nuevo, premio del mes, desafío cumplido).
  Se muestra una sola vez por notificación: la vista marca "popupShown".
-->
<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { notificationTypes } from '../../domain/notifications.js';
import BaseIcon from '../base/BaseIcon.vue';
import BaseSheet from '../base/BaseSheet.vue';

const props = defineProps({ notification: { type: Object, required: true } });
const emit = defineEmits(['close']);
const router = useRouter();
const meta = computed(() => notificationTypes.meta(props.notification.type));
/** El título sin el emoji inicial (el ícono ya lo representa). */
const title = computed(() => props.notification.title.replace(/^\p{Extended_Pictographic}\s*/u, ''));

function goTo(close) {
  close();
  router.push(props.notification.link);
}
</script>

<template>
  <BaseSheet :title="title" @close="emit('close')">
    <div class="celebrate">
      <span class="celebrate__icon" :class="`celebrate__icon--${meta.tone}`"><BaseIcon :name="meta.icon" :size="34" /></span>
      <p v-if="notification.body" class="muted">{{ notification.body }}</p>
    </div>
    <template #actions="{ close }">
      <button v-if="notification.link" type="button" class="btn btn--lg btn--block" @click="goTo(close)">Ver detalle</button>
      <button type="button" class="btn btn--block" :class="notification.link ? 'btn--ghost' : 'btn--lg'" @click="close()">¡Genial!</button>
    </template>
  </BaseSheet>
</template>
