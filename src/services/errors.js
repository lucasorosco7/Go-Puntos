/**
 * Error común de la capa de servicios.
 *
 * Tanto la API real como el servidor simulado responden los errores con
 * este mismo formato, así los componentes los muestran siempre igual:
 *   message: texto en español para mostrar al usuario
 *   status:  código HTTP (401 sin sesión, 403 sin permiso, 404, 409 conflicto, 422 validación)
 *   details: datos extra; por ejemplo { field: 'email' } para marcar el campo con error
 *            o { code: 'NO_MEMBERSHIP' } cuando el cliente todavía no se sumó a ningún negocio
 */
export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
