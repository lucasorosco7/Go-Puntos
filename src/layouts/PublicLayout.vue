<!--
  Layout del sitio público (landing): encabezado con menú y pie.
  Siempre usa la identidad de GO Puntos (no la paleta de un negocio).
-->
<script setup>
import { ref } from 'vue';
import BaseIcon from '../components/base/BaseIcon.vue';
import GoLogo from '../components/brand/GoLogo.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const open = ref(false);
const links = [['#como-funciona', 'Cómo funciona'], ['#beneficios', 'Beneficios'], ['#recompensas', 'Recompensas']];
const year = new Date().getFullYear();
</script>

<template>
  <a href="#contenido" class="skip-link">Saltar al contenido</a>

  <!-- Encabezado del sitio -->
  <header class="pheader">
    <div class="container pheader__inner">
      <router-link :to="{ name: 'landing' }" aria-label="GO Puntos, inicio"><GoLogo tagline="CV Dietética" /></router-link>
      <nav id="public-nav" class="pheader__nav" :class="{ 'is-open': open }" aria-label="Principal">
        <ul>
          <li v-for="[href, label] in links" :key="href"><a :href="href" @click="open = false">{{ label }}</a></li>
        </ul>
        <div class="pheader__actions">
          <router-link v-if="auth.isAuthenticated" class="btn" :to="auth.homeFor()">Ir a mi cuenta</router-link>
          <template v-else>
            <router-link class="btn btn--ghost" :to="{ name: 'login' }">Ingresar</router-link>
            <router-link class="btn" :to="{ name: 'register' }">Sumarme gratis</router-link>
          </template>
        </div>
      </nav>
      <button
        type="button" class="pheader__toggle" :aria-expanded="String(open)" aria-controls="public-nav"
        :aria-label="open ? 'Cerrar menú' : 'Abrir menú'" @click="open = !open"
      >
        <span v-show="!open"><BaseIcon name="menu" :size="22" bare /></span>
        <span v-show="open"><BaseIcon name="x" :size="22" bare /></span>
      </button>
    </div>
  </header>

  <router-view />

  <!-- Pie del sitio -->
  <footer class="pfooter">
    <div class="container pfooter__grid">
      <div class="pfooter__brand">
        <GoLogo tone="light" tagline="CV Dietética" />
        <p>El programa de beneficios para quienes compran seguido en CV Dietética.</p>
      </div>
      <div>
        <h2 class="pfooter__title">El local</h2>
        <ul class="pfooter__list">
          <li><BaseIcon name="map-pin" :size="16" /> San Miguel de Tucumán</li>
          <li><BaseIcon name="clock" :size="16" /> Lunes a sábado, 9 a 21 h</li>
          <li><BaseIcon name="phone" :size="16" /> 381 555-0100</li>
        </ul>
      </div>
      <div>
        <h2 class="pfooter__title">Tu cuenta</h2>
        <ul class="pfooter__list">
          <li><router-link :to="{ name: 'login' }">Ingresar</router-link></li>
          <li><router-link :to="{ name: 'register' }">Crear cuenta</router-link></li>
          <li><router-link :to="{ name: 'forgot' }">Recuperar contraseña</router-link></li>
          <li><router-link :to="{ name: 'register-business' }">Registrar mi comercio (con invitación)</router-link></li>
        </ul>
      </div>
    </div>
    <div class="container pfooter__legal">
      <p>© {{ year }} CV Dietética. Los puntos no tienen valor monetario y no se canjean por efectivo.</p>
      <p>Proyecto final TUP, UTN FRT</p>
    </div>
  </footer>
</template>
