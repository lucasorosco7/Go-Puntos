# GO Puntos · Endpoints del Superadmin (para el backend)

Lista de los endpoints que el backend **Node.js + Express + MySQL2** deberá implementar para conectar el panel de la plataforma. Hoy los resuelve el servidor simulado (`src/mocks/api/platform.js`). Las pantallas no cambian: `src/services/platformService.js` ya declara cada llamada HTTP, y alcanza con poner `VITE_USE_MOCKS=false`.

**Autorización:** salvo la validación pública del enlace, todos exigen una sesión cuyo usuario tenga una fila **activa** en `administradores_plataforma`. Si no la tiene, responden **403**. Ser Superadmin **no** da acceso a los endpoints de los negocios (`/business/*`, `/staff/*`, `/admin/*`).

**Formato de error** (igual que el resto de la API): `{ "error": "mensaje en español", "field"?: "campo" }`, con 400/422 para validación, 403 sin permiso, 404 inexistente, 409 conflicto de estado y 410 invitación no utilizable.

## Plataforma

| Método y ruta | Cuerpo | Respuesta | Tablas MySQL | Reglas |
|---|---|---|---|---|
| `GET /api/platform/dashboard` | — | `{ kpis, byStatus, toReview, recent }` | `negocios`, `solicitudes_negocio`, `invitaciones_registro`, `usuarios`, `usuarios_negocios`, `auditoria_plataforma` | Indicadores calculados con `COUNT … GROUP BY estado`. "En revisión" = solicitud `pendiente` ya enviada |
| `GET /api/platform/invitations` | — | `[invitación]` (sin `token_hash`) | `invitaciones_registro` (+ `solicitudes_negocio`, `negocios`) | "Vencida" = `estado='pendiente' AND fecha_vencimiento <= NOW()` |
| `POST /api/platform/invitations` | `{ email?, days }` | **201** `{ invitation, token }` | `invitaciones_registro` + `auditoria_plataforma` (`crear_invitacion`) | Token aleatorio (`crypto.randomBytes(24)`). Se guarda **sólo** `SHA-256(token)` en `token_hash`. El token se devuelve una única vez. `days` entre 1 y 60 |
| `POST /api/platform/invitations/:id/revoke` | — | invitación | `invitaciones_registro` + auditoría (`revocar_invitacion`) | 409 si ya está `utilizada` o `revocada` |
| `GET /api/public/invitations/:token` | — | `{ valid: true, email?, expiresAt }` o `{ valid: false, reason }` | `invitaciones_registro` | Público. Busca por `token_hash = SHA-256(token)` |
| `GET /api/platform/requests` | — | `[solicitud]` con negocio, solicitante y requisitos | `solicitudes_negocio`, `negocios`, `usuarios`, `niveles`, `recompensas`, `configuracion_puntos` | — |
| `POST /api/platform/requests/:id/approve` | `{ reason? }` | solicitud | `solicitudes_negocio` (`aprobada`, revisor, fecha, motivo) + `negocios.estado='activo'` + `periodos_mensuales` (abre el mes) + auditoría (`aprobar_negocio`) | **Una transacción.** 409 si no está pendiente o no fue enviada |
| `POST /api/platform/requests/:id/reject` | `{ reason }` | solicitud | `solicitudes_negocio` (`rechazada`, `motivo_revision`) + `negocios.estado='rechazado'` + auditoría (`rechazar_negocio`) | Motivo obligatorio (10 a 500 caracteres). Una transacción |
| `GET /api/platform/businesses` | — | `[negocio]` con administrador, clientes, estado, etapa y motivo | `negocios`, `usuarios_negocios`, `usuarios`, `solicitudes_negocio`, `auditoria_plataforma` | Clientes = filas de `usuarios_negocios` con rol Cliente |
| `GET /api/platform/businesses/:id` | — | ficha: datos, equipo, estadísticas, solicitud e historial | las anteriores + `compras`, `recompensas`, `canjes` | — |
| `POST /api/platform/businesses/:id/status` | `{ action, reason }` | negocio | `negocios.estado` + auditoría (`suspender_negocio` / `bloquear_negocio` / `reactivar_negocio`) | `suspender`: activo → suspendido · `bloquear`: activo o suspendido → bloqueado · `reactivar`: suspendido o bloqueado → activo. Motivo obligatorio para suspender y bloquear. 409 si la transición no corresponde |
| `GET /api/platform/audit` | — | `[registro]` con administrador y negocio | `auditoria_plataforma` (+ `administradores_plataforma`, `usuarios`, `negocios`) | Sólo lectura |

## Endpoints de otras áreas que cambian

| Método y ruta | Cambio |
|---|---|
| `POST /api/auth/login` | La respuesta incluye `access.platform: true` si la cuenta es Superadmin |
| `POST /api/auth/context` | Acepta `{ type: 'plataforma' }` (403 si no es Superadmin) |
| `POST /api/auth/register-business` | Exige `invitationToken`. En **una transacción**: usuario (o el existente, con su contraseña), `negocios` (`pendiente`), `usuarios_negocios` (Administrador), configuración por defecto, `solicitudes_negocio` (`pendiente`) e invitación `utilizada` |
| `POST /api/business/submit-review` | Reemplaza a `/business/activate`. Exige la configuración mínima (nombre, regla de puntos, niveles y una recompensa activa). Marca la solicitud como enviada (ver nota) |
| Compras, canjes, validaciones, ajustes, campañas, unirse a un negocio | Responden **409** si `negocios.estado <> 'activo'` |
| Todos los `/business/*`, `/staff/*`, `/admin/*` | Responden **403** con `code: 'BUSINESS_BLOCKED'` si el negocio está `bloqueado` |

## Notas para el esquema

- **Fecha de envío de la solicitud:** el SQL actual no tiene dónde registrar que el dueño envió la solicitud a revisión. La propuesta es la migración **M10**, `solicitudes_negocio.fecha_envio DATETIME NULL` (ver `docs/PLAN_ETAPA3.md`). Está **pendiente de aprobación y no se aplicó**.
- **Motivo de suspensión o bloqueo:** no hay columna en `negocios`. Se lee de la última fila de `auditoria_plataforma` de ese negocio con la acción correspondiente.
- **Dueño del negocio:** el SQL no tiene rol "dueño". Es el `id_usuario` de la solicitud aprobada, que tiene rol Administrador en `usuarios_negocios`.
