<!--
  Campana de notificaciones con el contador de no leídas del negocio activo.
  El número sale del store de notificaciones.
-->
<script setup>
import { computed } from 'vue';
import { APP_LINKS } from '../../config/navigation.js';
import { useNotificationStore } from '../../stores/notification.js';
import BaseIcon from '../base/BaseIcon.vue';

const store = useNotificationStore();
const count = computed(() => store.unread);
</script>

<template>
  <router-link :to="APP_LINKS.notifications" class="icon-btn bell" :aria-label="`Notificaciones${count ? `, ${count} sin leer` : ''}`">
    <BaseIcon name="bell" :size="19" />
    <span v-if="count" class="bell__count tabular">{{ count > 9 ? '9+' : count }}</span>
  </router-link>
</template>
