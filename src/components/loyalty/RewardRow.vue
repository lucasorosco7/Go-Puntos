<!--
  Fila de recompensa del catálogo del cliente.
  A la derecha muestra la acción según el saldo disponible:
    - "Agotado" si no hay stock,
    - cuántos puntos faltan si no le alcanza,
    - el botón "Canjear" (emite "redeem") si le alcanza.
  Con el slot "action" la vista puede reemplazar esa acción.
-->
<script setup>
import { computed } from 'vue';
import { rewards as Rewards } from '../../domain/rewards.js';
import { format } from '../../utils/format.js';
import RewardArt from './RewardArt.vue';

const props = defineProps({
  reward: { type: Object, required: true },
  /** Saldo disponible del cliente en este negocio. */
  balance: { type: Number, default: 0 },
  /** false = no mostrar ninguna acción. */
  actionable: { type: Boolean, default: true },
});
const emit = defineEmits(['redeem']);
const lowStock = computed(() => typeof props.reward.stock === 'number' && props.reward.stock > 0 && props.reward.stock <= 5);
</script>

<template>
  <li>
    <div class="row">
      <RewardArt :category="reward.category" :size="60" :icon-size="26" :image="reward.image" />
      <div class="row__body">
        <p class="row__title">{{ reward.name }}</p>
        <p class="tabular small" style="color: var(--forest-2); font-weight: var(--fw-medium)">{{ format.points(reward.points) }} puntos</p>
        <p v-if="lowStock" class="small subtle">Quedan {{ reward.stock }}</p>
      </div>
      <slot name="action">
        <template v-if="actionable">
          <span v-if="!Rewards.hasStock(reward)" class="pill">Agotado</span>
          <span v-else-if="reward.points > balance" class="small muted" style="text-align: right; line-height: 1.3">
            Faltan<br /><b class="tabular" style="color: var(--text)">{{ format.points(reward.points - balance) }}</b>
          </span>
          <button v-else type="button" class="btn btn--sm" @click="emit('redeem', reward)">Canjear</button>
        </template>
      </slot>
    </div>
  </li>
</template>
