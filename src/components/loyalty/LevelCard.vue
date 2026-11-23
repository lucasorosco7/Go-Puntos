<!--
  Tarjeta de nivel del cliente (regla mensual):
    - arriba: el nivel VIGENTE, que se ganó el mes pasado y da los beneficios de hoy;
    - abajo: los puntos de ESTE mes, que definen el nivel del mes siguiente.
  El saldo disponible no interviene: canjear no baja de nivel.
  Recibe "info" de domain/levels.js → status().
-->
<script setup>
import { computed } from 'vue';
import { nextPeriod } from '../../utils/dates.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';
import ProgressBar from '../base/ProgressBar.vue';
import LevelBadge from './LevelBadge.vue';

const props = defineProps({
  /** { level, earned, next, periodPoints, missing, progress, nextPeriod } */
  info: { type: Object, required: true },
  /** Período actual "AAAA-MM". */
  period: { type: String, required: true },
});
const monthName = computed(() => format.period(props.period));
const nextMonth = computed(() => format.period(props.info.nextPeriod || nextPeriod(props.period)));
/** Nivel ya asegurado para el mes que viene (si superó el primero). */
const secured = computed(() => props.info.earned && props.info.earned.minPoints > 0);
</script>

<template>
  <section class="level-card" aria-label="Tu nivel">
    <div class="level-card__head">
      <div class="level-card__now">
        <span class="level-card__caption">Tu nivel en {{ monthName }}</span>
        <LevelBadge :level="info.level" size="lg" />
      </div>
      <p class="level-card__month"><b class="tabular">{{ format.points(info.periodPoints) }}</b> pts sumados en {{ monthName }}</p>
    </div>

    <!-- Progreso hacia el nivel del mes siguiente -->
    <template v-if="info.next">
      <ProgressBar :value="info.progress" :label="`Progreso hacia el nivel ${info.next.name} de ${nextMonth}`" mod="bar--level" />
      <p class="level-card__goal">Te faltan <b class="tabular">{{ format.points(info.missing) }}</b> puntos este mes para ser <b>{{ info.next.name }}</b> en {{ nextMonth }}</p>
    </template>
    <p v-else class="level-card__goal">Aseguraste el nivel más alto para {{ nextMonth }}. ¡Gracias por elegirnos!</p>

    <p v-if="secured" class="level-card__keep">
      <BaseIcon name="shield-check" :size="13" /><span>Con lo que sumaste, en {{ nextMonth }} ya sos <b>{{ info.earned.name }}</b>.</span>
    </p>
    <!-- Fila opcional (posición en el ranking) -->
    <slot />
  </section>
</template>
