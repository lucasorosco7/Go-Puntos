<!--
  Selector del negocio activo del cliente (encabezado de la app).
  Muestra el negocio que se está mirando y abre una hoja para:
    - cambiar a otro negocio de la misma cuenta (los puntos de cada uno
      se guardan por separado), o
    - sumarse a otro comercio (en el local se hace escaneando su QR).
-->
<script setup>
import { ref } from 'vue';
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import { useCustomerStore } from '../../stores/customer.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';
import BaseSheet from '../base/BaseSheet.vue';
import BusinessLogo from '../brand/BusinessLogo.vue';

const store = useCustomerStore();
const open = ref(false);
const others = ref([]);

async function show() {
  open.value = true;
  try { others.value = await store.discoverable(); } catch { others.value = []; }
}

function choose(id, close) {
  if (id !== store.business?.id) store.switchTo(id);
  close();
}
</script>

<template>
  <template v-if="store.current">
    <button
      type="button" class="biz-chip" aria-haspopup="dialog"
      :aria-label="`Negocio: ${store.business.name}. Cambiar de negocio`" @click="show"
    >
      <BusinessLogo :business="store.business" :size="28" />
      <span class="biz-chip__name">{{ store.business.name }}</span>
      <BaseIcon :name="store.memberships.length > 1 ? 'chevrons-up-down' : 'chevron-down'" :size="15" />
    </button>

    <!-- Hoja con los negocios de la cuenta -->
    <BaseSheet v-if="open" title="Tus negocios" description="Tus puntos se guardan por separado en cada uno." @close="open = false">
      <template #default="{ close }">
        <ul class="stack biz-list">
          <li v-for="x in store.memberships" :key="x.business.id">
            <button type="button" class="row biz-list__item" :class="{ 'is-on': x.business.id === store.business.id }" @click="choose(x.business.id, close)">
              <BusinessLogo :business="x.business" :size="44" />
              <span class="row__body">
                <span class="row__title">{{ x.business.name }}</span>
                <span class="small muted">{{ format.points(x.membership.balance) }} pts · Nivel {{ x.levelInfo.level.name }}</span>
              </span>
              <BaseIcon :name="x.business.id === store.business.id ? 'check' : 'chevron-right'" :size="18" />
            </button>
          </li>
        </ul>
        <!-- Otros comercios para sumarse -->
        <template v-if="others.length">
          <p class="small muted" style="margin: var(--sp-5) 0 var(--sp-2)">Sumate a otro comercio (en el local lo hacés escaneando su QR):</p>
          <ul class="stack">
            <li v-for="b in others" :key="b.id">
              <router-link class="row" :to="{ name: 'join', params: { slug: b.slug } }" @click="close()">
                <BusinessLogo :business="b" :size="36" />
                <span class="row__body">
                  <span class="row__title">{{ b.name }}</span>
                  <span class="small muted">{{ BUSINESS_CATEGORIES[b.category] || '' }}</span>
                </span>
                <BaseIcon name="plus" :size="18" />
              </router-link>
            </li>
          </ul>
        </template>
      </template>
    </BaseSheet>
  </template>
</template>
