<!--
  Configuración · Premio mensual para el #1 del ranking: puntos extra
  (van al SALDO, no al ranking del mes siguiente), una recompensa del
  catálogo o un premio en texto libre. Se entrega solo al cerrar el mes.
-->
<script setup>
import { computed } from 'vue';
import { businessService } from '../../services/businessService.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseField from '../base/BaseField.vue';
import BaseToggle from '../base/BaseToggle.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const p = props.ctx.business.monthlyPrize;
const { form, run } = useSection(
  { enabled: p.enabled, type: p.type, points: p.points || 500, rewardId: p.rewardId || '', description: p.description || '' },
  { rewardId: [(value, all) => (all.enabled && all.type === 'recompensa' && !value ? 'Elegí la recompensa del premio.' : '')] },
);
const f = form.values;
const TYPES = [{ value: 'puntos', label: 'Puntos extra' }, { value: 'recompensa', label: 'Una recompensa del catálogo' }, { value: 'texto', label: 'Otro premio (texto libre)' }];
const rewardOptions = computed(() => [
  { value: '', label: props.ctx.rewards.length ? 'Elegí una recompensa' : 'Primero creá una recompensa' },
  ...props.ctx.rewards.filter((r) => r.status !== 'finalizada').map((r) => ({ value: r.id, label: r.name })),
]);

const save = () => run((x) => businessService.update({
  monthlyPrize: { enabled: x.enabled, type: x.type, points: Number(x.points) || 0, rewardId: x.rewardId ? Number(x.rewardId) : null, description: x.description || '' },
}));
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="card form-grid">
    <BaseToggle v-model="f.enabled" name="prizeEnabled" label="Premiar al ganador del mes" />
    <div v-show="f.enabled" class="form-grid form-grid--2">
      <BaseField v-model="f.type" id-prefix="cfg" name="prizeType" label="Tipo de premio" type="select" :options="TYPES" />
      <div v-show="f.type === 'puntos'"><BaseField v-model="f.points" id-prefix="cfg" name="prizePoints" label="Puntos" type="number" min="1" suffix="pts" /></div>
      <div v-show="f.type === 'recompensa'"><BaseField v-model="f.rewardId" id-prefix="cfg" name="rewardId" label="Recompensa" type="select" :options="rewardOptions" :error="form.errors.rewardId" /></div>
      <div v-show="f.type === 'texto'" class="span-2"><BaseField v-model="f.description" id-prefix="cfg" name="prizeDescription" label="Descripción del premio" placeholder="Ej.: Una canasta de productos" /></div>
    </div>
  </div>
</template>
