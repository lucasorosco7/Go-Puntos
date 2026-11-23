<!--
  Configuración del negocio: las mismas secciones del asistente inicial en
  pestañas (Negocio, Identidad, Puntos, Niveles, Ranking, Premio, Desafíos
  y rachas, Notificaciones) más Empleados y el QR del negocio.
  La pestaña activa está en la URL: /panel/configuracion/:section.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import { SECTIONS, sectionBySlug, TABS } from '../../components/settings/sections.js';
import { useSettingsContext } from '../../composables/useSettingsContext.js';
import { toast } from '../../composables/useToast.js';

const route = useRoute();
const router = useRouter();
const { ctx, load } = useSettingsContext();
const error = ref(null);
const saving = ref(false);
const sectionRef = ref(null);
/** Cambia después de guardar para volver a montar la sección con los datos nuevos. */
const version = ref(0);

const tab = computed(() => sectionBySlug(route.params.section));
const section = computed(() => SECTIONS[tab.value]);
const tabItems = TABS.map((id) => [id, SECTIONS[id].tab]);

function setTab(id) {
  router.replace({ name: 'admin-settings', params: { section: SECTIONS[id].slug } });
}

async function init() {
  error.value = null;
  try { await load(); } catch (err) { error.value = err; }
}
onMounted(init);

async function save() {
  saving.value = true;
  try {
    await sectionRef.value.save();
    await load();
    version.value += 1;
    toast('Cambios guardados.');
  } catch (err) {
    if (!err.handled) toast(err.message, 'error');
  } finally {
    saving.value = false;
  }
}
async function reload() { await load(); version.value += 1; }
</script>

<template>
  <PageLoading v-if="!ctx && !error" />
  <PageError v-else-if="error" title="No pudimos cargar la configuración" :error="error" @retry="init" />

  <template v-else>
    <PageHead title="Configuración del negocio" description="Todo lo que definiste en la configuración inicial, para cambiarlo cuando quieras.">
      <router-link v-if="ctx.business.status !== 'activo'" class="btn" :to="{ name: 'admin-onboarding' }"><BaseIcon name="rocket" :size="17" /> Completar y activar</router-link>
      <router-link v-else class="btn btn--outline" :to="{ name: 'admin-onboarding' }"><BaseIcon name="list-checks" :size="17" /> Ver asistente</router-link>
    </PageHead>
    <ChipTabs :model-value="tab" :items="tabItems" label="Secciones" @update:model-value="setTab" />

    <div>
      <!-- Empleados y QR no tienen botón Guardar propio de la sección -->
      <component :is="section.component" v-if="section.standalone" :key="`${tab}-${version}`" :ctx="ctx" />
      <section v-else class="panel-card">
        <div style="margin-bottom: var(--sp-5)">
          <h2>{{ section.title }}</h2>
          <p class="small muted" style="margin-top: 4px">{{ section.description }}</p>
        </div>
        <form novalidate @submit.prevent="save">
          <component :is="section.component" ref="sectionRef" :key="`${tab}-${version}`" :ctx="ctx" @reload="reload" />
        </form>
        <div class="wizard__foot">
          <span class="spacer"></span>
          <BaseButton :loading="saving" loading-text="Guardando" @click="save">Guardar cambios</BaseButton>
        </div>
      </section>
    </div>
  </template>
</template>
