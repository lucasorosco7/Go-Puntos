<!--
  Esqueleto de carga de una página del panel.
-->
<script setup>
import SkeletonBlock from '../base/SkeletonBlock.vue';

defineProps({ height: { type: String, default: '320px' } });
</script>

<template>
  <div class="stack">
    <SkeletonBlock height="56px" width="min(420px, 90%)" />
    <SkeletonBlock :height="height" radius="var(--radius-lg)" />
  </div>
</template>
