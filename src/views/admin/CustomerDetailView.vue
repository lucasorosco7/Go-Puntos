<!--
  Ficha completa de un cliente en ESTE negocio: datos, saldo, puntos del
  mes, nivel y progreso, ranking, compras, movimientos, canjes, desafíos,
  racha e historial mensual.
  Acciones: registrar compra, mensaje (campaña individual) y ajuste de saldo.
  El ajuste corrige el SALDO; no cambia el nivel ni el ranking.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BaseSheet from '../../components/base/BaseSheet.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import ChallengeItem from '../../components/loyalty/ChallengeItem.vue';
import LevelCard from '../../components/loyalty/LevelCard.vue';
import MovementList from '../../components/loyalty/MovementList.vue';
import StreakCard from '../../components/loyalty/StreakCard.vue';
import { useAsync } from '../../composables/useAsync.js';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { CUSTOMER_STATUS, SEGMENTS } from '../../domain/segments.js';
import { campaignService } from '../../services/campaignService.js';
import { customerService } from '../../services/customerService.js';
import { format } from '../../utils/format.js';
import { validators as v } from '../../utils/validators.js';

const route = useRoute();
const id = Number(route.params.id);
const { data: d, error, run } = useAsync(() => customerService.getDetail(id));
onMounted(run);

/* ---------- Movimientos ---------- */
const MOV_TABS = [['todos', 'Todos'], ['compra', 'Compras'], ['canje', 'Canjes'], ['bonificacion', 'Bonos'], ['desafio', 'Desafíos'], ['premio', 'Premios'], ['ajuste', 'Ajustes']];
const movFilter = ref('todos');
const movements = computed(() => (movFilter.value === 'todos' ? d.value.movements : d.value.movements.filter((m) => m.type === movFilter.value)).slice(0, 40));

/* ---------- Ajustar saldo ---------- */
const adjusting = ref(false);
const adjust = useForm({ points: '', reason: '' }, { reason: [v.filled('Contá el motivo del ajuste.')], points: [(x) => (Number(x) ? '' : 'Ingresá una cantidad distinta de cero.')] }, { idPrefix: 'ajuste' });
async function saveAdjust(close) {
  const ok = await adjust.submit((values) => customerService.adjustPoints(id, { points: Number(values.points), reason: values.reason }));
  if (!ok) return;
  close();
  toast('Ajuste registrado.');
  run();
}

/* ---------- Mensaje individual (campaña a un solo cliente) ---------- */
const messaging = ref(false);
const msg = useForm({ title: '', message: '' }, {}, { idPrefix: 'msg' });
async function sendMessage(close) {
  const ok = await msg.submit((values) => campaignService.send({ ...values, audience: { type: 'manual', membershipIds: [id] } }));
  if (!ok) return;
  close();
  toast('Mensaje enviado.');
}
function openSheet(which) {
  if (which === 'adjust') { adjust.reset({ points: '', reason: '' }); adjusting.value = true; }
  else { msg.reset({ title: '', message: '' }); messaging.value = true; }
}
</script>

