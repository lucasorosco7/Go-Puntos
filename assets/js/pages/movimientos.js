/* Historial completo de puntos ganados y canjeados */
(function (GO) {
  const { ui, format } = GO;
  const list = document.getElementById('mov-list');
  const totalsBox = document.getElementById('totals');
  const filterBox = document.getElementById('mov-filter');

  let movements = [];
  let filter = 'todos';

  const total = (fn) => movements.filter(fn).reduce((a, m) => a + Math.abs(m.points), 0);

  function render() {
    const visibles = filter === 'todos' ? movements : movements.filter((m) => m.type === filter);
    list.innerHTML = visibles.length
      ? ui.movementList(visibles)
      : ui.empty('receipt', 'Sin movimientos de este tipo', 'Probá con otro filtro para ver el resto de tu historial.');
    list.setAttribute('aria-busy', 'false');
    ui.refreshIcons();
  }

  filterBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    filterBox.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
    render();
  });

  list.innerHTML = ui.skeleton('220px', '100%', 'var(--radius-lg)');

  GO.customerService.getMovements().then((data) => {
    movements = data;
    const ganados = total((m) => m.points > 0);
    const canjeados = total((m) => m.points < 0);
    totalsBox.innerHTML = `
      <div class="card card--flat">
        <p class="small muted">Ganados</p>
        <p class="tabular pos" style="font-size:var(--fs-xl)">${format.points(ganados)}</p></div>
      <div class="card card--flat">
        <p class="small muted">Canjeados</p>
        <p class="tabular neg" style="font-size:var(--fs-xl)">${format.points(canjeados)}</p></div>`;
    render();
  }).catch((err) => {
    list.innerHTML = ui.alert('error', 'No pudimos cargar tus movimientos', err.message);
    ui.refreshIcons();
  });
})(window.GO);
