<!--
  Layout de ingreso y registro: panel de marca a la izquierda (en
  escritorio) y el formulario a la derecha. Usa la identidad de GO Puntos.
  El panel de marca es deliberadamente simple (logo y una frase): el saldo
  de ejemplo y la explicación de cómo funciona ya están en la página principal.
-->
<script setup>
import GoLogo from '../components/brand/GoLogo.vue';
</script>

<template>
  <div class="auth">
    <!-- Panel de marca (decorativo) -->
    <aside class="auth__brand" aria-hidden="true">
      <router-link :to="{ name: 'landing' }" tabindex="-1"><GoLogo tone="light" tagline /></router-link>
      <div class="auth__statement">
        <p class="auth__title">Cada compra suma.</p>
        <p class="auth__lead">La plataforma de fidelización que conecta a los comercios con sus clientes.</p>
      </div>
      <p class="auth__foot">GO Puntos · Programa de fidelización para comercios</p>
    </aside>

    <main id="contenido" class="auth__main">
      <router-link :to="{ name: 'landing' }" class="auth__mobile-logo" aria-label="GO Puntos, inicio"><GoLogo /></router-link>
      <div class="auth__form-wrap">
        <router-view />
      </div>
    </main>
  </div>
</template>
