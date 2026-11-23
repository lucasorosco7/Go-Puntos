<!--
  Estado de una cuenta de cliente que todavía no participa en ningún
  negocio: explica cómo sumarse y, si se pide, lista los comercios activos.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { customerService } from '../../services/customerService.js';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import BusinessLogo from '../brand/BusinessLogo.vue';

const props = defineProps({
  title: { type: String, default: 'Todavía no te sumaste a ningún comercio' },
  text: { type: String, default: 'Escaneá el QR del local para empezar a sumar.' },
  /** Muestra la lista de comercios disponibles. */
  showList: Boolean,
});
const list = ref([]);
onMounted(async () => {
  if (!props.showList) return;
  try { list.value = await customerService.getDiscoverable(); } catch { list.value = []; }
});
</script>

<template>
  <div>
    <EmptyState icon="store" :title="title" :text="text"><template v-if="$slots.action" #action><slot name="action" /></template></EmptyState>
    <template v-if="list.length">
      <p class="group-title">Comercios disponibles</p>
      <ul class="stack">
        <li v-for="b in list" :key="b.id">
          <router-link class="row" :to="{ name: 'join', params: { slug: b.slug } }">
            <BusinessLogo :business="b" :size="44" />
            <span class="row__body"><span class="row__title">{{ b.name }}</span><span class="small muted">{{ b.description || '' }}</span></span>
            <BaseIcon name="chevron-right" :size="18" />
          </router-link>
        </li>
      </ul>
    </template>
  </div>
</template>
