<!--
  Tarjeta de puntos: la pieza principal del cliente.
  Muestra el SALDO DISPONIBLE (lo que puede canjear) y cuánto le falta
  para la próxima recompensa. No muestra los puntos del mes (eso es nivel).
-->
<script setup>
import { computed } from 'vue';
import { rewards as Rewards } from '../../domain/rewards.js';
import { format } from '../../utils/format.js';
import ProgressBar from '../base/ProgressBar.vue';

const props = defineProps({
  balance: { type: Number, required: true },
  /** Próxima recompensa a la que apunta (o null si le alcanza para todas). */
  nextReward: { type: Object, default: null },
  compact: Boolean,
  label: { type: String, default: 'Saldo disponible' },
});
const goal = computed(() => Rewards.progressTo(props.balance, props.nextReward));
</script>

<template>
  <!-- Versión compacta (encabezados de Recompensas y Canje) -->
  <section v-if="compact" class="points points--compact" :aria-label="label">
    <span class="points__label">{{ label }}</span>
    <span class="points__value tabular">{{ format.points(balance) }}</span>
  </section>

  <section v-else class="points" :aria-label="label">
    <p class="points__label">{{ label }} <span class="points__unit">para canjear</span></p>
    <p class="points__value tabular">{{ format.points(balance) }}</p>
    <template v-if="nextReward">
      <ProgressBar :value="goal.progress" :label="`Progreso hacia ${nextReward.name}`" mod="bar--honey bar--onDark" />
      <p class="points__goal">Te faltan <b class="tabular">{{ format.points(goal.missing) }}</b> para {{ nextReward.name }}</p>
    </template>
    <p v-else class="points__goal">Te alcanza para cualquier recompensa del catálogo.</p>
  </section>
</template>
