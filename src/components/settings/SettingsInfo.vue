<!--
  Configuración · Información del negocio: nombre, rubro, descripción,
  logo (o ícono), dirección y contacto. A la derecha, cómo lo ven los
  clientes en la página para sumarse.
-->
<script setup>
import { computed } from 'vue';
import { BUSINESS_CATEGORIES, BUSINESS_ICONS } from '../../config/catalogs.js';
import { businessService } from '../../services/businessService.js';
import { paletteStyle } from '../../theme/palettes.js';
import { validators as v } from '../../utils/validators.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import ImagePicker from '../base/ImagePicker.vue';
import BusinessLogo from '../brand/BusinessLogo.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const b = props.ctx.business;
const { form, run } = useSection({
  name: b.name || '', category: b.category || 'otro', description: b.description || '', logo: b.logo || null, logoIcon: b.logoIcon || 'store',
  address: b.address || '', city: b.city || '', phone: b.phone || '', email: b.email || '',
  instagram: b.social?.instagram || '', whatsapp: b.social?.whatsapp || '', facebook: b.social?.facebook || '', website: b.social?.website || '',
}, { name: [v.filled('Ingresá el nombre del negocio.')] });
const iconOptions = BUSINESS_ICONS.map((x) => ({ value: x, label: x }));
const f = form.values;
const previewBusiness = computed(() => ({ ...b, logo: f.logo || null, logoIcon: f.logoIcon }));

function save() {
  return run((x) => businessService.update({
    name: x.name.trim(), category: x.category, description: x.description, logo: x.logo || null, logoIcon: x.logoIcon,
    address: x.address, city: x.city, phone: x.phone, email: x.email,
    social: { instagram: x.instagram, whatsapp: x.whatsapp, facebook: x.facebook, website: x.website },
  }));
}
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="settings-split">
    <div class="form-grid">
      <BaseField v-model="f.name" id-prefix="cfg" name="name" label="Nombre del negocio" icon="store" :error="form.errors.name" />
      <BaseField v-model="f.category" id-prefix="cfg" name="category" label="Rubro" type="select" :options="BUSINESS_CATEGORIES" />
      <BaseField v-model="f.description" id-prefix="cfg" name="description" label="Descripción corta" type="textarea" placeholder="Qué vendés y qué te hace distinto. Se ve en la página para sumarse." />
      <div class="form-grid form-grid--2">
        <ImagePicker v-model="f.logo" name="logo" label="Logo" hint="Cuadrado, JPG o PNG." />
        <BaseField v-model="f.logoIcon" id-prefix="cfg" name="logoIcon" label="Ícono si no hay logo" type="select" :options="iconOptions" />
        <BaseField v-model="f.address" id-prefix="cfg" name="address" label="Dirección" icon="map-pin" />
        <BaseField v-model="f.city" id-prefix="cfg" name="city" label="Ciudad" />
        <BaseField v-model="f.phone" id-prefix="cfg" name="phone" label="Teléfono" type="tel" icon="phone" />
        <BaseField v-model="f.email" id-prefix="cfg" name="email" label="Email de contacto" type="email" icon="mail" />
        <BaseField v-model="f.instagram" id-prefix="cfg" name="instagram" label="Instagram" icon="instagram" placeholder="@tunegocio" />
        <BaseField v-model="f.whatsapp" id-prefix="cfg" name="whatsapp" label="WhatsApp" type="tel" icon="message-circle" />
        <BaseField v-model="f.facebook" id-prefix="cfg" name="facebook" label="Facebook" icon="facebook" />
        <BaseField v-model="f.website" id-prefix="cfg" name="website" label="Sitio web" icon="globe" />
      </div>
    </div>
    <!-- Cómo lo ven los clientes al sumarse -->
    <div class="settings-aside">
      <p class="group-title" style="margin-top: 0">Así te ven tus clientes</p>
      <div>
        <div class="card join-preview" :style="paletteStyle(b.paletteId, b.paletteVariant)">
          <BusinessLogo :business="previewBusiness" :size="64" />
          <p class="small muted">{{ BUSINESS_CATEGORIES[f.category] || '' }}</p>
          <p style="font-size: var(--fs-xl); font-weight: var(--fw-medium)">{{ f.name || 'Tu negocio' }}</p>
          <p class="small muted">{{ f.description || 'Tu descripción aparece acá.' }}</p>
          <p v-if="f.address" class="small muted"><BaseIcon name="map-pin" :size="12" /> {{ f.address }}{{ f.city ? `, ${f.city}` : '' }}</p>
          <span class="btn btn--block" style="margin-top: var(--sp-2)">Sumarme a {{ f.name || 'tu negocio' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
