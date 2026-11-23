/**
 * Dominio · Aviso contextual de "Mis puntos".
 *
 * Las rachas y los desafíos NO ocupan lugar fijo en la pantalla principal
 * del cliente: viven en Perfil y en las notificaciones. Esta regla decide
 * si vale la pena mostrar UNA sola línea de aviso, y cuál, por prioridad:
 *   1. Racha de 2+ semanas en riesgo (todavía no compró esta semana).
 *   2. Desafío al que le falta un solo paso.
 *   3. Cerca del siguiente nivel (le falta 20% o menos este mes).
 * Si nada es realmente relevante, devuelve null y no se muestra nada.
 */
import { APP_LINKS } from '../config/navigation.js';
import { format } from '../utils/format.js';
import { challenges as Challenges } from './challenges.js';

export function pickNudge({ business, streak, challenges = [], levelInfo }) {
  if (business?.streaks?.enabled && streak?.atRisk && streak.weeks >= 2) {
    return { icon: 'flame', tone: 'honey', text: `¡Una compra más esta semana mantiene tu racha de ${streak.weeks} semanas!`, to: APP_LINKS.profile };
  }
  const almost = challenges.find((c) => !c.progress.done && c.progress.missing === 1 && c.type !== 'puntos');
  if (almost) {
    return { icon: 'target', tone: 'green', text: `Te falta 1 para "${almost.name}" (${Challenges.rewardText(almost)})`, to: APP_LINKS.profile };
  }
  if (levelInfo?.next && levelInfo.missing > 0 && levelInfo.missing <= levelInfo.next.minPoints * 0.2) {
    return {
      icon: 'star', tone: 'sky', to: APP_LINKS.profile,
      text: `Te faltan ${format.points(levelInfo.missing)} puntos este mes para ser ${levelInfo.next.name} en ${format.period(levelInfo.nextPeriod)}`,
    };
  }
  return null;
}
