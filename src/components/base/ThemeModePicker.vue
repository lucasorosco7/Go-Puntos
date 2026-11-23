<!--
  Selector del modo de la interfaz: Claro, Oscuro o Automático (sigue al
  sistema del teléfono o la computadora). Es una preferencia de cada
  persona: se aplica al instante y se guarda en su cuenta.
-->
<script setup>
import { ref } from 'vue';
import { toast } from '../../composables/useToast.js';
import { useAuthStore } from '../../stores/auth.js';
import { THEME_MODES } from '../../theme/theme.js';
import BaseIcon from './BaseIcon.vue';

const auth = useAuthStore();
const ICONS = { claro: 'sun', oscuro: 'moon', auto: 'monitor' };
const saving = ref(false);

async function choose(mode) {
  if (mode === auth.themeMode || saving.value) return;
  saving.value = true;
  try { await auth.setMode(mode); } catch (err) { toast(err.message, 'error'); } finally { saving.value = false; }
}
</script>

<template>
  <div class="seg" role="radiogroup" aria-label="Modo de la interfaz">
    <button
      v-for="(label, mode) in THEME_MODES" :key="mode" type="button" role="radio"
      :class="{ 'is-on': auth.themeMode === mode }" :aria-checked="auth.themeMode === mode" @click="choose(mode)"
    >
      <BaseIcon :name="ICONS[mode]" :size="15" /> {{ label }}
    </button>
  </div>
</template>
