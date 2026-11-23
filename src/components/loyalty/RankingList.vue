<!--
  Lista del ranking mensual (por puntos del período, sólo compras).
  Resalta la fila del cliente actual con "Vos".
-->
<script setup>
import { ranking as Ranking } from '../../domain/ranking.js';
import { format } from '../../utils/format.js';

defineProps({
  rows: { type: Array, required: true },
  /** Membresía del cliente que mira (para resaltarla). */
  meId: { type: Number, default: null },
});
</script>

<template>
  <ol class="rank">
    <li v-for="r in rows" :key="r.membershipId" class="rank__row" :class="{ 'is-me': r.membershipId === meId }">
      <span class="rank__pos tabular">{{ Ranking.medal(r.position) || `#${r.position}` }}</span>
      <span class="rank__name">{{ r.name }}<template v-if="r.membershipId === meId">{{ ' ' }}<span class="pill pill--green">Vos</span></template></span>
      <span class="rank__pts tabular">{{ format.points(r.points) }} pts</span>
    </li>
  </ol>
</template>
