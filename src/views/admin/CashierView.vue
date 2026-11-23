<!--
  Caja (dueño, administrador o empleado).
  Registrar compra: escanear QR o buscar → cliente → importe → puntos
  calculados por el servidor → confirmar → saldo y puntos del mes.
  Validar canje (?vista=canjes): código o QR → detalle → entregar.
  ?cliente=<membresía> abre la Caja con ese cliente ya elegido.
-->
<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHead from '../../components/admin/PageHead.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import CustomerPicker from '../../components/cashier/CustomerPicker.vue';
import PurchaseForm from '../../components/cashier/PurchaseForm.vue';
import PurchaseResult from '../../components/cashier/PurchaseResult.vue';
import RedemptionsPanel from '../../components/cashier/RedemptionsPanel.vue';
import { toast } from '../../composables/useToast.js';
import { customerService } from '../../services/customerService.js';
import { useAuthStore } from '../../stores/auth.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const tab = ref(route.query.vista === 'canjes' ? 'canjes' : 'compra');
/** Tarjeta del cliente elegido (o null). */
const card = ref(null);
/** Resultado de la última compra (o null). */
const result = ref(null);
/** Código de canje a buscar al pasar a "Validar canje" desde la tarjeta. */
const deliverCode = ref('');
/** Cambia para volver a montar el formulario con el mismo cliente. */
const formKey = ref(0);

// Si la URL cambia (por ejemplo, desde un enlace de una notificación), se actualiza la pestaña
watch(() => route.query.vista, () => { tab.value = route.query.vista === 'canjes' ? 'canjes' : 'compra'; });

function setTab(value) {
  tab.value = value;
  router.replace({ query: value === 'canjes' ? { vista: 'canjes' } : {} });
}

function onDone(res) {
  result.value = res;
  toast(`+${format.points(res.movement.points)} puntos para ${res.card.user.firstName}.`);
}
function newPurchase() { card.value = null; result.value = null; }
function samePurchase() { card.value = result.value.card; result.value = null; formKey.value += 1; }
function goDeliver(code) { deliverCode.value = code; setTab('canjes'); }

onMounted(async () => {
  if (route.query.cliente) {
    try { card.value = await customerService.getCashierCard(Number(route.query.cliente)); } catch (err) { toast(err.message, 'error'); }
  }
});
</script>

<template>
  <PageHead title="Caja" description="Registrá compras para acreditar puntos y entregá las recompensas canjeadas." />
  <ChipTabs :model-value="tab" :items="[['compra', 'Registrar compra'], ['canjes', 'Validar canje']]" @update:model-value="setTab" />

  <div>
    <template v-if="tab === 'compra'">
      <PurchaseResult v-if="result" :result="result" :can-see-customer="auth.isAdmin" @new="newPurchase" @same="samePurchase" />
      <PurchaseForm v-else-if="card" :key="`${card.membership.id}-${formKey}`" :card="card" @change="card = null" @done="onDone" @deliver="goDeliver" />
      <CustomerPicker v-else @pick="card = $event" />
    </template>
    <RedemptionsPanel v-else :key="deliverCode" :initial-code="deliverCode" />
  </div>
</template>
