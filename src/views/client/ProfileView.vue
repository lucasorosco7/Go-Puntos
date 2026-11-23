<!--
  Perfil del cliente. Acá viven las rachas y los desafíos (no en Mis
  puntos), el camino de niveles del negocio activo, los negocios en los
  que participa, el acceso a sus paneles (si tiene un rol en algún negocio),
  las notificaciones push y los datos de la cuenta.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import ThemeModePicker from '../../components/base/ThemeModePicker.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import BusinessLogo from '../../components/brand/BusinessLogo.vue';
import BellButton from '../../components/loyalty/BellButton.vue';
import ChallengeItem from '../../components/loyalty/ChallengeItem.vue';
import LevelBadge from '../../components/loyalty/LevelBadge.vue';
import NoBusinessState from '../../components/loyalty/NoBusinessState.vue';
import StreakCard from '../../components/loyalty/StreakCard.vue';
import { useAsync } from '../../composables/useAsync.js';
import { useForm } from '../../composables/useForm.js';
import { useSessionActions } from '../../composables/useSessionActions.js';
import { toast } from '../../composables/useToast.js';
import { STAFF_ROLES } from '../../config/catalogs.js';
import { APP_LINKS } from '../../config/navigation.js';
import { authService } from '../../services/authService.js';
import { customerService } from '../../services/customerService.js';
import { pushService } from '../../services/pushService.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCustomerStore } from '../../stores/customer.js';
import { format } from '../../utils/format.js';
import { validators as v } from '../../utils/validators.js';

const auth = useAuthStore();
const customer = useCustomerStore();
const { logout, switchContext } = useSessionActions();

const { data: d, error, run } = useAsync(async () => {
  const r = await customerService.getProfile();
  Object.assign(profile.values, pick(r.user));
  return r;
});
onMounted(run);
const noBusiness = computed(() => error.value?.details?.code === 'NO_MEMBERSHIP');
const user = computed(() => d.value?.user || auth.user);

/* ---------- Camino de niveles ---------- */
const nextMonth = computed(() => format.period(d.value.levelInfo.nextPeriod));
/** Estado de cada nivel respecto del vigente y del ya asegurado para el mes que viene. */
function tierState(t) {
  const current = d.value.levelInfo.level;
  const done = t.minPoints <= current.minPoints;
  const isCurrent = t.id === current.id;
  return { done, isCurrent, isEarned: t.id === d.value.levelInfo.earned.id && !isCurrent, cls: isCurrent ? 'is-current' : done ? 'is-done' : '' };
}
/** Beneficios del nivel (agrega el % extra de puntos si aplica y no está escrito). */
function perksOf(t) {
  const perks = [...(t.benefits || [])];
  if (t.multiplier > 1 && d.value.business.pointsRule.applyLevelMultiplier && !perks.some((p) => p.includes('%'))) {
    perks.unshift(`${Math.round((t.multiplier - 1) * 100)}% más de puntos por compra`);
  }
  return perks;
}

function chooseBusiness(id) {
  if (id !== d.value.business.id) customer.switchTo(id);
}

/* ---------- Notificaciones del teléfono ---------- */
const pushOn = ref(pushService.enabled());
async function togglePush() {
  if (pushService.enabled()) {
    pushService.disable();
    toast('Notificaciones desactivadas en este teléfono.');
  } else {
    try { await pushService.enable(); toast('¡Listo! Vas a recibir notificaciones.'); } catch (err) { toast(err.message, 'error'); }
  }
  pushOn.value = pushService.enabled();
}

/* ---------- Datos personales ---------- */
const pick = (u) => ({ firstName: u?.firstName || '', lastName: u?.lastName || '', email: u?.email || '', phone: u?.phone || '' });
const profile = useForm(pick(auth.user), {
  firstName: [v.required('nombre')], lastName: [v.required('apellido')],
  email: [v.required('email'), v.email], phone: [v.required('teléfono'), v.phone],
}, { idPrefix: 'perfil' });

async function saveProfile() {
  const saved = await profile.submit((values) => authService.updateProfile(values));
  if (!saved) return;
  auth.setUser({ ...auth.user, ...saved });
  toast('Datos actualizados.');
}

/* ---------- Contraseña ---------- */
const password = useForm({ current: '', password: '', confirm: '' }, {
  current: [v.required('contraseña actual')],
  password: [v.required('nueva contraseña'), v.password],
  confirm: [v.required('confirmación'), v.matches('password')],
}, { idPrefix: 'clave' });

async function savePassword() {
  const ok = await password.submit((values) => authService.changePassword(values));
  if (!ok) return;
  password.reset({ current: '', password: '', confirm: '' });
  toast('Contraseña actualizada.');
}
</script>

