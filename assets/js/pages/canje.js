/* Pantalla de canje confirmado: el código para retirar en el local */
(function (GO) {
  const { ui, format, escape: esc, paths } = GO;
  const root = document.getElementById('done');

  // El dato lo dejó la pantalla de recompensas antes de navegar acá
  let info = null;
  try { info = JSON.parse(sessionStorage.getItem('gopuntos:canje')); } catch { info = null; }

  if (!info) {
    root.innerHTML = ui.empty('gift', 'No hay ningún canje reciente', 'Elegí una recompensa del catálogo para canjear tus puntos.') +
      `<a href="${paths.client.rewards}" class="btn btn--block" style="margin-top:var(--sp-4)">Ver recompensas</a>`;
    ui.refreshIcons();
    return;
  }
  sessionStorage.removeItem('gopuntos:canje');

  const user = GO.session.user();
  root.innerHTML = `
    <div class="done">
      <span class="done__icon" aria-hidden="true">${ui.icon('check', 40)}</span>
      <h1>¡Listo, ${esc(user.firstName)}!</h1>
      <p class="muted" style="max-width:34ch">Canjeaste <b style="color:var(--text);font-weight:var(--fw-medium)">${esc(info.name)}</b>.
        Retiralo en el local mostrando este código.</p>

      <div class="done__code">
        <p class="small muted">Código de canje</p>
        <b class="tabular">${esc(info.code)}</b>
        <button type="button" class="link" data-copy>${ui.icon('copy', 14)} Copiar código</button>
      </div>
      <p class="small muted" style="margin-top:var(--sp-3);display:flex;align-items:center;gap:6px">
        ${ui.icon('clock', 14)} Válido por 30 días</p>

      <section class="points points--compact" style="width:100%;margin-top:var(--sp-6)" aria-label="Tu nuevo saldo">
        <span class="points__label">Tu nuevo saldo</span>
        <span class="points__value tabular">${format.points(info.balance)} pts</span>
      </section>

      <a href="${paths.client.home}" class="btn btn--block" style="margin-top:var(--sp-5)">Volver a mis puntos</a>
      <a href="${paths.client.rewards}" class="btn btn--ghost btn--block">Seguir viendo recompensas</a>
    </div>`;

  root.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(info.code);
      ui.toast('Código copiado.');
    } catch {
      ui.toast('No pudimos copiar. Anotá el código.', 'error');
    }
  });

  ui.refreshIcons();
})(window.GO);
