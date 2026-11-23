<!--
  Caja · Paso 1: identificar al cliente.
  Escaneando su QR personal (lector simulado) o buscándolo por nombre,
  email, teléfono o código. Emite "pick" con la tarjeta de caja del cliente.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { customerService } from '../../services/customerService.js';
import { qrService } from '../../services/qrService.js';
import { format } from '../../utils/format.js';
import { debounce } from '../../utils/helpers.js';
import CustomerChip from '../admin/CustomerChip.vue';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import ScannerSheet from './ScannerSheet.vue';

const emit = defineEmits(['pick']);
const q = ref('');
const results = ref(null);
const scanning = ref(null);

const search = debounce(async () => {
  try { results.value = await customerService.search(q.value); } catch { results.value = []; }
}, 180);
onMounted(search);

async function pick(membershipId) {
  emit('pick', await customerService.getCashierCard(membershipId));
}

/** Abre el lector con algunos clientes recientes como ejemplo. */
async function openScanner() {
  const recent = await customerService.search('');
  scanning.value = recent.slice(0, 4).map((x) => ({ code: x.membership.code, label: `${x.user.firstName} · ${x.membership.code}` }));
}
async function onCode(code) {
  emit('pick', await qrService.identifyCustomer(code));
}
</script>

<template>
  <div class="till">
    <section class="panel-card">
      <h2 style="margin-bottom: var(--sp-3)">1. Identificá al cliente</h2>
      <button type="button" class="btn btn--honey btn--lg till__scan" @click="openScanner"><BaseIcon name="scan-line" :size="22" /> Escanear QR del cliente</button>
      <!-- Búsqueda manual -->
      <div class="field field--search" style="margin-top: var(--sp-4)" data-field="q">
        <label class="field__label" for="q">O buscalo por nombre, email, teléfono o código</label>
        <div class="field__control">
          <BaseIcon name="search" :size="18" class="field__icon" />
          <input id="q" v-model="q" class="field__input has-icon" type="search" placeholder="Ej.: Martina, CV-000124" autocomplete="off" @input="search" />
        </div>
      </div>
      <ul class="stack" style="margin-top: var(--sp-3)">
        <li v-for="x in results || []" :key="x.membership.id">
          <button type="button" class="row" @click="pick(x.membership.id)">
            <CustomerChip :user="x.user" :level="x.level"><span class="tabular">{{ x.membership.code }}</span></CustomerChip>
            <span class="small muted tabular" style="margin-left: auto">{{ format.points(x.membership.balance) }} pts</span>
          </button>
        </li>
        <li v-if="results && !results.length">
          <EmptyState icon="user-search" title="No encontramos clientes" text="Probá con otro dato. Si es nuevo, que escanee el QR del negocio para sumarse." />
        </li>
      </ul>
    </section>
    <!-- Ayuda -->
    <aside class="panel-card">
      <h2 style="margin-bottom: var(--sp-2)">Cómo funciona</h2>
      <ol class="small muted" style="display: grid; gap: var(--sp-2); list-style: decimal; padding-left: 18px">
        <li>El cliente abre <b>Mostrar mi código</b> en su celular.</li>
        <li>Escaneás el QR (o lo buscás por nombre).</li>
        <li>Cargás el importe: los puntos se calculan solos con la regla del negocio, su nivel y las ofertas vigentes.</li>
        <li>Confirmás. Se actualiza su saldo y sus puntos del mes.</li>
      </ol>
    </aside>
    <ScannerSheet v-if="scanning" title="Escanear QR del cliente" placeholder="Ej.: CV-000124" :suggestions="scanning" :submit="onCode" @close="scanning = null" />
  </div>
</template>