<template>
  <PageLoading v-if="!d && !error" />
  <PageError v-else-if="error" title="No pudimos cargar la ficha" :error="error" @retry="run" />

  <template v-else>
    <router-link class="link" :to="{ name: 'admin-customers' }"><BaseIcon name="arrow-left" :size="15" /> Clientes</router-link>

    <!-- Encabezado del cliente -->
    <header class="cust-head" style="margin: var(--sp-3) 0 var(--sp-5)">
      <UserAvatar :user="d.user" :size="64" />
      <div class="cust-head__body">
        <h1 class="cust-head__name">{{ d.user.firstName }} {{ d.user.lastName }}</h1>
        <p class="small muted">{{ d.user.email }} · {{ d.user.phone }} · <span class="tabular">{{ d.membership.code }}</span></p>
        <div class="check-list">
          <StatusPill :meta="CUSTOMER_STATUS[d.row.status]" />
          <StatusPill v-for="s in d.row.segments" :key="s" :meta="SEGMENTS[s]" />
          <span v-if="d.otherBusinesses" class="pill pill--sky"><BaseIcon name="store" :size="12" /> También usa GO Puntos en {{ d.otherBusinesses }} {{ d.otherBusinesses === 1 ? 'negocio' : 'negocios' }}</span>
        </div>
      </div>
      <div class="btn-row">
        <router-link class="btn" :to="{ name: 'admin-cashier', query: { cliente: d.membership.id } }"><BaseIcon name="scan-line" :size="17" /> Registrar compra</router-link>
        <button type="button" class="btn btn--outline" @click="openSheet('message')"><BaseIcon name="send" :size="16" /> Mensaje</button>
        <button type="button" class="btn btn--ghost" @click="openSheet('adjust')"><BaseIcon name="sliders-horizontal" :size="16" /> Ajustar saldo</button>
      </div>
    </header>

    <!-- Indicadores: el saldo y los puntos del mes son cosas distintas -->
    <div class="grid grid--stats">
      <StatTile label="Saldo disponible" :value="format.points(d.membership.balance)" icon="wallet" tone="accent" hint="Para canjear" />
      <StatTile :label="`Puntos de ${format.period(d.business.currentPeriod)}`" :value="format.points(d.membership.periodPoints)" icon="leaf" hint="Nivel, ranking y desafíos" />
      <StatTile label="Ranking" :value="d.row.position ? `#${d.row.position}` : '—'" icon="trophy" :hint="d.row.position ? `de ${d.stats.rankingTotal}` : 'Sin puntos este mes'" />
      <StatTile label="Compras" :value="format.points(d.membership.purchasesCount)" icon="shopping-bag" :hint="`Ticket promedio ${format.currency(d.stats.avgTicket)}`" />
      <StatTile label="Total gastado" :value="format.currency(d.stats.spent)" icon="banknote" />
      <StatTile
        label="Última actividad" :value="d.membership.lastPurchaseAt ? format.relative(d.membership.lastPurchaseAt) : 'Nunca'" icon="clock"
        :hint="`Cliente desde el ${format.shortDate(d.membership.joinedAt)}`"
      />
    </div>

    <div class="profile-grid" style="margin-top: var(--sp-4)">
      <div class="stack">
        <LevelCard :info="d.levelInfo" :period="d.business.currentPeriod" />
        <StreakCard v-if="d.business.streaks.enabled" :streak="d.streak" />
        <!-- Desafíos -->
        <section class="panel-card">
          <div class="panel-card__head"><h2>Desafíos</h2></div>
          <ul v-if="d.challenges.length"><ChallengeItem v-for="c in d.challenges" :key="c.id" :challenge="c" /></ul>
          <EmptyState v-else icon="target" title="No participa de desafíos activos" text="Creá uno desde Desafíos y rachas." />
        </section>
        <!-- Historial mensual (cierres de período) -->
        <section class="panel-card">
          <div class="panel-card__head"><h2>Historial mensual</h2></div>
          <div v-if="d.membership.history.length" class="table-wrap">
            <table class="table">
              <thead><tr><th>Mes</th><th class="num">Puntos</th><th>Nivel vigente</th><th>Ganó para el mes siguiente</th><th class="num">Puesto</th></tr></thead>
              <tbody>
                <tr v-for="h in [...d.membership.history].reverse()" :key="h.period">
                  <td>{{ format.periodTitle(h.period) }}</td><td class="num">{{ format.points(h.points) }}</td><td>{{ h.levelName }}</td>
                  <td>{{ h.earnedLevelName || '—' }}</td><td class="num">{{ h.position ? `#${h.position}` : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <EmptyState v-else icon="calendar" title="Todavía no hay meses cerrados" text="Al cerrar cada mes se guarda su nivel, puntos y puesto." />
        </section>
      </div>

      <div class="stack">
        <!-- Canjes -->
        <section class="panel-card">
          <div class="panel-card__head"><h2>Canjes</h2></div>
          <ul v-if="d.redemptions.length" class="stack">
            <li v-for="x in d.redemptions" :key="x.id" class="row">
              <div class="row__body">
                <p class="row__title">{{ x.rewardName }}</p>
                <p class="small muted"><span class="tabular">{{ x.code }}</span> · {{ format.shortDate(x.createdAt) }}{{ x.validatedByName ? ` · entregó ${x.validatedByName}` : '' }}</p>
              </div>
              <StatusPill :meta="Rewards.REDEMPTION_STATUS[x.status]" />
            </li>
          </ul>
          <EmptyState v-else icon="gift" title="Todavía no canjeó recompensas" text="Cuando canjee, vas a ver acá el código y quién lo entregó." />
        </section>
        <!-- Movimientos -->
        <section class="panel-card">
          <div class="panel-card__head"><h2>Movimientos</h2></div>
          <ChipTabs v-model="movFilter" :items="MOV_TABS" label="Tipo de movimiento" />
          <div>
            <MovementList v-if="movements.length" :movements="movements" show-balance />
            <EmptyState v-else icon="receipt" title="Sin movimientos de este tipo" text="Probá con otro filtro." />
          </div>
        </section>
      </div>
    </div>

    <!-- Ajustar saldo -->
    <BaseSheet v-if="adjusting" title="Ajustar saldo" description="Para corregir errores. Suma o resta del saldo disponible; no cambia nivel ni ranking." size="lg" @close="adjusting = false">
      <form class="form-grid" novalidate @submit.prevent>
        <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
        <div><BaseAlert v-if="adjust.alert.value" v-bind="adjust.alert.value" /></div>
        <BaseField v-model="adjust.values.points" id-prefix="ajuste" name="points" label="Puntos (usá - para restar)" type="number" placeholder="Ej.: 150 o -80" :error="adjust.errors.points" />
        <BaseField v-model="adjust.values.reason" id-prefix="ajuste" name="reason" label="Motivo" placeholder="Ej.: Compra no registrada el 12/09" :error="adjust.errors.reason" />
      </form>
      <template #actions="{ close }">
        <button type="button" class="btn btn--ghost" @click="close()">Cancelar</button>
        <BaseButton :loading="adjust.busy.value" loading-text="Guardando" @click="saveAdjust(close)">Guardar ajuste</BaseButton>
      </template>
    </BaseSheet>

    <!-- Mensaje individual -->
    <BaseSheet v-if="messaging" :title="`Mensaje a ${d.user.firstName}`" description="Le llega como notificación en la app (y push, cuando esté disponible)." size="lg" @close="messaging = false">
      <form class="form-grid" novalidate @submit.prevent>
        <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
        <div><BaseAlert v-if="msg.alert.value" v-bind="msg.alert.value" /></div>
        <BaseField v-model="msg.values.title" id-prefix="msg" name="title" label="Título" placeholder="Ej.: ¡Gracias por tu compra!" :error="msg.errors.title" />
        <BaseField v-model="msg.values.message" id-prefix="msg" name="message" label="Mensaje" type="textarea" :error="msg.errors.message" />
      </form>
      <template #actions="{ close }">
        <button type="button" class="btn btn--ghost" @click="close()">Cancelar</button>
        <BaseButton :loading="msg.busy.value" loading-text="Enviando" @click="sendMessage(close)">Enviar</BaseButton>
      </template>
    </BaseSheet>
  </template>
</template>
