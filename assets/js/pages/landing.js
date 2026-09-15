/* Landing: completa las partes que dependen de datos */
(function (GO) {
  const { ui, format, escape: esc } = GO;

  // Tarjeta de puntos de ejemplo en el hero (datos ficticios)
  document.getElementById('hero-summary').innerHTML = ui.pointsCard({
    balance: 1240,
    nextReward: { name: 'Mantequilla de maní 380 g', points: 1500 },
  });

  // Niveles: se generan desde la configuración para no duplicar datos
  const perks = {
    bronce: `Sumás 1 punto por cada ${format.currency(GO.config.PESOS_PER_POINT)}.`,
    plata: '25% más de puntos en cada compra.',
    oro: '50% más de puntos y canjes anticipados.',
  };
  document.getElementById('tiers').innerHTML = [...GO.config.TIERS].reverse().map((t) => `
    <li class="tier tier--${t.id}">
      <span class="tier__swatch" style="background:${t.color}" aria-hidden="true"></span>
      <div class="tier__body"><p class="tier__name">${t.name}</p><p class="tier__perk">${perks[t.id]}</p></div>
      <p class="tier__from tabular">${t.minPoints === 0 ? 'Al registrarte' : `Desde ${format.points(t.minPoints)} pts`}</p>
    </li>`).join('');

  // Vitrina de recompensas: skeleton mientras carga, después los datos
  const showcase = document.getElementById('showcase');
  showcase.innerHTML = Array.from({ length: 4 }, () => `
    <li class="showcase__item">
      <span class="skeleton showcase__skeleton-art" style="border-radius:16px"></span>
      ${ui.skeleton('18px', '70%')}${ui.skeleton('14px', '40%')}
    </li>`).join('');

  GO.rewardService.getAll().then((rewards) => {
    showcase.innerHTML = rewards.filter((r) => r.featured).slice(0, 4).map((r) => `
      <li class="showcase__item">
        ${ui.rewardArt(r.category, 'auto', 40)}
        <p class="showcase__category">${esc(GO.seed.categories[r.category])}</p>
        <h3 class="showcase__name">${esc(r.name)}</h3>
        <p class="showcase__points tabular">${format.points(r.points)} puntos</p>
      </li>`).join('');
    showcase.setAttribute('aria-busy', 'false');
    ui.refreshIcons();
  });

  ui.refreshIcons();
})(window.GO);
