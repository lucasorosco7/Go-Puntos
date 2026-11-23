<!--
  Ingreso a GO Puntos.
  - Valida email y contraseña antes de llamar al servicio.
  - Entra al contexto que corresponde: panel si la cuenta tiene un rol en
    algún negocio; si no, la app del cliente. Si venía de una página
    privada (?next=), vuelve ahí.
  - Incluye las cuentas de prueba y el botón para restablecer los datos
    simulados (sólo tienen sentido mientras se usen mocks).
-->
<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCheckbox from '../../components/base/BaseCheckbox.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import { confirm } from '../../composables/useConfirm.js';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { appConfig } from '../../config/app.config.js';
import { safeNext } from '../../router/guards.js';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../stores/auth.js';
import { validators as v } from '../../utils/validators.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = useForm({ email: '', password: '' }, {
  email: [v.required('email'), v.email],
  password: [v.required('contraseña')],
});
/** "Recordar sesión" empieza desmarcada: la sesión sólo queda guardada si la persona lo elige. */
const remember = ref(false);

/** Cuentas de prueba (datos ficticios del servidor simulado). */
const DEMO = {
  superadmin: { email: 'superadmin@gopuntos.demo', password: 'super1234', hint: 'Carla administra la plataforma GO Puntos: invitaciones, solicitudes, negocios y auditoría.', label: 'Superadmin', icon: 'shield' },
  cliente: { email: 'martina@demo.com', password: 'demo1234', hint: 'Martina participa en dos negocios con la misma cuenta.', label: 'Cliente', icon: 'user-round' },
  admin: { email: 'admin@cvdietetica.com', password: 'admin1234', hint: 'Administra CV Dietética: panel completo.', label: 'Administrador', icon: 'shield-check' },
  empleado: { email: 'caja@cvdietetica.com', password: 'caja1234', hint: 'Lucas es empleado de CV Dietética y, con la misma cuenta, cliente de Café Aroma.', label: 'Empleado', icon: 'scan-line' },
  cafe: { email: 'admin@cafearoma.com', password: 'admin1234', hint: 'Administra Café Aroma, con otra paleta y otros niveles.', label: 'Otro negocio', icon: 'coffee' },
  nuevo: { email: 'nuevo@demo.com', password: 'demo1234', hint: 'Sofía registró su negocio con una invitación: lo está configurando para enviarlo a revisión.', label: 'Negocio nuevo', icon: 'rocket' },
  revision: { email: 'panaderia@demo.com', password: 'demo1234', hint: 'Panadería La Espiga ya envió su solicitud: espera la aprobación del Superadmin.', label: 'En revisión', icon: 'hourglass' },
};
const demoHint = ref(DEMO.cliente.hint);

function useDemo(key) {
  const acc = DEMO[key];
  form.values.email = acc.email;
  form.values.password = acc.password;
  demoHint.value = acc.hint;
  form.setErrors({});
  form.alert.value = null;
}

async function resetDemo() {
  const ok = await confirm({
    title: '¿Restablecer los datos de prueba?',
    description: 'Se borran las compras, canjes y cambios que hiciste y se vuelven a generar los datos iniciales.',
    confirmText: 'Restablecer',
  });
  if (!ok) return;
  await authService.resetDemo();
  toast('Listo: datos de prueba restablecidos.');
}

/** Si viene del QR de un negocio, "Creá tu cuenta" también vuelve ahí. */
const next = computed(() => safeNext(route.query.next));
const joinSlug = computed(() => next.value?.match(/^\/unirse\/([\w-]+)/)?.[1] || null);
const registerLink = computed(() => (joinSlug.value ? { name: 'register', query: { join: joinSlug.value } } : { name: 'register' }));

async function onSubmit() {
  if (!form.validate()) return;
  form.busy.value = true;
  try {
    const ctx = await auth.login({ ...form.values, remember: remember.value });
    router.replace(next.value || auth.homeFor(ctx));
  } catch (err) {
    form.alert.value = { tone: 'error', title: 'No pudimos ingresar', text: `${err.message} Revisalos e intentá otra vez.` };
    form.busy.value = false;
  }
}
</script>

<template>
  <header class="auth-heading">
    <h1>Hola de nuevo</h1>
    <p>Ingresá para ver tus puntos y canjear recompensas.</p>
  </header>

  <!-- Formulario de ingreso -->
  <form class="auth-form" novalidate @submit.prevent="onSubmit">
    <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
    <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
    <BaseField
      v-model="form.values.email" name="email" label="Email" type="email" icon="mail" :error="form.errors.email"
      autocomplete="email" placeholder="nombre@correo.com"
    />
    <BaseField
      v-model="form.values.password" name="password" label="Contraseña" type="password" icon="lock" :error="form.errors.password"
      autocomplete="current-password"
    />
    <div class="auth-form__row">
      <BaseCheckbox id="remember" v-model="remember" label="Recordar sesión" />
      <router-link :to="{ name: 'forgot' }" class="link">Olvidé mi contraseña</router-link>
    </div>
    <BaseButton type="submit" size="lg" block :loading="form.busy.value" loading-text="Ingresando">Ingresar</BaseButton>
  </form>

  <!-- Cuentas de prueba (sólo con datos simulados) -->
  <section v-if="appConfig.useMocks" class="demo-box" aria-labelledby="demo-title">
    <h2 id="demo-title">Cuentas de prueba</h2>
    <p>Completan el formulario con datos ficticios.</p>
    <div class="demo-box__actions">
      <button v-for="(acc, key) in DEMO" :key="key" type="button" class="btn btn--outline btn--sm" @click="useDemo(key)">
        <BaseIcon :name="acc.icon" :size="17" />{{ acc.label }}
      </button>
    </div>
    <p class="demo-box__hint">{{ demoHint }}</p>
    <button type="button" class="link demo-box__reset" @click="resetDemo"><BaseIcon name="rotate-ccw" :size="14" /> Restablecer datos de prueba</button>
  </section>

  <p class="auth-switch">¿Todavía no sumás puntos? <router-link :to="registerLink" class="link">Creá tu cuenta gratis</router-link></p>
  <p class="auth-switch" style="margin-top: var(--sp-2)">¿Tenés un comercio? <router-link :to="{ name: 'register-business' }" class="link">Registralo con tu invitación</router-link></p>
</template>
