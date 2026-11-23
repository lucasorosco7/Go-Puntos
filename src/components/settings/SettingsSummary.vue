<!--
  Asistente · Resumen y activación: repasa cada paso con un enlace para
  editarlo (emite "goto" con el id del paso). Se puede activar sin
  recompensas y seguir ajustando después.
-->
<script setup>
import { computed } from 'vue';
import { levels as Levels } from '../../domain/levels.js';
import { notificationTypes } from '../../domain/notifications.js';
import { points as Points } from '../../domain/points.js';
import { resolvePalette } from '../../theme/palettes.js';
import { format } from '../../utils/format.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({ ctx: { type: Object, required: true } });
const emit = defineEmits(['reload', 'goto']);

const rows = computed(() => {
  const { business: b, levels, rewards, offers, challenges } = props.ctx;
  const pal = resolvePalette(b.paletteId, b.paletteVariant, b.customPalette);
  const prize = b.monthlyPrize;
  const notif = notificationTypes.configurable;
  return [
    ['store', 'Negocio', b.name || 'Sin nombre', 'info', Boolean(b.name)],
    ['palette', 'Identidad', pal.palette.custom ? `${pal.palette.name} (personalizada)` : `${pal.palette.name} · ${pal.variant.name}`, 'identity', true],
    ['calculator', 'Puntos', Points.describeRule(b.pointsRule) + (b.pointsRule.welcomeBonus ? ` · ${b.pointsRule.welcomeBonus} de bienvenida` : ''), 'points', true],
    ['medal', 'Niveles', Levels.sorted(levels).map((l) => `${l.name} (${format.points(l.minPoints)})`).join(' · '), 'levels', true],
    ['gift', 'Recompensas', rewards.length ? format.plural(rewards.length, 'recompensa', 'recompensas') : 'Ninguna todavía', 'rewards', rewards.length > 0],
    ['tag', 'Ofertas', offers.length ? format.plural(offers.length, 'oferta', 'ofertas') : 'Ninguna (opcional)', 'offers', true],
    ['trophy', 'Ranking', b.ranking.enabled ? 'Activo' : 'Desactivado', 'ranking', true],
    ['party-popper', 'Premio mensual', prize.enabled ? ({ puntos: `${prize.points} puntos`, recompensa: 'Recompensa del catálogo', texto: prize.description || 'Premio' })[prize.type] : 'Sin premio', 'prize', true],
    ['target', 'Desafíos y rachas', `${b.challengesEnabled ? `${challenges.length} desafíos` : 'Desafíos apagados'} · ${b.streaks.enabled ? 'rachas activas' : 'sin rachas'}`, 'challenges', true],
    ['bell-ring', 'Notificaciones', `${notif.filter((k) => b.notifications[k] !== false).length} de ${notif.length} avisos activos`, 'notifications', true],
  ];
});
defineExpose({ save: async () => null });
</script>

<template>
  <ul class="summary">
    <li v-for="[icon, label, value, step, ok] in rows" :key="step">
      <span class="summary__icon" :class="{ 'is-warn': !ok }"><BaseIcon :name="ok ? icon : 'circle-alert'" :size="18" /></span>
      <div><p class="small muted">{{ label }}</p><p>{{ value }}</p></div>
      <button type="button" class="link" @click="emit('goto', step)">Editar</button>
    </li>
  </ul>
  <BaseAlert
    v-if="ctx.business.status !== 'activo' && !ctx.rewards.some((r) => r.status === 'activa')" tone="info" title="Falta al menos una recompensa activa"
    text="GO Puntos revisa que tu programa tenga algo para canjear antes de aprobarlo. Cargá una recompensa y volvé a este paso."
  />
</template>
