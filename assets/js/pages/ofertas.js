/* Pestaña "Ofertas": promociones del local de esta semana */
(function (GO) {
  const { ui, escape: esc } = GO;
  const hero = document.getElementById('offer-hero');
  const list = document.getElementById('offers-list');

  list.innerHTML = Array.from({ length: 3 }, () =>
    `<li>${ui.skeleton('96px', '100%', 'var(--radius-lg)')}</li>`).join('');

  GO.offerService.getAll().then((offers) => {
    const featured = offers.find((o) => o.featured);
    const rest = offers.filter((o) => o !== featured);

    hero.innerHTML = featured ? `
      <section class="offer-hero" aria-label="Oferta destacada">
        <span class="pill" style="background:var(--honey);color:var(--deep)">${ui.icon('sparkles', 13)} ${esc(featured.tag)}</span>
        <h2 class="offer-hero__title">${esc(featured.title)}</h2>
        <p class="offer-hero__date">${esc(featured.when)}</p>
        <span class="offer-hero__deco" aria-hidden="true">${ui.icon('shopping-basket', 52)}</span>
      </section>` : '';

    list.innerHTML = rest.length
      ? rest.map(ui.offerRow).join('')
      : `<li>${ui.empty('tag', 'Sin ofertas activas', 'Pronto vamos a publicar nuevas promociones del local.')}</li>`;
    list.setAttribute('aria-busy', 'false');
    ui.refreshIcons();
  }).catch((err) => {
    list.innerHTML = `<li>${ui.alert('error', 'No pudimos cargar las ofertas', err.message)}</li>`;
    ui.refreshIcons();
  });
})(window.GO);
