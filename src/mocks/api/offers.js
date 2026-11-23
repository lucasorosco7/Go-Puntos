/**
 * Handlers simulados de ofertas.
 *
 * Cliente: GET /me/businesses/:id/offers (vigentes; las de otro nivel se marcan como no elegibles)
 * Panel:   CRUD /admin/offers y PATCH /admin/offers/:id/status
 */
import { offers as Offers } from '../../domain/offers.js';
import { activeMembership, admin } from './common.js';
import { validateDates } from './rewards.js';

const offerView = (o) => ({ ...o, effectiveStatus: Offers.effectiveStatus(o) });

export const offersApi = {
  forCustomer: () => (s, S, ctx) => {
    const now = new Date();
    const { m, business } = activeMembership(s, S, ctx);
    const level = S.levelStatus(s, m).level;
    const levelList = S.levelsOf(s, business.id);
    return {
      business, level,
      offers: s.offers.filter((o) => o.businessId === business.id && Offers.isLive(o, now))
        .map((o) => ({
          ...o,
          eligible: Offers.isEligible(o, level.id),
          levelNames: (o.levelIds || []).map((id) => levelList.find((l) => l.id === id)?.name).filter(Boolean),
        })),
    };
  },

  list: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    return {
      levels: S.levelsOf(s, b.id),
      offers: s.offers.filter((o) => o.businessId === b.id).map(offerView).sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt)),
    };
  },

  /** Crea o edita. Sólo puede haber una oferta destacada por negocio. */
  save: (data, { notify = true } = {}) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (!String(data.title || '').trim()) throw new S.ServerError('Poné un título a la oferta.', 422, { field: 'title' });
    const type = Offers.TYPES[data.type];
    if (!type) throw new S.ServerError('Elegí el tipo de oferta.', 422, { field: 'type' });
    if (type.valueLabel && !(Number(data.value) > 0)) throw new S.ServerError(`Completá: ${type.valueLabel.toLowerCase()}.`, 422, { field: 'value' });
    if (data.type === 'porcentaje' && Number(data.value) > 100) throw new S.ServerError('El porcentaje no puede superar 100.', 422, { field: 'value' });
    if (data.type === 'exclusivo_nivel' && !(data.levelIds || []).length) {
      throw new S.ServerError('Elegí al menos un nivel para el beneficio exclusivo.', 422, { field: 'levelIds' });
    }
    validateDates(S, data.startDate, data.endDate);
    const clean = {
      title: data.title.trim(), description: (data.description || '').trim(), type: data.type,
      value: type.valueLabel ? Number(data.value) : null, category: data.category || 'general', image: data.image || null,
      startDate: data.startDate || null, endDate: data.endDate || null, conditions: (data.conditions || '').trim(),
      schedule: (data.schedule || '').trim(), levelIds: (data.levelIds || []).map(Number), featured: Boolean(data.featured),
      // Las de puntos dobles se aplican solas en Caja salvo que se indique lo contrario
      autoApply: data.type === 'puntos_dobles' ? data.autoApply !== false : Boolean(data.autoApply),
      minAmount: Number(data.minAmount) || 0, status: data.status || 'borrador', tag: '', tone: '',
    };
    if (clean.featured) s.offers.forEach((o) => { if (o.businessId === b.id) o.featured = false; });
    let o = data.id && s.offers.find((x) => x.id === Number(data.id) && x.businessId === b.id);
    if (o) Object.assign(o, clean);
    else { o = { id: S.nextId(s, 'offers'), businessId: b.id, createdAt: new Date().toISOString(), ...clean }; s.offers.push(o); }
    const notified = notify && o.status === 'activa' ? S.announceOffer(s, o, new Date()) : 0;
    return { offer: offerView(o), notified };
  },

  setStatus: (id, status, { notify = true } = {}) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const o = s.offers.find((x) => x.id === id && x.businessId === b.id);
    if (!o) throw new S.ServerError('No encontramos la oferta.', 404);
    o.status = status;
    const notified = status === 'activa' && notify ? S.announceOffer(s, o, new Date()) : 0;
    return { offer: offerView(o), notified };
  },

  remove: (id) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    s.offers = s.offers.filter((o) => !(o.id === id && o.businessId === b.id));
    return true;
  },
};