<template>
  <ScreenHead title="Perfil"><template #end><BellButton /></template></ScreenHead>

  <!-- Encabezado de la persona en el negocio activo -->
  <div class="profile-head">
    <UserAvatar :user="user" :size="86" />
    <h2 style="font-size: var(--fs-xl); margin-top: var(--sp-3)">{{ user.firstName }} {{ user.lastName }}</h2>
    <template v-if="d">
      <p class="small muted">En {{ d.business.name }} desde el {{ format.longDate(d.membership.joinedAt) }}</p>
      <div style="margin-top: var(--sp-2)"><LevelBadge :level="d.levelInfo.level" /></div>
      <router-link :to="APP_LINKS.qr" class="btn btn--outline" style="margin-top: var(--sp-4)"><BaseIcon name="qr-code" :size="18" /> Ver mi código</router-link>
    </template>
  </div>

  <!-- Rachas y desafíos (viven acá, no en Mis puntos) -->
  <template v-if="d && (d.business.streaks.enabled || d.business.challengesEnabled)">
    <div class="section-head" style="margin-top: 0"><h2>Tu actividad</h2></div>
    <div class="stack">
      <StreakCard v-if="d.business.streaks.enabled" :streak="d.streak" />
      <section v-if="d.business.challengesEnabled" class="card" aria-labelledby="ch-title">
        <div style="display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2)">
          <h2 id="ch-title">Desafíos</h2>
          <span v-if="d.completedCount" class="small muted">{{ format.plural(d.completedCount, 'completado', 'completados') }} en total</span>
        </div>
        <ul v-if="d.challenges.length"><ChallengeItem v-for="c in d.challenges" :key="c.id" :challenge="c" /></ul>
        <EmptyState v-else icon="target" title="Todavía no participás de ningún desafío" :text="`Cuando ${d.business.name} lance un desafío, lo vas a ver acá y te avisamos con una notificación.`" />
      </section>
    </div>
  </template>

  <!-- Camino de niveles del negocio activo -->
  <section aria-labelledby="nivel-title">
    <div class="section-head"><h2 id="nivel-title">Niveles de <span>{{ customer.business?.name || 'tu comercio' }}</span></h2></div>
    <div class="card">
      <SkeletonBlock v-if="!d && !error" height="160px" />
      <NoBusinessState v-else-if="noBusiness" text="Escaneá el QR del local para empezar a sumar puntos." />
      <BaseAlert v-else-if="error" tone="error" title="No pudimos cargar tu perfil" :text="error.message" />
      <template v-else>
        <p class="small muted" style="margin-bottom: var(--sp-4)">
          Los puntos que sumás con tus compras en un mes definen tu nivel del <b>mes siguiente</b>.
          Este mes llevás <b class="tabular">{{ format.points(d.levelInfo.periodPoints) }}</b>
          <template v-if="d.levelInfo.earned.minPoints > 0"> y ya aseguraste <b>{{ d.levelInfo.earned.name }}</b> para {{ nextMonth }}</template>
          <template v-else> para tu nivel de {{ nextMonth }}</template>.
          Canjear no te baja de nivel.
        </p>
        <div v-for="(t, i) in d.levels" :key="t.id" class="tier-step">
          <div class="tier-step__rail">
            <span class="tier-step__dot" :class="tierState(t).cls">
              <BaseIcon :name="tierState(t).done && !tierState(t).isCurrent ? 'check' : t.icon || 'medal'" :size="16" />
            </span>
            <span v-if="i < d.levels.length - 1" class="tier-step__line"></span>
          </div>
          <div class="tier-step__body">
            <p style="font-weight: var(--fw-medium)">
              {{ t.name }}
              <span v-if="tierState(t).isCurrent" class="pill pill--green" style="margin-left: 6px">Tu nivel</span>
              <span v-if="tierState(t).isEarned" class="pill pill--honey" style="margin-left: 6px">Asegurado para {{ nextMonth }}</span>
            </p>
            <p class="small muted">{{ t.minPoints === 0 ? 'Desde que te sumás' : `${format.points(t.minPoints)} puntos en el mes` }}</p>
            <p v-if="t.description" class="small">{{ t.description }}</p>
            <p v-if="perksOf(t).length" class="small">{{ perksOf(t).join(' · ') }}</p>
          </div>
        </div>
      </template>
    </div>
  </section>

  <!-- Negocios de la cuenta -->
  <section aria-labelledby="negocios-title">
    <div class="section-head"><h2 id="negocios-title">Mis negocios</h2></div>
    <ul class="stack">
      <li v-for="x in d?.memberships || []" :key="x.business.id">
        <button type="button" class="row biz-list__item" :class="{ 'is-on': x.business.id === d.business.id }" @click="chooseBusiness(x.business.id)">
          <BusinessLogo :business="x.business" :size="44" />
          <span class="row__body">
            <span class="row__title">{{ x.business.name }}</span>
            <span class="small muted">{{ format.points(x.membership.balance) }} pts · Nivel {{ x.levelInfo.level.name }}</span>
          </span>
          <span v-if="x.business.id === d.business.id" class="pill pill--green">Viendo</span>
          <BaseIcon v-else name="chevron-right" :size="18" />
        </button>
      </li>
    </ul>
  </section>

  <!-- Paneles de la misma cuenta (si tiene un rol en algún negocio) -->
  <template v-if="auth.access.staff.length">
    <div class="section-head"><h2>Tus paneles</h2></div>
    <ul class="stack">
      <li v-for="x in auth.access.staff" :key="x.businessId">
        <button type="button" class="row" @click="switchContext({ type: 'staff', businessId: x.businessId })">
          <span class="art art--general" style="width: 44px; height: 44px" aria-hidden="true"><BaseIcon name="store" :size="20" /></span>
          <span class="row__body">
            <span class="row__title">{{ x.businessName }}</span>
            <span class="small muted">{{ STAFF_ROLES[x.role] || x.role }} · Ir al panel</span>
          </span>
          <BaseIcon name="chevron-right" :size="18" />
        </button>
      </li>
    </ul>
  </template>

  <div class="section-head"><h2>Cuenta</h2></div>

  <!-- Apariencia: modo claro, oscuro o automático (preferencia de la persona) -->
  <details class="fold">
    <summary><BaseIcon name="moon" :size="19" /> Apariencia <BaseIcon name="chevron-down" :size="18" /></summary>
    <div class="fold__body">
      <p class="small muted">Elegí cómo ver la app. "Automático" sigue la configuración de tu teléfono. Se guarda en tu cuenta.</p>
      <ThemeModePicker />
    </div>
  </details>

  <!-- Notificaciones del teléfono -->
  <details class="fold">
    <summary><BaseIcon name="bell-ring" :size="19" /> Notificaciones del teléfono <BaseIcon name="chevron-down" :size="18" /></summary>
    <div class="fold__body">
      <p class="small muted">Te avisamos cuando estés por perder tu racha, completes un desafío o haya una oferta nueva.
        También las ves siempre en la campana <BaseIcon name="bell" :size="13" />.</p>
      <button v-if="pushService.supported()" type="button" class="btn btn--block" :class="{ 'btn--outline': pushOn }" @click="togglePush">
        {{ pushOn ? 'Desactivar en este teléfono' : 'Activar notificaciones' }}
      </button>
      <BaseAlert v-else tone="info" title="Tu navegador no admite notificaciones" text="Igual vas a ver todos los avisos en la campana." />
    </div>
  </details>

  <!-- Datos personales -->
  <details class="fold">
    <summary><BaseIcon name="user-round" :size="19" /> Datos personales <BaseIcon name="chevron-down" :size="18" /></summary>
    <form class="fold__body" novalidate @submit.prevent="saveProfile">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="profile.alert.value" v-bind="profile.alert.value" /></div>
      <div class="auth-form__pair">
        <BaseField v-model="profile.values.firstName" id-prefix="perfil" name="firstName" label="Nombre" icon="user-round" :error="profile.errors.firstName" autocomplete="given-name" />
        <BaseField v-model="profile.values.lastName" id-prefix="perfil" name="lastName" label="Apellido" :error="profile.errors.lastName" autocomplete="family-name" />
      </div>
      <BaseField v-model="profile.values.email" id-prefix="perfil" name="email" label="Email" type="email" icon="mail" :error="profile.errors.email" autocomplete="email" />
      <BaseField v-model="profile.values.phone" id-prefix="perfil" name="phone" label="Teléfono" type="tel" icon="phone" :error="profile.errors.phone" autocomplete="tel" />
      <BaseButton type="submit" block :loading="profile.busy.value" loading-text="Guardando">Guardar cambios</BaseButton>
    </form>
  </details>

  <!-- Cambiar contraseña -->
  <details class="fold">
    <summary><BaseIcon name="lock" :size="19" /> Cambiar contraseña <BaseIcon name="chevron-down" :size="18" /></summary>
    <form class="fold__body" novalidate @submit.prevent="savePassword">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="password.alert.value" v-bind="password.alert.value" /></div>
      <BaseField v-model="password.values.current" id-prefix="clave" name="current" label="Contraseña actual" type="password" icon="lock" :error="password.errors.current" autocomplete="current-password" />
      <BaseField
        v-model="password.values.password" id-prefix="clave" name="password" label="Nueva contraseña" type="password" icon="lock"
        :error="password.errors.password" autocomplete="new-password" hint="Mínimo 8 caracteres, con letras y números."
      />
      <BaseField v-model="password.values.confirm" id-prefix="clave" name="confirm" label="Repetí la nueva" type="password" icon="lock" :error="password.errors.confirm" autocomplete="new-password" />
      <BaseButton type="submit" variant="outline" block :loading="password.busy.value" loading-text="Actualizando">Actualizar contraseña</BaseButton>
    </form>
  </details>

  <button type="button" class="btn btn--outline btn--block" style="margin-top: var(--sp-5); color: var(--danger)" @click="logout">
    <BaseIcon name="log-out" :size="18" /> Cerrar sesión
  </button>
</template>
