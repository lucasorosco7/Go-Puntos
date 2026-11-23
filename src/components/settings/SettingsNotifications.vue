<!--
  Configuración · Notificaciones: qué avisos automáticos reciben los
  clientes en la campana y si se envían también como push (preparado
  para cuando exista el servidor de notificaciones).
-->
<script setup>
import { notificationTypes } from '../../domain/notifications.js';
import { businessService } from '../../services/businessService.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseToggle from '../base/BaseToggle.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const n = props.ctx.business.notifications;
const { form, run } = useSection({
  ...Object.fromEntries(notificationTypes.configurable.map((k) => [k, n[k] !== false])),
  push: Boolean(n.push),
});
const f = form.values;
const save = () => run((x) => businessService.update({ notifications: { ...x } }));
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="card">
    <BaseToggle
      v-for="k in notificationTypes.configurable" :key="k" v-model="f[k]" :name="`n_${k}`"
      :label="`${notificationTypes.TYPES[k].emoji} ${notificationTypes.TYPES[k].label}`" :hint="notificationTypes.TYPES[k].description"
    />
  </div>
  <div class="card" style="margin-top: var(--sp-3)">
    <BaseToggle v-model="f.push" name="n_push" label="Enviar también como notificación push" hint="Preparado para cuando la app tenga servidor: llegará al teléfono aunque la app esté cerrada." />
  </div>
</template>
