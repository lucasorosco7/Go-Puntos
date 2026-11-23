<!--
  Configuración inicial del negocio (asistente de 11 pasos).
  - Cada paso se puede guardar u omitir (salvo los necesarios): no hace
    falta completar todo para empezar.
  - "Terminar más tarde" deja el negocio pendiente y lleva al dashboard
    (con una lista de pendientes).
  - Al final se ENVÍA A REVISIÓN: el Superadmin de GO Puntos aprueba o
    rechaza la solicitud (solicitudes_negocio). El negocio no opera con
    clientes hasta que la aprueben. Si la rechazan, se ve el motivo y se
    puede corregir y reenviar. Todo se puede cambiar después en Configuración.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ProgressBar from '../../components/base/ProgressBar.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import { platform as Platform } from '../../domain/platform.js';
import { SECTIONS, WIZARD } from '../../components/settings/sections.js';
import { useSettingsContext } from '../../composables/useSettingsContext.js';
import { toast } from '../../composables/useToast.js';
import { businessService } from '../../services/businessService.js';
import { useBusinessStore } from '../../stores/business.js';

const router = useRouter();
const store = useBusinessStore();
const { ctx, load } = useSettingsContext();
const error = ref(null);
const i = ref(0);
const busy = ref('');
const sectionRef = ref(null);
const version = ref(0);

const id = computed(() => WIZARD[i.value]);
const section = computed(() => SECTIONS[id.value]);
const isLast = computed(() => i.value === WIZARD.length - 1);
/** Estado de un paso: 'done' | 'skipped' | '' */
const stepState = (sid) => ctx.value.business.onboarding.steps[sid] || '';

/** Estado de la solicitud de alta: preparacion | revision | aprobada | rechazada. */
const phase = computed(() => ctx.value?.platform?.request?.phase || (ctx.value?.business.status === 'activo' ? 'aprobada' : 'preparacion'));
/** Requisitos mínimos para enviar a revisión. */
const checklist = computed(() => ctx.value?.platform?.checklist || []);
const missing = computed(() => checklist.value.filter((x) => !x.ok));
/** Se puede enviar (o reenviar) si está en preparación o fue rechazada y cumple los requisitos. */
const canSubmit = computed(() => ['preparacion', 'rechazada'].includes(phase.value) && !missing.value.length);

async function init() {
  error.value = null;
  try {
    await load();
    // Retoma en el primer paso sin completar
    const first = WIZARD.findIndex((sid) => !stepState(sid));
    i.value = first === -1 ? WIZARD.length - 1 : first;
  } catch (err) { error.value = err; }
}
onMounted(init);

