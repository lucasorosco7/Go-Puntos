/* =========================================================
   Pestaña "Recompensas": lista simple con un solo botón.
   Empieza mostrando las que al cliente le alcanzan.
   ========================================================= */
(function (GO) {
  const { ui, format, escape: esc } = GO;
  const list = document.getElementById('rewards-list');
  const filterBox = document.getElementById('filter');

  let rewards = [];
  let balance = 0;
  let filter = 'alcanzan';

  const alcanzan = () => rewards.filter((r) => r.stock > 0 && r.points <= balance);

  function render() {
    const visibles = (filter === 'alcanzan' ? alcanzan() : rewards)
      .slice()
      .sort((a, b) => (b.stock > 0) - (a.stock > 0) || a.points - b.points);

    // Los contadores ayudan a decidir sin entrar a cada pestaña
    filterBox.querySelector('[data-filter="alcanzan"]').textContent = `Me alcanzan · ${alcanzan().length}`;
    filterBox.querySelector('[data-filter="todas"]').textContent = `Todas · ${rewards.length}`;

    list.innerHTML = visibles.length
      ? visibles.map((r) => ui.rewardRow(r, balance, ui.rewardAction(r, balance))).join('')
      : `<li>${ui.empty('gift', 'Todavía no te alcanza para ninguna',
          'Seguí sumando puntos con tus compras. Mirá todas para ver qué se viene.')}</li>`;
    list.setAttribute('aria-busy', 'false');
    ui.refreshIcons();
  }

  /* Canje en un solo paso: hoja de confirmación y listo */
  function confirmRedeem(reward) {
    const after = balance - reward.points;
    const sheet = ui.sheet({
      title: '¿Canjeás esta recompensa?',
      description: reward.name,
      body: `<div style="display:flex;justify-content:center;gap:var(--sp-7);text-align:center;margin:var(--sp-5) 0">
          <div><p class="small muted">Usás</p><p class="tabular neg" style="font-size:var(--fs-xl)">&minus;${format.points(reward.points)}</p></div>
          <div style="width:1px;background:var(--line)"></div>
          <div><p class="small muted">Te quedan</p><p class="tabular" style="font-size:var(--fs-xl);font-weight:var(--fw-medium)">${format.points(after)}</p></div>
        </div><div data-sheet-error></div>`,
      actions: `<button type="button" class="btn btn--lg btn--block" data-confirm>Sí, canjear ${format.points(reward.points)} puntos</button>
        <button type="button" class="btn btn--ghost btn--block" data-close>Cancelar</button>`,
    });

    sheet.el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-confirm]');
      if (!btn) return;
      ui.setLoading(btn, true, 'Canjeando');
      try {
        const result = await GO.rewardService.redeem(reward.id);
        // El resultado se muestra en su propia pantalla, más clara en el celular
        sessionStorage.setItem('gopuntos:canje', JSON.stringify({
          name: reward.name, code: result.code, balance: result.user.balance,
        }));
        location.href = 'canje.html';
      } catch (err) {
        sheet.el.querySelector('[data-sheet-error]').innerHTML = ui.alert('error', '', err.message);
        ui.setLoading(btn, false);
        ui.refreshIcons();
      }
    });
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="redeem"]');
    if (!btn) return;
    confirmRedeem(rewards.find((r) => r.id === Number(btn.dataset.id)));
  });

  filterBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    filterBox.querySelectorAll('button').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    render();
  });

  // Esqueleto mientras cargan los datos
  list.innerHTML = Array.from({ length: 4 }, () =>
    `<li>${ui.skeleton('86px', '100%', 'var(--radius-lg)')}</li>`).join('');

  (async function load() {
    try {
      const [all, dashboard] = await Promise.all([
        GO.rewardService.getAll(),
        GO.customerService.getDashboard(),
      ]);
      rewards = all;
      balance = dashboard.user.balance;
      document.querySelector('[data-balance]').textContent = `${format.points(balance)} pts`;
      render();
    } catch (err) {
      list.innerHTML = `<li>${ui.alert('error', 'No pudimos cargar el catálogo', err.message)}</li>`;
      ui.refreshIcons();
    }
  })();
})(window.GO);
