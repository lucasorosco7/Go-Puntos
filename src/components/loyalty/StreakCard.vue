<!--
  Racha de compras semanales del cliente (últimas 8 semanas).
  Por pedido del proyecto no se muestra en la pantalla principal: aparece
  en el Perfil y como aviso contextual o notificación.
-->
<script setup>
import { computed } from 'vue';
import { streaks as Streaks } from '../../domain/streaks.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({
  /** Resultado de domain/streaks.js → compute() */
  streak: { type: Object, required: true },
});
const on = computed(() => props.streak.weeks >= 1);
const title = computed(() => (on.value ? `🔥 ${Streaks.label(props.streak)}` : 'Empezá una racha'));
const text = computed(() => {
  if (!on.value) return 'Comprá esta semana y la que viene para empezar una racha.';
  return props.streak.activeThisWeek ? '¡Esta semana ya compraste! La racha sigue viva.' : '¡Una compra más esta semana mantiene tu racha!';
});
const weekLabel = (w) => `Semana del ${format.shortDate(`${w.key}T12:00:00`)}`;
</script>

<template>
  <section class="streak" :class="{ 'is-risk': streak.atRisk }" aria-label="Tu racha">
    <div class="streak__head">
      <p class="streak__title">{{ title }}</p>
      <span v-if="streak.best > streak.weeks" class="small muted">Mejor: {{ streak.best }}</span>
    </div>
    <p class="small muted">{{ text }}</p>
    <!-- Una marca por semana: llena si compró esa semana -->
    <ol class="streak__weeks" aria-label="Últimas 8 semanas">
      <li v-for="w in streak.lastWeeks" :key="w.key" :class="{ 'is-on': w.active, 'is-now': w.current }" :title="weekLabel(w)">
        <span class="sr-only">{{ weekLabel(w) }}: {{ w.active ? 'con compra' : 'sin compra' }}</span>
      </li>
    </ol>
    <p v-if="streak.months >= 2" class="small muted"><BaseIcon name="calendar-check" :size="13" /> {{ streak.months }} meses seguidos comprando</p>
  </section>
</template>
