<!--
  Asistente · Ofertas iniciales (opcional): lista las del negocio y
  permite crear una o usar la plantilla "Puntos dobles de lanzamiento".
-->
<script setup>
import { ref } from 'vue';
import { offers as Offers } from '../../domain/offers.js';
import { addDays } from '../../utils/dates.js';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import StatusPill from '../base/StatusPill.vue';
import OfferEditor from '../editors/OfferEditor.vue';
import RewardArt from '../loyalty/RewardArt.vue';

defineProps({ ctx: { type: Object, required: true } });
const emit = defineEmits(['reload', 'goto']);
const editing = ref(null);

function launchTemplate() {
  editing.value = {
    title: 'Puntos dobles de lanzamiento', description: 'Todas las compras suman el doble durante la primera semana.',
    type: 'puntos_dobles', value: 2, status: 'activa', autoApply: true, featured: true,
    startDate: new Date().toISOString(), endDate: addDays(new Date(), 7).toISOString(),
  };
}
defineExpose({ save: async () => null });
</script>

<template>
  <ul class="stack">
    <li v-for="o in ctx.offers" :key="o.id" class="row">
      <RewardArt :category="o.category" :size="48" :icon-size="20" :image="o.image" />
      <div class="row__body"><span class="pill" :class="`pill--${Offers.tone(o)}`">{{ Offers.tag(o) }}</span><p class="row__title">{{ o.title }}</p></div>
      <StatusPill :meta="Offers.STATUS[Offers.effectiveStatus(o)]" />
    </li>
    <li v-if="!ctx.offers.length"><EmptyState icon="tag" title="Todavía no hay ofertas" text="Por ejemplo: puntos dobles la primera semana para que tus clientes se sumen." /></li>
  </ul>
  <div class="btn-row" style="margin-top: var(--sp-4)">
    <button type="button" class="btn btn--sm" @click="editing = {}"><BaseIcon name="plus" :size="16" /> Nueva oferta</button>
    <button type="button" class="btn btn--outline btn--sm" @click="launchTemplate"><BaseIcon name="sparkles" :size="15" /> Puntos dobles de lanzamiento</button>
  </div>
  <OfferEditor v-if="editing" :data="editing" :levels="ctx.levels" @saved="emit('reload')" @close="editing = null" />
</template>
