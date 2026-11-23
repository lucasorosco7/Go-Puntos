/* =========================================================
   Pestaña "Mis puntos": saldo, cuánto falta, botón para sumar,
   lo que ya puede canjear, la oferta de la semana y los
   últimos movimientos.
   ========================================================= */
(function (GO) {
  const { ui, format, loyalty, escape: esc, paths } = GO;

  const $ = (id) => document.getElementById(id);
  const card = $('points-card');

  function renderError(message) {
    card.innerHTML = ui.alert('error', 'No pudimos cargar tus puntos', message) +
      '<button type="button" class="btn btn--outline btn--block" style="margin-top:var(--sp-3)" data-retry>Reintentar</button>';
    ui.refreshIcons();
    card.querySelector('[data-retry]').addEventListener('click', load);
  }

  function render(data) {
    const { user, movements, rewards, offers } = data;
    const nextReward = loyalty.getNextReward(user.balance, rewards);

    // Saludo
    document.querySelector('[data-user-name]').textContent = user.firstName;
    document.querySelector('[data-user-avatar]').innerHTML = ui.avatar(user, 44);

    // Saldo y progreso
    card.innerHTML = ui.pointsCard({ balance: user.balance, nextReward });

    // Recompensas que ya puede canjear (o las más cercanas, si no le alcanza ninguna)
    const rail = $('rail-rewards');
    const alcanzan = rewards.filter((r) => r.stock > 0 && r.points <= user.balance)
      .sort((a, b) => b.points - a.points);
    const lista = alcanzan.length
      ? alcanzan.slice(0, 5)
      : rewards.filter((r) => r.stock > 0).sort((a, b) => a.points - b.points).slice(0, 5);

    document.querySelector('#canjeables-title').textContent = alcanzan.length ? 'Ya podés canjear' : 'Tus próximas recompensas';
    rail.innerHTML = lista.map((r) => `
      <a class="mini" href="${paths.client.rewards}">
        ${ui.rewardArt(r.category, 'auto', 30)}
        <p class="mini__name">${esc(r.name)}</p>
        <p class="mini__points tabular">${format.points(r.points)} pts</p>
      </a>`).join('');

    // Oferta destacada
    const featured = offers.find((o) => o.featured) || offers[0];
    $('featured-offer').innerHTML = featured
      ? `<a href="${paths.client.offers}" class="row">
          <span class="art art--${featured.category}" style="width:52px;height:52px" aria-hidden="true">${ui.icon('sparkles', 24)}</span>
          <div class="row__body">
            <p class="row__title">${esc(featured.title)}</p>
            <p class="small muted">${esc(featured.when)}</p>
          </div>${ui.icon('chevron-right', 18)}</a>`
      : ui.empty('tag', 'Sin ofertas activas', 'Pronto vamos a publicar nuevas promociones.');

    // Últimos movimientos
    $('last-movements').innerHTML = movements.length
      ? ui.movementList(movements)
      : ui.empty('receipt', 'Todavía no hay movimientos',
          'Mostrá tu código en tu próxima compra para empezar a sumar.');

    ui.refreshIcons();
  }

  async function load() {
    try {
      render(await GO.customerService.getDashboard());
    } catch (err) {
      renderError(err.message);
    }
  }

  load();
})(window.GO);
