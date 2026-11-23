<!--
  Configuración inicial del negocio (asistente de 11 pasos).
  - Cada paso se puede guardar u omitir (salvo los necesarios): no hace
    falta completar todo para empezar.
  - "Terminar más tarde" deja el negocio en borrador y lleva al dashboard
    (con una lista de pendientes).
  - Al final se activa el programa. Todo se puede cambiar después en
    Configuración.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ProgressBar from '../../components/base/ProgressBar.vue';
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
async function activate() {
  busy.value = 'activate';
  try {
    await businessService.setOnboardingStep('summary', 'done');
    const b = await businessService.activate();
    store.setBusiness(b);
    toast(`¡${b.name} ya tiene su programa de puntos activo!`);
    router.push({ name: 'admin-dashboard' });
  } catch (err) {
    toast(err.message, 'error');
    busy.value = '';
  }
}
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
      <form novalidate @submit.prevent="isLast ? activate() : next()">
        <component :is="section.component" ref="sectionRef" :key="`${id}-${version}`" :ctx="ctx" @reload="reload" @goto="goStep(WIZARD.indexOf($event))" />
      </form>
      <div class="wizard__foot">
        <button v-if="i > 0" type="button" class="btn btn--ghost" @click="goStep(i - 1)"><BaseIcon name="arrow-left" :size="16" /> Anterior</button>
        <button type="button" class="btn btn--ghost" @click="later">Terminar más tarde</button>
        <span class="spacer"></span>
        <BaseButton v-if="!isLast && !section.required" variant="outline" :loading="busy === 'skip'" loading-text="Guardando" @click="skip">Omitir por ahora</BaseButton>
        <BaseButton v-if="isLast" size="lg" icon="rocket" :loading="busy === 'activate'" loading-text="Activando" @click="activate">
          {{ ctx.business.status === 'activo' ? 'Listo' : 'Activar mi programa' }}
        </BaseButton>
        <BaseButton v-else icon-right="arrow-right" :loading="busy === 'next'" loading-text="Guardando" @click="next">Guardar y seguir</BaseButton>
      </div>
    </section>
  </div>
</template>
