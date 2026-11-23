<!--
  Layout de ingreso y registro: panel de marca a la izquierda (en
  escritorio) y el formulario a la derecha. Usa la identidad de GO Puntos.
-->
<script setup>
import GoLogo from '../components/brand/GoLogo.vue';
import PointsCard from '../components/loyalty/PointsCard.vue';

/** Ejemplo ilustrativo (datos ficticios) para el panel de marca. */
const demoReward = { name: 'Mantequilla de maní 380 g', points: 1500 };
</script>

<template>
  <div class="auth">
    <!-- Panel de marca (decorativo) -->
    <aside class="auth__brand" aria-hidden="true">
      <router-link :to="{ name: 'landing' }" tabindex="-1"><GoLogo tagline /></router-link>
      <div class="auth__showcase">
        <PointsCard :balance="1240" :next-reward="demoReward" />
        <p class="auth__caption">Una sola cuenta para sumar puntos en todos tus comercios favoritos.</p>
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
