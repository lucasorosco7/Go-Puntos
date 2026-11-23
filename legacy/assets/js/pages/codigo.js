/* Pantalla del código QR: lo que el cliente muestra en caja */
(function (GO) {
  const { ui, format, escape: esc } = GO;
  const user = GO.session.user();
  if (!user) return;

  document.getElementById('qr-card').innerHTML = `
    <div class="qr-card">
      <p style="font-weight:var(--fw-medium);font-size:var(--fs-lg)">${esc(user.firstName)} ${esc(user.lastName)}</p>
      <p class="small muted" style="margin-bottom:var(--sp-5)">Mostralo en caja antes de pagar</p>
      ${ui.qr(user.memberCode, 240)}
      <p class="qr-card__code tabular">${esc(user.memberCode)}</p>
    </div>
    <div class="qr-screen__balance">
      <span style="color:#b7d3c1">Tus puntos</span>
      <span class="tabular" style="font-size:var(--fs-xl);font-weight:var(--fw-medium)">${format.points(user.balance)}</span>
    </div>`;
  ui.refreshIcons();
})(window.GO);
