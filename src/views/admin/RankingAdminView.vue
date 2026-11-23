<!--
  Ranking mensual y cierre del mes (dueño o administrador).
  Cierre: guarda ranking y posiciones, determina el ganador, entrega el
  premio (al saldo), guarda el nivel ganado por cada cliente para el mes
  siguiente, cierra las estadísticas y empieza el período nuevo
  reiniciando SÓLO los puntos del mes. El saldo y el historial no se tocan.
  En producción el cierre lo corre el servidor el día 1; este botón queda
  para cierres manuales y pruebas.
-->
<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import LevelBadge from '../../components/loyalty/LevelBadge.vue';
import RankingList from '../../components/loyalty/RankingList.vue';
import { useAsync } from '../../composables/useAsync.js';
import { confirm } from '../../composables/useConfirm.js';
import { toast } from '../../composables/useToast.js';
import { ranking as Ranking } from '../../domain/ranking.js';
import { rankingService } from '../../services/rankingService.js';
import { nextPeriod } from '../../utils/dates.js';
import { format } from '../../utils/format.js';

const router = useRouter();
const { data: d, error, run } = useAsync(() => rankingService.getForBusiness());
onMounted(run);

const next = computed(() => nextPeriod(d.value.period));
/** Texto del premio configurado. */
function prizeText(p, rewards) {
  if (!p?.enabled) return 'Sin premio configurado';
  if (p.type === 'puntos') return `${format.points(p.points)} puntos extra`;
  if (p.type === 'recompensa') return rewards.find((r) => r.id === p.rewardId)?.name || 'Recompensa';
  return p.description || 'Premio especial';
}

async function closeMonth() {
  const b = d.value.business;
  const winner = d.value.list[0];
  const nextName = format.period(next.value, true);
  const ok = await confirm({
    title: `¿Cerrar ${format.period(d.value.period, true)}?`,
    description: 'Este paso normalmente es automático al terminar el mes.',
    items: [
      `Se guarda el ranking final (${format.plural(d.value.list.length, 'participante', 'participantes')}).`,
      winner && b.ranking.enabled ? `Ganador: **${winner.fullName}** con ${format.points(winner.points)} pts.` : 'No hay ganador.',
      b.monthlyPrize.enabled && winner && b.ranking.enabled ? `Se entrega el premio: ${prizeText(b.monthlyPrize, d.value.rewards)}.` : 'Sin premio para entregar.',
      `Con los puntos de este mes se calcula el nivel de cada cliente y se aplica durante ${nextName}.`,
      `Empieza ${nextName}: los **puntos del mes** vuelven a 0.`,
      '**No** se toca el saldo disponible ni el historial.',
    ],
    confirmText: 'Cerrar el mes',
  });
  if (!ok) return;
  try {
    const c = await rankingService.closePeriod();
    toast(`${format.periodTitle(c.period)} cerrado.${c.winner ? ` Ganó ${c.winner.name}.` : ''}`);
    run();
  } catch (err) { toast(err.message, 'error'); }
}
const open = (r) => router.push({ name: 'admin-customer', params: { id: r.membershipId } });
</script>

