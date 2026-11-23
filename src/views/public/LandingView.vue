<!--
  Landing pública de GO Puntos (sitio del negocio por defecto, CV Dietética).
  Los niveles y la vitrina de recompensas se cargan desde el negocio para
  no duplicar datos; el resto es contenido fijo.
-->
<script setup>
import { onMounted, ref } from 'vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import PointsCard from '../../components/loyalty/PointsCard.vue';
import RewardArt from '../../components/loyalty/RewardArt.vue';
import { appConfig } from '../../config/app.config.js';
import { REWARD_CATEGORIES } from '../../config/catalogs.js';
import { levels as Levels } from '../../domain/levels.js';
import { businessService } from '../../services/businessService.js';
import { format } from '../../utils/format.js';

const tiers = ref([]);
const rule = ref(null);
const showcase = ref(null);

/** Primer beneficio del nivel, o su bonificación de puntos, o la regla base. */
function perkOf(t) {
  if (t.benefits?.[0]) return t.benefits[0];
  if (t.multiplier > 1) return `${Math.round((t.multiplier - 1) * 100)}% más de puntos en cada compra.`;
  return `Sumás ${rule.value.points} punto por cada ${format.currency(rule.value.pesos)}.`;
}

onMounted(async () => {
  const slug = appConfig.defaultBusinessSlug;
  businessService.getPublic(slug).then(({ business, levels }) => {
    rule.value = business.pointsRule;
    tiers.value = [...levels].reverse();
  }).catch(() => { tiers.value = []; });
  businessService.publicRewards(slug).then((list) => { showcase.value = list.filter((r) => r.featured).slice(0, 4); })
    .catch(() => { showcase.value = []; });
});
</script>

