<!--
  Desafío con su progreso y premio. El premio suma al SALDO disponible,
  no a los puntos del mes (no cambia el nivel ni el ranking).
-->
<script setup>
import { computed } from 'vue';
import { challenges as Challenges } from '../../domain/challenges.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';
import ProgressBar from '../base/ProgressBar.vue';

const props = defineProps({
  /** Desafío con "progress" calculado por el servidor (domain/challenges.js). */
  challenge: { type: Object, required: true },
});
const type = computed(() => Challenges.TYPES[props.challenge.type] || {});
const p = computed(() => props.challenge.progress);
</script>

<template>
  <li class="challenge" :class="{ 'is-done': p.done }">
    <span class="challenge__icon"><BaseIcon :name="p.done ? 'circle-check' : type.icon || 'target'" :size="20" /></span>
    <div class="challenge__body">
      <div class="challenge__top">
        <p class="challenge__name">{{ challenge.name }}</p>
        <span class="pill" :class="p.done ? 'pill--green' : 'pill--honey'">{{ Challenges.rewardText(challenge) }}</span>
      </div>
      <p v-if="challenge.description" class="small muted">{{ challenge.description }}</p>
      <ProgressBar :value="p.pct" :label="`Progreso de ${challenge.name}`" :mod="p.done ? '' : 'bar--honey'" />
      <p class="challenge__meta">
        <span class="tabular">{{ format.points(p.value) }} / {{ format.points(p.goal) }}</span>
        <span>{{ Challenges.missingText(challenge, p) }}{{ !p.done && challenge.endDate ? ` · hasta el ${format.shortDate(challenge.endDate)}` : '' }}</span>
      </p>
    </div>
  </li>
</template>
