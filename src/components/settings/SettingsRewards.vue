<!--
  Asistente · Recompensas: lista las del negocio y permite crear una o
  partir de una plantilla. Las recompensas se guardan al crearlas (en el
  editor), por eso save() no tiene nada pendiente.
-->
<script setup>
import { ref } from 'vue';
import { rewards as Rewards } from '../../domain/rewards.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import StatusPill from '../base/StatusPill.vue';
import RewardEditor from '../editors/RewardEditor.vue';
import RewardArt from '../loyalty/RewardArt.vue';

defineProps({ ctx: { type: Object, required: true } });
const emit = defineEmits(['reload', 'goto']);
const editing = ref(null);
const TEMPLATES = [
  { name: '10% de descuento', category: 'descuentos', points: 500, description: 'En tu próxima compra.' },
  { name: 'Producto de regalo', category: 'general', points: 800, description: 'Elegí un producto seleccionado.' },
  { name: 'Café de regalo', category: 'cafe', points: 300, description: 'Un café chico.' },
];
defineExpose({ save: async () => null });
</script>

<template>
  <ul class="stack">
    <li v-for="r in ctx.rewards" :key="r.id" class="row">
      <RewardArt :category="r.category" :size="48" :icon-size="20" :image="r.image" />
      <div class="row__body"><p class="row__title">{{ r.name }}</p><p class="small muted">{{ format.points(r.points) }} pts · {{ Rewards.stockText(r) }}</p></div>
      <StatusPill :meta="Rewards.STATUS[r.status]" />
    </li>
    <li v-if="!ctx.rewards.length"><EmptyState icon="gift" title="Todavía no hay recompensas" text="Creá la primera o usá una plantilla." /></li>
  </ul>
  <div class="btn-row" style="margin-top: var(--sp-4)">
    <button type="button" class="btn btn--sm" @click="editing = {}"><BaseIcon name="plus" :size="16" /> Nueva recompensa</button>
    <button v-for="t in TEMPLATES" :key="t.name" type="button" class="btn btn--outline btn--sm" @click="editing = { ...t, status: 'activa' }">
      <BaseIcon name="copy-plus" :size="15" /> {{ t.name }}
    </button>
  </div>
  <RewardEditor v-if="editing" :data="editing" @saved="emit('reload')" @close="editing = null" />
</template>