<template>
  <PageLoading v-if="!d && !error" />
  <PageError v-else-if="error" title="No pudimos cargar el ranking" :error="error" @retry="run" />

  <template v-else>
    <PageHead :title="`Ranking de ${format.period(d.period, true)}`" description="Ordenado por los puntos que cada cliente sumó en el mes. Los canjes no restan.">
      <router-link class="btn btn--outline" :to="{ name: 'admin-settings', params: { section: 'ranking' } }"><BaseIcon name="settings" :size="16" /> Configurar</router-link>
      <button type="button" class="btn" @click="closeMonth"><BaseIcon name="calendar-check" :size="17" /> Cerrar el mes</button>
    </PageHead>
    <BaseAlert v-if="d.periodEnded" tone="info" :title="`${format.periodTitle(d.period)} ya terminó`" text="Cerrá el mes para guardar el ranking, entregar el premio y empezar el nuevo período." />
    <BaseAlert v-if="!d.business.ranking.enabled" tone="info" title="El ranking está desactivado" text="Tus clientes no lo ven. Igual se guarda el historial de puntos por mes." />

    <div class="grid grid--stats" style="margin-top: var(--sp-4)">
      <StatTile label="Participantes" :value="format.points(d.list.length)" icon="users" :hint="`de ${d.members} clientes`" />
      <StatTile label="Puntero" :value="d.list[0] ? d.list[0].name : '—'" icon="crown" :hint="d.list[0] ? `${format.points(d.list[0].points)} pts` : ''" />
      <StatTile label="Premio del mes" :value="prizeText(d.business.monthlyPrize, d.rewards)" icon="party-popper" compact />
      <StatTile label="Próximo período" :value="format.periodTitle(next)" icon="calendar" hint="Empieza el 1° automáticamente" compact />
    </div>

    <div class="grid grid--main" style="margin-top: var(--sp-4)">
      <!-- Posiciones del mes en curso -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Posiciones</h2></div>
        <div v-if="d.list.length" class="table-wrap">
          <table class="table table--cards">
            <thead><tr><th class="num">#</th><th>Cliente</th><th>Nivel</th><th class="num">Compras</th><th class="num">Puntos del mes</th></tr></thead>
            <tbody>
              <tr v-for="r in d.list" :key="r.membershipId" :data-href="`/panel/clientes/${r.membershipId}`" tabindex="0" @click="open(r)" @keydown.enter="open(r)">
                <td class="num"><b>{{ Ranking.medal(r.position) || r.position }}</b></td>
                <td data-label="Cliente">{{ r.fullName }}</td>
                <td data-label="Nivel"><LevelBadge :level="r.level" size="sm" /></td>
                <td class="num" data-label="Compras">{{ r.purchases }}</td>
                <td class="num" data-label="Puntos del mes"><b>{{ format.points(r.points) }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState v-else icon="trophy" title="Todavía no comenzó el ranking" text="Con la primera compra del mes aparece el primer participante." />
      </section>

      <!-- Historial de cierres -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Meses cerrados</h2></div>
        <ul v-if="d.closes.length" class="stack">
          <li v-for="c in d.closes" :key="c.period">
            <details class="fold">
              <summary>
                <BaseIcon name="crown" :size="18" /> {{ format.periodTitle(c.period) }}
                <span class="small muted" style="font-weight: 400">{{ c.winner ? c.winner.name : 'Sin ganador' }}</span>
                <BaseIcon name="chevron-down" :size="16" />
              </summary>
              <div class="fold__body">
                <dl class="kv">
                  <div><dt>Ganador</dt><dd>{{ c.winner ? `${c.winner.fullName} · ${format.points(c.winner.points)} pts` : '—' }}</dd></div>
                  <div><dt>Premio</dt><dd>{{ c.prize ? c.prize.description : '—' }}</dd></div>
                  <div><dt>Participantes</dt><dd>{{ c.participants }}</dd></div>
                  <div><dt>Compras</dt><dd>{{ format.points(c.stats.purchases) }} · {{ format.currency(c.stats.revenue) }}</dd></div>
                  <div><dt>Puntos otorgados / canjeados</dt><dd>{{ format.points(c.stats.pointsIssued) }} / {{ format.points(c.stats.pointsRedeemed) }}</dd></div>
                  <div><dt>Nuevos clientes</dt><dd>{{ c.stats.newCustomers }}</dd></div>
                  <div><dt>Cerrado</dt><dd>{{ format.dateTime(c.closedAt) }}</dd></div>
                </dl>
                <RankingList v-if="c.ranking.length" :rows="c.ranking.slice(0, 5)" />
              </div>
            </details>
          </li>
        </ul>
        <EmptyState v-else icon="calendar" title="Todavía no hay meses cerrados" text="Al cerrar el primer mes vas a ver acá el ganador, el premio y las estadísticas." />
      </section>
    </div>
  </template>
</template>
