<!--
  Notificación de la campana. Las no leídas se marcan con un punto.
  Emite "open" al tocarla (la vista la marca como leída y sigue el enlace).
-->
<script setup>
import { computed } from 'vue';
import { notificationTypes } from '../../domain/notifications.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({ notification: { type: Object, required: true } });
const emit = defineEmits(['open']);
const meta = computed(() => notificationTypes.meta(props.notification.type));
</script>

<template>
  <li>
    <button type="button" class="notif" :class="{ 'is-unread': !notification.read }" @click="emit('open', notification)">
      <span class="notif__icon" :class="`notif__icon--${meta.tone}`"><BaseIcon :name="meta.icon" :size="18" /></span>
      <span class="notif__body">
        <span class="notif__title">{{ notification.title }}</span>
        <span v-if="notification.body" class="notif__text">{{ notification.body }}</span>
        <span class="notif__meta">{{ format.relative(notification.createdAt) }}{{ notification.source === 'campaña' ? ' · Mensaje del negocio' : '' }}</span>
      </span>
      <span v-if="!notification.read" class="notif__dot" aria-label="No leída"></span>
    </button>
  </li>
</template>
