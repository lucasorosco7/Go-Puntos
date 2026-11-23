<!--
  Caja · Pasos 2 y 3: importe de la compra y puntos a acreditar.
  La cotización la calcula SIEMPRE el servidor (pointsService.quote) con el
  orden único de domain/points.js: importe → base → nivel vigente →
  promociones (multiplicadoras no acumulables; puntos extra después) →
  redondeo final. Cada línea del desglose muestra el subtotal.
-->
<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { offers as Offers } from '../../domain/offers.js';
import { points as Points } from '../../domain/points.js';
import { pointsService } from '../../services/pointsService.js';
import { format } from '../../utils/format.js';
import { debounce } from '../../utils/helpers.js';
import CustomerChip from '../admin/CustomerChip.vue';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';

const props = defineProps({
  /** Tarjeta de caja: { user, membership, levelInfo, offers, pendingRedemptions, streak, rule } */
  card: { type: Object, required: true },
});
const emit = defineEmits(['change', 'done', 'deliver']);

const m = computed(() => props.card.membership);
const form = reactive({
  amount: '',
  // Las ofertas automáticas vienen marcadas
  offerIds: props.card.offers.filter((o) => o.autoApply).map((o) => o.id),
  note: '',
});
const quote = ref(null);
const error = ref('');
const busy = ref(false);

/** Pide la cotización al servidor cada vez que cambia el importe o las ofertas. */
const refresh = debounce(async () => {
  const amount = Number(form.amount);
  if (!(amount > 0)) { quote.value = null; return; }
  try {
    quote.value = await pointsService.quote({ membershipId: m.value.id, amount, offerIds: form.offerIds.map(Number) });
    error.value = '';
  } catch (err) { error.value = err.message; }
}, 120);
watch(() => [form.amount, [...form.offerIds]], refresh);

async function confirm() {
  if (!quote.value) return;
  busy.value = true;
  try {
    const res = await pointsService.registerPurchase({ membershipId: m.value.id, amount: Number(form.amount), offerIds: form.offerIds.map(Number), note: form.note });
    emit('done', res);
  } catch (err) {
    error.value = err.message;
    busy.value = false;
  }
}

const levelText = computed(() => {
  const l = props.card.levelInfo.level;
  return l.multiplier > 1 ? ` · Nivel ${l.name} x${String(l.multiplier).replace('.', ',')}` : '';
});

onMounted(async () => { await nextTick(); document.getElementById('f-amount')?.focus(); });
</script>

<template>
  <div class="till">
    <section class="panel-card">
      <!-- Cliente elegido -->
      <div style="display: flex; align-items: center; gap: var(--sp-3); justify-content: space-between; flex-wrap: wrap">
        <CustomerChip :user="card.user" :level="card.levelInfo.level"><span class="tabular">{{ m.code }}</span></CustomerChip>
        <button type="button" class="btn btn--ghost btn--sm" @click="emit('change')"><BaseIcon name="repeat" :size="16" /> Cambiar cliente</button>
      </div>
      <dl class="kv" style="margin-top: var(--sp-3)">
        <div><dt>Saldo disponible</dt><dd class="tabular">{{ format.points(m.balance) }} pts</dd></div>
        <div><dt>Puntos del mes</dt><dd class="tabular">{{ format.points(m.periodPoints) }} pts</dd></div>
        <div v-if="card.streak.weeks >= 2"><dt>Racha</dt><dd>🔥 {{ card.streak.weeks }} semanas{{ card.streak.activeThisWeek ? '' : ' (en riesgo)' }}</dd></div>
      </dl>

      <!-- Canjes pendientes de entrega -->
      <div v-if="card.pendingRedemptions.length" class="nudge nudge--honey" style="margin-top: var(--sp-3)">
        <BaseIcon name="gift" :size="18" />
        <span>Tiene {{ format.plural(card.pendingRedemptions.length, 'canje', 'canjes') }} para retirar: {{ card.pendingRedemptions.map((r) => r.rewardName).join(', ') }}</span>
        <button type="button" class="btn btn--sm" @click="emit('deliver', card.pendingRedemptions[0].code)">Entregar</button>
      </div>

      <!-- Importe y ofertas -->
      <form novalidate style="margin-top: var(--sp-5); display: grid; gap: var(--sp-4)" @submit.prevent="confirm">
        <h2>2. Importe de la compra</h2>
        <div class="till__amount">
          <BaseField v-model="form.amount" name="amount" label="Importe en pesos" type="number" icon="dollar-sign" min="1" inputmode="decimal" placeholder="0" :error="error" />
        </div>
        <fieldset v-if="card.offers.length" class="fieldset">
          <legend>Ofertas de puntos vigentes</legend>
          <div class="check-list">
            <label v-for="o in card.offers" :key="o.id" class="check-chip">
              <input v-model="form.offerIds" type="checkbox" name="offerIds" :value="o.id" />
              <span><BaseIcon :name="Offers.TYPES[o.type].icon" :size="13" /> {{ o.title }} · {{ Offers.tag(o) }}</span>
            </label>
          </div>
          <p class="field__hint">
            Las promociones multiplicadoras no se acumulan: se aplica la de mayor multiplicador.{{ card.offers.some((o) => !o.autoApply) ? ' Las de puntos extra marcalas sólo si el cliente cumple la condición.' : '' }}
          </p>
        </fieldset>
        <BaseField v-model="form.note" name="note" label="Nota (opcional)" placeholder="Ej.: Ticket 0003-12345" />
      </form>
    </section>

    <!-- Cotización -->
    <aside class="panel-card" style="position: sticky; top: var(--sp-4)">
      <h2 style="margin-bottom: var(--sp-3)">3. Puntos a acreditar</h2>
      <div>
        <EmptyState v-if="!quote" icon="calculator" title="Ingresá el importe" text="El cálculo aparece acá al instante." />
        <template v-else>
          <ul class="breakdown">
            <li v-for="(l, i) in quote.lines" :key="i"><span>{{ l.label }}</span><span class="tabular">{{ l.kind === 'base' ? '' : '→ ' }}{{ Points.formatValue(l.value) }}</span></li>
            <li><span>Total</span><span class="tabular">+{{ format.points(quote.total) }}</span></li>
          </ul>
          <p v-if="quote.skipped?.length" class="small muted" style="margin-top: var(--sp-2)">
            <BaseIcon name="info" :size="13" /> No se acumula: {{ quote.skipped.map((o) => o.title).join(', ') }} (se aplica la de mayor multiplicador).
          </p>
          <BaseAlert v-if="quote.belowMinimum" tone="info" title="No llega a la compra mínima" text="La compra se registra pero no suma puntos." />
          <p class="small muted" style="margin-top: var(--sp-2)">
            Saldo después: <b class="tabular">{{ format.points(m.balance + quote.total) }}</b> · Puntos del mes: <b class="tabular">{{ format.points(m.periodPoints + quote.total) }}</b>
          </p>
        </template>
      </div>
      <BaseButton size="lg" block :disabled="!quote" :loading="busy" loading-text="Registrando" style="margin-top: var(--sp-4)" @click="confirm">
        {{ quote ? `Confirmar y sumar ${format.points(quote.total)} puntos` : 'Confirmar compra' }}
      </BaseButton>
      <p class="small muted" style="margin-top: var(--sp-2)"><BaseIcon name="info" :size="13" /> Regla: {{ Points.describeRule(card.rule) }}{{ levelText }}</p>
    </aside>
  </div>
</template>