function goStep(n) {
  i.value = Math.max(0, Math.min(WIZARD.length - 1, n));
  version.value += 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Marca el paso actual (si corresponde), recarga los datos y avanza. */
async function go(n, mark) {
  if (mark) await businessService.setOnboardingStep(id.value, mark);
  await load();
  goStep(n);
}

async function next() {
  busy.value = 'next';
  try {
    await sectionRef.value.save();
    await go(i.value + 1, 'done');
  } catch (err) {
    if (!err.handled) toast(err.message, 'error');
  } finally { busy.value = ''; }
}
async function skip() {
  busy.value = 'skip';
  try { await go(i.value + 1, stepState(id.value) === 'done' ? null : 'skipped'); } finally { busy.value = ''; }
}
async function later() {
  await businessService.dismissOnboarding();
  toast('Podés seguir configurando cuando quieras desde el dashboard o Configuración.');
  router.push({ name: 'admin-dashboard' });
}
/** Último paso: envía la solicitud a revisión (o termina, si el negocio ya está aprobado). */
async function finish() {
  if (phase.value === 'aprobada' || phase.value === 'revision') {
    if (phase.value === 'aprobada') await businessService.setOnboardingStep('summary', 'done');
    router.push({ name: 'admin-dashboard' });
    return;
  }
  busy.value = 'activate';
  try {
    const r = await businessService.submitForReview();
    store.setFull(r);
    toast(`Enviamos ${r.business.name} a revisión. Te avisamos en el panel cuando GO Puntos lo apruebe.`);
    router.push({ name: 'admin-dashboard' });
  } catch (err) {
    toast(err.message, 'error');
    busy.value = '';
  }
}
const finishLabel = computed(() => ({
  aprobada: 'Listo', revision: 'Volver al panel', rechazada: 'Reenviar a revisión', preparacion: 'Enviar a revisión',
})[phase.value]);
async function reload() { await load(); version.value += 1; }
</script>

<template>
  <PageLoading v-if="!ctx && !error" />
  <PageError v-else-if="error" title="No pudimos cargar tu negocio" :error="error" @retry="init" />

  <div v-else class="wizard">
    <!-- Pasos -->
    <nav class="wizard__steps" aria-label="Pasos de la configuración">
      <p class="group-title" style="margin: 0 0 var(--sp-2) var(--sp-3)">Configurá {{ ctx.business.name || 'tu negocio' }}</p>
      <button
        v-for="(sid, n) in WIZARD" :key="sid" type="button" class="wizard__step"
        :class="{ 'is-on': n === i, 'is-done': stepState(sid) === 'done', 'is-skipped': stepState(sid) === 'skipped' }"
        :aria-current="n === i ? 'step' : undefined" @click="goStep(n)"
      >
        <span class="wizard__num"><BaseIcon v-if="stepState(sid) === 'done'" name="check" :size="14" /><template v-else>{{ n + 1 }}</template></span>{{ SECTIONS[sid].title }}
      </button>
    </nav>

    <!-- Paso actual -->
    <section class="wizard__panel">
      <div class="wizard__progress"><ProgressBar :value="(i + 1) / WIZARD.length" label="Avance de la configuración" mod="bar--level" /></div>
      <header class="wizard__head">
        <p class="wizard__count">Paso {{ i + 1 }} de {{ WIZARD.length }}{{ section.required ? ' · necesario' : ' · opcional' }}</p>
        <h1 style="font-size: var(--fs-2xl); margin-top: 4px">{{ section.title }}</h1>
        <p class="muted" style="margin-top: var(--sp-1); max-width: 64ch">{{ section.description }}</p>
      </header>
      <!-- Solicitud rechazada: el motivo queda a la vista en todo el asistente -->
      <BaseAlert
        v-if="phase === 'rechazada'" tone="error" title="GO Puntos rechazó tu solicitud"
        :text="`Motivo: ${Platform.sentence(ctx.platform.request.reason)}. Corregí lo indicado y reenviala desde el último paso.`"
        style="margin-bottom: var(--sp-4)"
      />
      <form novalidate @submit.prevent="isLast ? finish() : next()">
        <component :is="section.component" ref="sectionRef" :key="`${id}-${version}`" :ctx="ctx" @reload="reload" @goto="goStep(WIZARD.indexOf($event))" />
      </form>
      <!-- Envío a revisión: requisitos y estado de la solicitud -->
      <section v-if="isLast && phase !== 'aprobada'" class="review-box" aria-label="Envío a revisión">
        <p class="group-title" style="margin-top: 0">Requisitos para enviar a revisión</p>
        <ul class="check-list">
          <li v-for="x in checklist" :key="x.key">
            <button type="button" class="check-chip" :class="{ 'is-missing': !x.ok }" @click="x.ok || goStep(WIZARD.indexOf(x.key === 'negocio' ? 'info' : x.key === 'puntos' ? 'points' : x.key === 'niveles' ? 'levels' : 'rewards'))">
              <span><BaseIcon :name="x.ok ? 'circle-check' : 'circle-alert'" :size="14" /> {{ x.label }}</span>
            </button>
          </li>
        </ul>
        <BaseAlert
          v-if="phase === 'revision'" tone="info" title="Tu solicitud está en revisión"
          text="GO Puntos la está revisando. Mientras tanto podés seguir ajustando tu programa; vas a ver el resultado en el panel."
        />
        <p v-else class="small muted">Al enviarla, el equipo de GO Puntos revisa tu programa. Cuando lo apruebe vas a poder registrar compras y sumar clientes con tu QR.</p>
      </section>
      <div class="wizard__foot">
        <button v-if="i > 0" type="button" class="btn btn--ghost" @click="goStep(i - 1)"><BaseIcon name="arrow-left" :size="16" /> Anterior</button>
        <button type="button" class="btn btn--ghost" @click="later">Terminar más tarde</button>
        <span class="spacer"></span>
        <BaseButton v-if="!isLast && !section.required" variant="outline" :loading="busy === 'skip'" loading-text="Guardando" @click="skip">Omitir por ahora</BaseButton>
        <BaseButton
          v-if="isLast" size="lg" :icon="['preparacion', 'rechazada'].includes(phase) ? 'send' : 'check'" :loading="busy === 'activate'" loading-text="Enviando"
          :disabled="['preparacion', 'rechazada'].includes(phase) && !canSubmit" @click="finish"
        >
          {{ finishLabel }}
        </BaseButton>
        <BaseButton v-else icon-right="arrow-right" :loading="busy === 'next'" loading-text="Guardando" @click="next">Guardar y seguir</BaseButton>
      </div>
    </section>
  </div>
</template>