<template>
  <main id="contenido">
    <!-- ================= Hero ================= -->
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__copy">
          <h1 class="hero__title">Lo que ya comprás, ahora te devuelve algo.</h1>
          <p class="hero__lead">
            GO Puntos es el programa de beneficios de CV Dietética. Por cada $100 que gastás sumás
            un punto, y los canjeás por productos del local.
          </p>
          <div class="hero__ctas">
            <router-link :to="{ name: 'register' }" class="btn btn--lg">Crear mi cuenta</router-link>
            <router-link :to="{ name: 'login' }" class="btn btn--outline btn--lg">Ya tengo cuenta</router-link>
          </div>
          <ul class="hero__facts" role="list">
            <li><BaseIcon name="check" :size="16" bare /> Registro gratis</li>
            <li><BaseIcon name="check" :size="16" bare /> 100 puntos de bienvenida</li>
          </ul>
        </div>

        <div class="hero__visual">
          <!-- Resumen de puntos de ejemplo (datos ficticios) -->
          <PointsCard :balance="1240" :next-reward="{ name: 'Mantequilla de maní 380 g', points: 1500 }" />
          <div class="hero__notice" aria-hidden="true">
            <span class="hero__notice-icon"><BaseIcon name="circle-plus" :size="20" bare /></span>
            <div>
              <p class="hero__notice-title">Sumaste 140 puntos</p>
              <p class="hero__notice-text">Compra de $14.000 en CV Dietética</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= Cómo funciona ================= -->
    <section id="como-funciona" class="section">
      <div class="container">
        <div class="section__head">
          <h2 class="section__title">Así se suman tus puntos</h2>
          <p class="section__lead">Todo queda registrado en tu cuenta: saldo, compras y canjes, desde el celular.</p>
        </div>
        <!-- Es una secuencia real, por eso los pasos van numerados -->
        <ol class="steps" role="list">
          <li class="step">
            <span class="step__number" aria-hidden="true">1</span>
            <span class="step__icon"><BaseIcon name="user-round-plus" :size="24" bare /></span>
            <h3 class="step__title">Creá tu cuenta</h3>
            <p class="step__text">Desde el celular, en dos minutos. Empezás con 100 puntos de regalo.</p>
          </li>
          <li class="step">
            <span class="step__number" aria-hidden="true">2</span>
            <span class="step__icon"><BaseIcon name="qr-code" :size="24" bare /></span>
            <h3 class="step__title">Mostrá tu código en caja</h3>
            <p class="step__text">Escaneamos tu QR al pagar y la compra se registra en tu cuenta.</p>
          </li>
          <li class="step">
            <span class="step__number" aria-hidden="true">3</span>
            <span class="step__icon"><BaseIcon name="gift" :size="24" bare /></span>
            <h3 class="step__title">Canjeá lo que quieras</h3>
            <p class="step__text">Elegís del catálogo y lo retirás en el local con tu código de canje.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ================= Beneficios y niveles ================= -->
    <section id="beneficios" class="section section--tinted">
      <div class="container perks">
        <div>
          <h2 class="section__title">Cuanto más volvés, más ganás</h2>
          <p class="section__lead">Tu nivel depende de los puntos que sumaste en total. Canjear no te hace bajar.</p>
          <ul class="perks__list" role="list">
            <li>
              <span class="perks__icon" aria-hidden="true"><BaseIcon name="leaf" :size="20" bare /></span>
              <div><h3>Premios que sí usás</h3><p>Frutos secos, granola, yerba orgánica y descuentos en tu compra.</p></div>
            </li>
            <li>
              <span class="perks__icon" aria-hidden="true"><BaseIcon name="sparkles" :size="20" bare /></span>
              <div><h3>Semanas de puntos dobles</h3><p>Promociones pensadas para quienes ya son clientes del local.</p></div>
            </li>
            <li>
              <span class="perks__icon" aria-hidden="true"><BaseIcon name="bell-ring" :size="20" bare /></span>
              <div><h3>Avisos antes de que venzan</h3><p>Te avisamos si tus puntos están por vencer para que no los pierdas.</p></div>
            </li>
          </ul>
        </div>
        <!-- Niveles del negocio (de mayor a menor) -->
        <ol class="tiers" role="list" aria-label="Niveles del programa">
          <li v-for="t in tiers" :key="t.id" class="tier" :class="`tier--${t.color}`">
            <span class="tier__swatch" :style="{ background: Levels.colors(t).dot }" aria-hidden="true"></span>
            <div class="tier__body"><p class="tier__name">{{ t.name }}</p><p class="tier__perk">{{ perkOf(t) }}</p></div>
            <p class="tier__from tabular">{{ t.minPoints === 0 ? 'Al registrarte' : `Desde ${format.points(t.minPoints)} pts al mes` }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ================= Recompensas ================= -->
    <section id="recompensas" class="section">
      <div class="container">
        <div class="section__head section__head--row">
          <div>
            <h2 class="section__title">Algunas cosas que podés llevarte</h2>
            <p class="section__lead">El catálogo cambia según la temporada y el stock del local.</p>
          </div>
          <router-link :to="{ name: 'login' }" class="btn btn--outline">Ver el catálogo completo</router-link>
        </div>
        <ul class="showcase" role="list" :aria-busy="showcase === null ? 'true' : 'false'">
          <!-- Esqueleto mientras carga -->
          <template v-if="showcase === null">
            <li v-for="n in 4" :key="n" class="showcase__item">
              <span class="skeleton showcase__skeleton-art" style="border-radius: 16px"></span>
              <SkeletonBlock height="18px" width="70%" /><SkeletonBlock height="14px" width="40%" />
            </li>
          </template>
          <li v-for="r in showcase || []" :key="r.id" class="showcase__item">
            <RewardArt :category="r.category" size="auto" :icon-size="40" :image="r.image" />
            <p class="showcase__category">{{ REWARD_CATEGORIES[r.category]?.label || '' }}</p>
            <h3 class="showcase__name">{{ r.name }}</h3>
            <p class="showcase__points tabular">{{ format.points(r.points) }} puntos</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ================= Cierre ================= -->
    <section class="closing">
      <div class="container closing__inner">
        <h2 class="closing__title">Tu próxima compra ya puede sumar.</h2>
        <router-link :to="{ name: 'register' }" class="btn btn--honey btn--lg">Crear mi cuenta</router-link>
      </div>
    </section>
  </main>
</template>
