<!--
  Detalle de un canje en la Caja: código, estado, recompensa, cliente y
  fechas. Si está pendiente ofrece "Entregar y validar" (emite "deliver").
-->
<script setup>
import { computed } from 'vue';
import { rewards as Rewards } from '../../domain/rewards.js';
import { format } from '../../utils/format.js';
import BaseButton from '../base/BaseButton.vue';
import StatusPill from '../base/StatusPill.vue';

const props = defineProps({
  redemption: { type: Object, required: true },
  busy: Boolean,
});
const emit = defineEmits(['deliver']);
const status = computed(() => props.redemption.effectiveStatus);
const meta = computed(() => Rewards.REDEMPTION_STATUS[status.value]);
</script>

<template>
  <div class="panel-card">
    <div style="display: flex; justify-content: space-between; gap: var(--sp-3); align-items: flex-start; flex-wrap: wrap">
      <div>
        <p class="small muted">Código</p>
        <p class="tabular" style="font-size: var(--fs-xl); letter-spacing: 0.06em; font-weight: var(--fw-medium)">{{ redemption.code }}</p>
      </div>
      <StatusPill :meta="meta" :icon="meta.icon" />
    </div>
    <dl class="kv" style="margin-top: var(--sp-3)">
      <div><dt>Recompensa</dt><dd>{{ redemption.rewardName }}{{ redemption.source === 'premio' ? ' (premio del ranking)' : '' }}</dd></div>
      <div><dt>Cliente</dt><dd>{{ redemption.customer.firstName }} {{ redemption.customer.lastName }} · {{ redemption.membershipCode }}</dd></div>
      <div><dt>Puntos usados</dt><dd class="tabular">{{ format.points(redemption.points) }}</dd></div>
      <div><dt>Canjeado</dt><dd>{{ format.dateTime(redemption.createdAt) }}</dd></div>
      <div v-if="status === 'entregado'"><dt>Entregado</dt><dd>{{ format.dateTime(redemption.validatedAt) }} · {{ redemption.validatedByName || '' }}</dd></div>
      <div v-else><dt>Vence</dt><dd>{{ format.longDate(redemption.expiresAt) }}</dd></div>
    </dl>
    <BaseButton
      v-if="status === 'pendiente'" size="lg" block icon="package-check" :loading="busy" loading-text="Validando"
      style="margin-top: var(--sp-4)" @click="emit('deliver', redemption.code)"
    >Entregar y validar</BaseButton>
  </div>
</template>
