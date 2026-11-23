<!--
  Negocio en tablas y tarjetas de la plataforma: logo (o monograma), nombre y rubro.
-->
<script setup>
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import BusinessLogo from '../brand/BusinessLogo.vue';

defineProps({
  business: { type: Object, required: true },
  size: { type: Number, default: 36 },
});
</script>

<template>
  <span class="biz-cell">
    <BusinessLogo :business="business" :size="size" />
    <span>
      <span class="biz-cell__name">{{ business.name || 'Negocio sin nombre' }}</span>
      <span class="biz-cell__meta">{{ BUSINESS_CATEGORIES[business.category] || 'Sin rubro' }}{{ business.city ? ` · ${business.city}` : '' }}</span>
    </span>
  </span>
</template>
