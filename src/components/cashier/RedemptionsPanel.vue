<!--
  Caja · Validar canjes: buscar por código (tipeado o escaneado), ver el
  detalle y entregar. A la derecha, los canjes pendientes de entrega.
  initialCode: código que llega desde "Entregar" en la tarjeta del cliente.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { toast } from '../../composables/useToast.js';
import { qrService } from '../../services/qrService.js';
import { rewardService } from '../../services/rewardService.js';
import { format } from '../../utils/format.js';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import SkeletonBlock from '../base/SkeletonBlock.vue';
import RedemptionCard from './RedemptionCard.vue';
import ScannerSheet from './ScannerSheet.vue';

const props = defineProps({ initialCode: { type: String, default: '' } });
const code = ref(props.initialCode);
const codeError = ref('');
const found = ref(null);
const pending = ref(null);
const delivering = ref('');
const scanning = ref(null);

async function loadPending() {
  try { pending.value = await rewardService.getPending(); } catch { pending.value = []; }
}

async function lookup(value = code.value) {
  try {
    found.value = await qrService.findRedemption(value);
    codeError.value = '';
  } catch (err) {
    found.value = null;
    codeError.value = err.message;
  }
}

async function deliver(c) {
  delivering.value = c;
  try {
    const r = await qrService.validateRedemption(c);
    toast(`Entregado: ${r.rewardName} a ${r.customer.firstName}.`);
    found.value = r;
    await loadPending();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    delivering.value = '';
  }
}

function openScanner() {
  scanning.value = (pending.value || []).slice(0, 4).map((r) => ({ code: r.code, label: `${r.code} · ${r.customer.firstName}` }));
}
async function onScan(c) {
  code.value = c;
  await lookup(c);
}

onMounted(async () => {
  await loadPending();
  if (props.initialCode) lookup(props.initialCode);
});
</script>

<template>
  <div class="till">
    <section class="stack">
      <!-- Buscar un canje por código -->
      <form class="panel-card" novalidate style="display: grid; gap: var(--sp-3)" @submit.prevent="lookup()">
        <h2>Validar un canje</h2>
        <p class="small muted">El cliente te muestra el código desde Recompensas → Mis canjes.</p>
        <BaseField
          v-model="code" name="code" label="Código de canje" icon="ticket" placeholder="Ej.: CV-7K3P-Q9" :error="codeError"
          autocomplete="off" autocapitalize="characters" @update:model-value="codeError = ''"
        />
        <div class="btn-row">
          <button type="submit" class="btn">Buscar</button>
          <button type="button" class="btn btn--outline" @click="openScanner"><BaseIcon name="scan-line" :size="16" /> Escanear</button>
        </div>
      </form>
      <RedemptionCard v-if="found" :redemption="found" :busy="delivering === found.code" @deliver="deliver" />
    </section>

    <!-- Canjes para entregar -->
    <section class="panel-card">
      <div class="panel-card__head"><h2>Para entregar</h2></div>
      <SkeletonBlock v-if="!pending" height="160px" />
      <ul v-else-if="pending.length" class="stack">
        <li v-for="r in pending" :key="r.id" class="row">
          <div class="row__body">
            <p class="row__title">{{ r.rewardName }}</p>
            <p class="small muted">{{ r.customer.firstName }} {{ r.customer.lastName }} · <span class="tabular">{{ r.code }}</span> · vence {{ format.shortDate(r.expiresAt) }}</p>
          </div>
          <BaseButton size="sm" :loading="delivering === r.code" loading-text="Validando" @click="deliver(r.code)">Entregar</BaseButton>
        </li>
      </ul>
      <EmptyState v-else icon="package-check" title="No hay canjes pendientes" text="Cuando un cliente canjee una recompensa, aparece acá hasta que se la entregues." />
    </section>

    <ScannerSheet v-if="scanning" title="Escanear canje" placeholder="Código del canje" :suggestions="scanning" :submit="onScan" @close="scanning = null" />
  </div>
</template>
