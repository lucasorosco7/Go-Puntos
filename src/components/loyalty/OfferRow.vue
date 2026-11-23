<!--
  Fila de oferta del cliente. Las exclusivas de otro nivel se ven con
  candado ("Exclusivo nivel Oro") para motivar a subir de nivel.
  Emite "open" al tocarla (la vista abre el detalle).
-->
<script setup>
import { computed } from 'vue';
import { offers as Offers } from '../../domain/offers.js';
import BaseIcon from '../base/BaseIcon.vue';
import RewardArt from './RewardArt.vue';

const props = defineProps({ offer: { type: Object, required: true } });
const emit = defineEmits(['open']);
const locked = computed(() => props.offer.eligible === false);
</script>

<template>
  <li>
    <button type="button" class="row offer" :class="{ 'is-locked': locked }" @click="emit('open', offer)">
      <RewardArt :category="offer.category" :size="64" :icon-size="26" :image="offer.image" />
      <div class="row__body">
        <span class="pill" :class="`pill--${Offers.tone(offer)}`">{{ Offers.tag(offer) }}</span>
        <p class="row__title" style="margin-top: 5px">{{ offer.title }}</p>
        <p class="small muted">{{ offer.description }}</p>
        <p class="offer__meta">
          <BaseIcon :name="locked ? 'lock' : 'calendar-days'" :size="13" />
          {{ locked ? `Exclusivo nivel ${(offer.levelNames || []).join(' / ')}` : Offers.when(offer) }}
        </p>
      </div>
    </button>
  </li>
</template>
