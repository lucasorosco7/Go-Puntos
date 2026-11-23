<!--
  Configuración · Ranking mensual: activarlo y mostrar a cada cliente su
  posición. Se reinicia el 1° de cada mes y se guarda el historial; el
  saldo de puntos no se toca.
-->
<script setup>
import { businessService } from '../../services/businessService.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseIcon from '../base/BaseIcon.vue';
import BaseToggle from '../base/BaseToggle.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const r = props.ctx.business.ranking;
const { form, run } = useSection({ enabled: r.enabled, showPosition: r.showPosition !== false });
const f = form.values;
const save = () => run((x) => businessService.update({ ranking: { ...r, enabled: x.enabled, showPosition: x.showPosition } }));
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="card">
    <BaseToggle v-model="f.enabled" name="rankingEnabled" label="Activar ranking mensual" hint="Se reinicia el 1° de cada mes y se guarda el historial. El saldo de puntos no se toca." />
    <BaseToggle v-model="f.showPosition" name="showPosition" label="Mostrar a cada cliente su posición" hint="Aunque no esté en el Top 5." />
  </div>
  <p class="small muted" style="margin-top: var(--sp-3)"><BaseIcon name="eye-off" :size="13" /> Por privacidad, los demás clientes ven sólo el nombre y la inicial del apellido.</p>
</template>
