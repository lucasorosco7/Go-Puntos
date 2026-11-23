/* =========================================================
   Dashboard del cliente.
   Flujo: muestra skeleton -> pide datos al servicio -> dibuja.
   Después de un canje vuelve a pedir los datos y redibuja.
   ========================================================= */
(function (GO) {
  const { ui, format, loyalty, escape: esc, paths } = GO;
  const root = document.getElementById('dashboard');
  if (!root) return; // la guardia de layout.js pudo redirigir
  let data = null;

  /* ---------- Estados de carga y error ---------- */
  function renderSkeleton() {
    root.innerHTML = `
      <div class="dash__hello"><div style="display:grid;gap:10px;width:100%">
        ${ui.skeleton('40px', 'min(360px, 80%)')}${ui.skeleton('18px', 'min(280px, 60%)')}</div></div>
      <div class="dash__top">${ui.skeleton('330px', '100%', '28px')}
        <div class="dash__aside">${ui.skeleton('150px', '100%', '16px')}${ui.skeleton('90px', '100%', '16px')}</div></div>
      <div class="dash__bottom">${ui.skeleton('340px', '100%', '16px')}${ui.skeleton('340px', '100%', '16px')}</div>`;
  }

  function renderError(message) {
    root.innerHTML = `<div class="alert alert--error" role="alert">
      ${ui.icon('circle-alert', 20, 'alert__icon')}
      <div class="alert__body"><p class="alert__title">No pudimos cargar tu resumen</p>
      <div class="alert__text">${esc(message)}</div></div>
      <button type="button" class="btn btn--secondary btn--sm" data-action="retry"><span>Reintentar</span></button></div>`;
    ui.refreshIcons();
  }

  /* ---------- Vista principal ---------- */
  function render() {
    const { user, movements, rewards, notifications } = data;
    const tier = loyalty.getTier(user.lifetimePoints);
    const nextTier = loyalty.getNextTier(user.lifetimePoints);
    const nextReward = loyalty.getNextReward(user.balance, rewards);
    const featured = rewards.filter((r) => r.featured).sort((a, b) => a.points - b.points).slice(0, 4);
    const redeemable = rewards.filter((r) => r.stock > 0 && r.points <= user.balance).length;

    const subtitle = redeemable > 0
      ? `Tu saldo alcanza para ${redeemable} ${redeemable === 1 ? 'recompensa' : 'recompensas'} del catálogo.`
      : 'Seguí sumando: tu primera recompensa está cerca.';

    const tierText = nextTier
      ? `${ui.progressBar(nextTier.progress, `Progreso hacia nivel ${nextTier.tier.name}`, 'accent')}
         <p class="tier-panel__text">Sumaste <strong class="tabular">${format.points(user.lifetimePoints)}</strong> puntos en total.
         Con <strong class="tabular">${format.points(nextTier.missing)}</strong> más llegás a ${nextTier.tier.name} y ganás
         ${Math.round((nextTier.tier.multiplier - 1) * 100)}% más de puntos por compra.</p>`
      : '<p class="tier-panel__text">Estás en el nivel más alto del programa.</p>';

    const notices = notifications.map((n) => `
      <aside class="notice notice--${n.tone}" aria-label="Aviso">
        ${ui.icon(n.tone === 'accent' ? 'sparkles' : 'info', 20, 'notice__icon')}
        <div><p class="notice__title">${esc(n.title)}</p><p class="notice__body">${esc(n.body)}</p></div>
      </aside>`).join('');

    const rewardRows = featured.map((r) => {
      const canRedeem = r.stock > 0 && r.points <= user.balance;
      const action = canRedeem
        ? `<button type="button" class="btn btn--secondary btn--sm" data-action="redeem" data-id="${r.id}"><span>Canjear</span></button>`
        : '';
      return ui.rewardRow(r, user.balance, { href: paths.client.rewards, actionHtml: action });
    }).join('');

    const movementsHtml = movements.length
      ? ui.movementList(movements)
      : '<p class="dash__empty">Todavía no hay movimientos. Mostrá tu código en tu próxima compra para empezar a sumar.</p>';

    root.innerHTML = `
      <header class="dash__hello">
        <div>
          <h1 class="display dash__title">${format.greeting()}, ${esc(user.firstName)}</h1>
          <p class="dash__subtitle">${subtitle}</p>
        </div>
        <button type="button" class="btn btn--primary btn--md" data-action="show-code">${ui.icon('qr-code', 18)}<span>Mostrar mi código</span></button>
      </header>

      <div class="dash__top">
        ${ui.pointsSummary({ balance: user.balance, tier, nextReward, lastMovement: movements[0] })}
        <div class="dash__aside">
          <section class="panel panel--surface tier-panel" aria-labelledby="tier-title">
            <header class="panel__header"><div>
              <h2 id="tier-title" class="panel__title">Nivel ${tier.name}</h2>
              <p class="panel__description">Socio desde ${format.shortDate(user.memberSince)}</p>
            </div></header>
            ${tierText}
          </section>
          ${notices}
        </div>
      </div>

      <div class="dash__bottom">
        <section class="panel panel--surface" aria-labelledby="mov-title">
          <header class="panel__header">
            <div><h2 id="mov-title" class="panel__title">Últimos movimientos</h2></div>
            <a href="${paths.client.history}" class="panel-link">Ver todos ${ui.icon('chevron-right', 16)}</a>
          </header>
          ${movementsHtml}
        </section>

        <section class="panel panel--surface" aria-labelledby="rew-title">
          <header class="panel__header">
            <div><h2 id="rew-title" class="panel__title">Recompensas destacadas</h2></div>
            <a href="${paths.client.rewards}" class="panel-link">Catálogo ${ui.icon('chevron-right', 16)}</a>
          </header>
          <ul role="list">${rewardRows}</ul>
          <a href="${paths.client.rewards}" class="btn btn--accent btn--md btn--block dash__catalog-btn">
            ${ui.icon('gift', 18)}<span>Explorar todas las recompensas</span></a>
        </section>
      </div>`;

    root.setAttribute('aria-busy', 'false');
    ui.refreshIcons();
  }

  /* ---------- Carga de datos ---------- */
  async function load({ silent = false } = {}) {
    if (!silent) renderSkeleton();
    try {
      data = await GO.customerService.getDashboard();
      render();
    } catch (err) {
      renderError(err.message);
    }
  }

  /* ---------- Modal: código del cliente ---------- */
  function openCode() {
    const { user } = data;
    ui.modal({
      title: 'Tu código GO', size: 'sm',
      description: 'Mostralo en caja antes de pagar para sumar los puntos.',
      body: `<div class="member-code">${ui.qr(user.memberCode)}
        <p class="display tabular member-code__value">${esc(user.memberCode)}</p>
        <p class="member-code__name">${esc(user.firstName)} ${esc(user.lastName)}</p></div>`,
      footer: '<button type="button" class="btn btn--primary btn--md" data-close><span>Cerrar</span></button>',
    });
  }

  /* ---------- Modal: canje en dos pasos (confirmar -> éxito) ---------- */
  function openRedeem(rewardId) {
    const reward = data.rewards.find((r) => r.id === rewardId);
    const balance = data.user.balance;

    const body = (error = '') => `<div class="redeem">
      <div class="redeem__item">${ui.rewardArt(reward.category, 'sm')}
        <div><p class="redeem__name">${esc(reward.name)}</p><p class="redeem__desc">${esc(reward.description)}</p></div></div>
      <dl class="redeem__summary">
        <div><dt>Tu saldo</dt><dd class="tabular">${format.points(balance)}</dd></div>
        <div><dt>Canje</dt><dd class="tabular is-negative">&minus;${format.points(reward.points)}</dd></div>
        <div class="is-total"><dt>Te quedan</dt><dd class="tabular">${format.points(balance - reward.points)} puntos</dd></div>
      </dl>${error ? ui.alert('error', '', error) : ''}</div>`;

    const footer = `<button type="button" class="btn btn--ghost btn--md" data-close><span>Cancelar</span></button>
      <button type="button" class="btn btn--primary btn--md" data-confirm><span>Canjear ${format.points(reward.points)} puntos</span></button>`;

    const m = ui.modal({ title: 'Confirmar canje', description: 'Los puntos se descuentan en el momento.', body: body(), footer });

    m.el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-confirm]');
      if (!btn) return;
      ui.setLoading(btn, true, 'Canjeando');
      m.el.querySelector('[data-close].btn').disabled = true;
      try {
        const { user, code } = await GO.rewardService.redeem(reward.id);
        GO.session.update({ user: { ...GO.session.user(), balance: user.balance } });
        m.update({
          title: 'Canje confirmado', description: '',
          body: `<div class="redeem-done">
            ${ui.icon('circle-check', 40, 'redeem-done__icon')}
            <p>Mostrá este código en caja para retirar <strong>${esc(reward.name)}</strong>.</p>
            <p class="redeem-done__code tabular" aria-label="Código de canje ${code}">${code}</p>
            <p class="redeem-done__note">También lo vas a ver en tus movimientos.</p></div>`,
          footer: '<button type="button" class="btn btn--primary btn--md" data-close><span>Listo</span></button>',
        });
        load({ silent: true }); // refresca saldo y movimientos sin skeleton
      } catch (err) {
        m.update({ body: body(err.message) });
      }
    });
  }

  /* ---------- Eventos (delegación: un solo listener para todo el dashboard) ---------- */
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'retry') load();
    if (action === 'show-code') openCode();
    if (action === 'redeem') openRedeem(Number(target.dataset.id));
  });

  // Mensaje que deja el registro al redirigir aquí
  const flash = sessionStorage.getItem('gopuntos:flash');
  if (flash) { sessionStorage.removeItem('gopuntos:flash'); ui.toast(flash); }

  load();
})(window.GO);
