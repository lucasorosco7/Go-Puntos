<!--
  Registro de cliente: UNA cuenta de GO Puntos para todos los comercios.
  Si llega desde el QR de un negocio (?join=slug) queda asociada a ese
  negocio; si no, al negocio por defecto del sitio.
  Valida al salir de cada campo (sin molestar mientras se escribe) y al enviar.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BusinessLogo from '../../components/brand/BusinessLogo.vue';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { appConfig } from '../../config/app.config.js';
import { businessService } from '../../services/businessService.js';
import { useAuthStore } from '../../stores/auth.js';
import { format } from '../../utils/format.js';
import { validators as v } from '../../utils/validators.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const joinSlug = computed(() => route.query.join || appConfig.defaultBusinessSlug);
const business = ref(null);

const form = useForm(
  { firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' },
  {
    firstName: [v.required('nombre')],
    lastName: [v.required('apellido')],
    email: [v.required('email'), v.email],
    phone: [v.required('teléfono'), v.phone],
    password: [v.required('contraseña'), v.password],
    confirm: [v.required('confirmación de contraseña'), v.matches('password')],
  },
);

/** Texto de bienvenida según el negocio al que se va a sumar. */
const welcome = computed(() => {
  const b = business.value;
  if (!b) return 'Es gratis. Una sola cuenta para todos tus comercios.';
  return b.pointsRule.welcomeBonus
    ? `Es gratis. Empezás con ${format.points(b.pointsRule.welcomeBonus)} puntos de regalo en ${b.name}.`
    : `Es gratis. Una sola cuenta para ${b.name} y todos tus comercios.`;
});
const loginLink = computed(() => (route.query.join ? { name: 'login', query: { next: `/unirse/${joinSlug.value}` } } : { name: 'login' }));

onMounted(async () => {
  try { business.value = (await businessService.getPublic(joinSlug.value)).business; } catch { /* el registro funciona igual */ }
});

async function onSubmit() {
  const r = await form.submit((values) => auth.register({ ...values, joinSlug: joinSlug.value }), { title: 'No pudimos crear la cuenta' });
  if (!r) return;
  const bonus = r.membership?.balance || 0;
  toast(bonus ? `Cuenta creada. Te regalamos ${format.points(bonus)} puntos de bienvenida en ${r.business.name}.` : 'Cuenta creada. ¡Bienvenida/o a GO Puntos!');
  router.replace({ name: 'client-points' });
}
</script>

<template>
  <header class="auth-heading">
    <h1>Creá tu cuenta</h1>
    <p>{{ welcome }}</p>
  </header>

  <!-- Negocio al que se va a sumar -->
  <div v-if="business" class="row" style="margin-top: var(--sp-5)">
    <BusinessLogo :business="business" :size="40" />
    <div class="row__body"><p class="small muted">Te vas a sumar a</p><p class="row__title">{{ business.name }}</p></div>
  </div>

  <form class="auth-form" novalidate @submit.prevent="onSubmit">
    <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
    <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
    <div class="auth-form__pair">
      <BaseField v-model="form.values.firstName" name="firstName" label="Nombre" icon="user-round" :error="form.errors.firstName" autocomplete="given-name" @blur="form.validateField" />
      <BaseField v-model="form.values.lastName" name="lastName" label="Apellido" :error="form.errors.lastName" autocomplete="family-name" @blur="form.validateField" />
    </div>
    <BaseField v-model="form.values.email" name="email" label="Email" type="email" icon="mail" :error="form.errors.email" autocomplete="email" placeholder="nombre@correo.com" @blur="form.validateField" />
    <BaseField
      v-model="form.values.phone" name="phone" label="Teléfono" type="tel" icon="phone" :error="form.errors.phone" autocomplete="tel"
      placeholder="381 555-0000" hint="Lo usamos para avisarte de puntos por vencer." @blur="form.validateField"
    />
    <BaseField
      v-model="form.values.password" name="password" label="Contraseña" type="password" icon="lock" :error="form.errors.password"
      autocomplete="new-password" hint="Mínimo 8 caracteres, con letras y números." @blur="form.validateField"
    />
    <BaseField v-model="form.values.confirm" name="confirm" label="Repetí la contraseña" type="password" icon="lock" :error="form.errors.confirm" autocomplete="new-password" @blur="form.validateField" />
    <BaseButton type="submit" size="lg" block :loading="form.busy.value" loading-text="Creando cuenta">Crear cuenta</BaseButton>
  </form>

  <p class="auth-switch">¿Ya tenés cuenta? <router-link :to="loginLink" class="link">Ingresá</router-link></p>
</template>
