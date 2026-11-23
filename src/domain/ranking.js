/**
 * Dominio · Ranking mensual.
 *
 * Se ordena por PUNTOS DEL PERÍODO (no por saldo). Los canjes no bajan
 * posiciones porque no restan puntos del período, y los premios no suben
 * posiciones porque no suman al período.
 * Empate: queda arriba quien llegó primero (última compra más antigua).
 */

export const ranking = {
  /** Nombre público entre clientes: "Martina L." (por privacidad nunca se muestra el apellido completo). */
  publicName(user) {
    if (!user) return 'Cliente';
    return `${user.firstName} ${user.lastName ? `${user.lastName.charAt(0)}.` : ''}`.trim();
  },

  /**
   * Arma el ranking de un negocio.
   * Recibe filas [{ membership, user }] y devuelve
   * [{ position, membershipId, userId, name, fullName, points }]
   * sólo con quienes sumaron puntos en el período.
   */
  build(rows) {
    return rows
      .filter((r) => (r.membership.periodPoints || 0) > 0)
      .sort((a, b) => b.membership.periodPoints - a.membership.periodPoints
        || new Date(a.membership.lastPurchaseAt || 0) - new Date(b.membership.lastPurchaseAt || 0))
      .map((r, i) => ({
        position: i + 1,
        membershipId: r.membership.id,
        userId: r.user.id,
        name: ranking.publicName(r.user),
        fullName: `${r.user.firstName} ${r.user.lastName}`,
        points: r.membership.periodPoints,
      }));
  },

  /** Top N y la fila propia del cliente (aunque no esté en el top). */
  topAndMe(list, membershipId, n = 5) {
    return { top: list.slice(0, n), me: list.find((r) => r.membershipId === membershipId) || null, total: list.length };
  },

  medal(position) {
    return { 1: '🥇', 2: '🥈', 3: '🥉' }[position] || '';
  },
};
