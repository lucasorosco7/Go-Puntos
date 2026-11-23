<!--
  Lista compacta de acciones de la auditoría de la plataforma
  (dashboard del Superadmin y ficha de un negocio).
  items: registros de auditoria_plataforma ya preparados por el servicio
         { id, action, date, adminName, business, requestId, detail }
-->
<script setup>
import { AUDIT_ACTIONS } from '../../domain/platform.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';

defineProps({
  items: { type: Array, required: true },
  /** Oculta el negocio (cuando la lista ya es de un negocio). */
  hideBusiness: Boolean,
});
</script>

<template>
  <ul class="audit-list">
    <li v-for="a in items" :key="a.id" class="audit-list__item">
      <span class="audit-list__icon" :class="AUDIT_ACTIONS[a.action]?.tone ? `is-${AUDIT_ACTIONS[a.action].tone}` : ''" aria-hidden="true">
        <BaseIcon :name="AUDIT_ACTIONS[a.action]?.icon || 'circle'" :size="16" />
      </span>
      <div class="audit-list__body">
        <p>
          <b>{{ AUDIT_ACTIONS[a.action]?.short || a.action }}</b>
          <template v-if="a.business && !hideBusiness">
            ·
            <router-link class="link" :to="{ name: 'platform-business', params: { id: a.business.id } }">{{ a.business.name || 'Negocio sin nombre' }}</router-link>
          </template>
        </p>
        <p v-if="a.detail" class="small">{{ a.detail }}</p>
        <p class="small muted">{{ a.adminName }} · <time :datetime="a.date" :title="format.fullDateTime(a.date)">{{ format.relative(a.date) }}</time></p>
      </div>
    </li>
  </ul>
</template>
