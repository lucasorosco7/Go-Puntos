<!--
  Caja · Resultado de una compra registrada: puntos acreditados, nuevo
  saldo, puntos del mes, nivel y los avisos que recibió el cliente.
-->
<script setup>
import { computed } from 'vue';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';
import LevelBadge from '../loyalty/LevelBadge.vue';
import NotificationItem from '../loyalty/NotificationItem.vue';

const props = defineProps({
  /** { movement, card, events } de pointsService.registerPurchase */
  result: { type: Object, required: true },
  /** Muestra "Ver ficha" (sólo dueño o administrador). */
  canSeeCustomer: Boolean,
});
const emit = defineEmits(['new', 'same']);
const card = computed(() => props.result.card);
</script>

<template>
  <section class="panel-card" style="max-width: 560px; margin-inline: auto">
    <div class="result-hero">
      <span class="done__icon" style="margin-bottom: var(--sp-2)"><BaseIcon name="check" :size="36" /></span>
      <p class="muted">Compra de {{ format.currency(result.movement.amount) }} registrada para {{ card.user.firstName }} {{ card.user.lastName }}</p>
      <p class="result-hero__pts tabular">+{{ format.points(result.movement.points) }}</p>
      <p class="muted">puntos acreditados</p>
    </div>
    <dl class="kv">
      <div><dt>Nuevo saldo disponible</dt><dd class="tabular">{{ format.points(card.membership.balance) }} pts</dd></div>
      <div><dt>Puntos del mes</dt><dd class="tabular">{{ format.points(card.membership.periodPoints) }} pts</dd></div>
      <div><dt>Nivel</dt><dd><LevelBadge :level="card.levelInfo.level" size="sm" /></dd></div>
    </dl>
    <!-- Avisos generados por la compra (desafío cumplido, nivel asegurado…) -->
    <template v-if="result.events.length">
      <p class="group-title">Avisos que recibió el cliente</p>
      <ul class="stack"><NotificationItem v-for="n in result.events" :key="n.id" :notification="n" /></ul>
    </template>
    <div class="btn-row" style="margin-top: var(--sp-5)">
      <button type="button" class="btn" @click="emit('new')"><BaseIcon name="scan-line" :size="17" /> Nueva compra</button>
      <button type="button" class="btn btn--outline" @click="emit('same')">Otra compra de {{ card.user.firstName }}</button>
      <router-link v-if="canSeeCustomer" class="btn btn--ghost" :to="{ name: 'admin-customer', params: { id: card.membership.id } }">Ver ficha</router-link>
    </div>
  </section>
</template>
