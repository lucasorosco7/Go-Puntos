<!--
  Configuración · Desafíos y rachas: activar desafíos, rachas semanales y
  el aviso de racha en riesgo; crear desafíos o partir de plantillas.
  Aparecen en el Perfil del cliente y por notificación, sin recargar la
  pantalla principal.
-->
<script setup>
import { ref } from 'vue';
import { challenges as Challenges } from '../../domain/challenges.js';
import { businessService } from '../../services/businessService.js';
import { format } from '../../utils/format.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseIcon from '../base/BaseIcon.vue';
import BaseToggle from '../base/BaseToggle.vue';
import StatusPill from '../base/StatusPill.vue';
import ChallengeEditor from '../editors/ChallengeEditor.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
const emit = defineEmits(['reload', 'goto']);
const b = props.ctx.business;
const { form, run } = useSection({ challengesEnabled: b.challengesEnabled, streaksEnabled: b.streaks.enabled, remindAtRisk: b.streaks.remindAtRisk });
const f = form.values;
const editing = ref(null);
const TEMPLATES = [
  { type: 'compras', name: 'Tres compras este mes', description: 'Realizá 3 compras durante el mes.', goal: 3, rewardPoints: 150 },
  { type: 'semanas', name: 'Tres semanas seguidas', description: 'Comprá durante 3 semanas consecutivas.', goal: 3, rewardPoints: 200 },
  { type: 'puntos', name: 'Conseguí 500 puntos', description: 'Sumá 500 puntos en el mes.', goal: 500, rewardPoints: 100 },
  { type: 'primer_canje', name: 'Tu primer canje', description: 'Canjeá tu primera recompensa.', goal: 1, rewardPoints: 50 },
];

const save = () => run((x) => businessService.update({
  challengesEnabled: x.challengesEnabled, streaks: { ...b.streaks, enabled: x.streaksEnabled, remindAtRisk: x.remindAtRisk },
}));
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="card">
    <BaseToggle v-model="f.challengesEnabled" name="challengesEnabled" label="Activar desafíos" />
    <BaseToggle v-model="f.streaksEnabled" name="streaksEnabled" label="Activar rachas semanales" hint="Cuenta las semanas seguidas con al menos una compra." />
    <BaseToggle v-model="f.remindAtRisk" name="remindAtRisk" label="Avisar cuando una racha está por perderse" hint="A partir del miércoles, si todavía no compró esa semana." />
  </div>
  <p class="group-title">Desafíos {{ ctx.challenges.length ? `(${ctx.challenges.length})` : '' }}</p>
  <ul class="stack">
    <li v-for="c in ctx.challenges.slice(0, 6)" :key="c.id" class="row">
      <BaseIcon :name="Challenges.TYPES[c.type]?.icon || 'target'" :size="20" />
      <div class="row__body"><p class="row__title">{{ c.name }}</p><p class="small muted">{{ Challenges.rewardText(c) }} · hasta el {{ format.shortDate(c.endDate) }}</p></div>
      <StatusPill :meta="Challenges.STATUS[Challenges.effectiveStatus(c)]" />
    </li>
  </ul>
  <div class="btn-row" style="margin-top: var(--sp-3)">
    <button type="button" class="btn btn--sm" @click="editing = {}"><BaseIcon name="plus" :size="16" /> Nuevo desafío</button>
    <button v-for="t in TEMPLATES" :key="t.name" type="button" class="btn btn--outline btn--sm" @click="editing = { ...t }"><BaseIcon name="copy-plus" :size="15" /> {{ t.name }}</button>
  </div>
  <ChallengeEditor v-if="editing" :data="editing" @saved="emit('reload')" @close="editing = null" />
</template>
