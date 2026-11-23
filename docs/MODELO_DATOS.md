# GO Puntos · Modelo de datos, API y arquitectura Vue

Este documento describe las reglas de negocio, el modelo de datos previsto para la base, los endpoints de la futura API y cómo se organiza el frontend Vue para conectarse a ella.

> **Importante:** el frontend **no** contiene una base de datos. Los datos simulados de `src/mocks/` son una API de prueba aislada: sólo se alcanzan a través de `src/services/` y desaparecen cuando exista el backend (`VITE_USE_MOCKS=false`). Los nombres de tablas de este documento son la propuesta para el backend; el frontend no depende de ellos.

## 1. Reglas de negocio definitivas

| Regla | Dónde está implementada |
|---|---|
| **Saldo disponible** (`memberships.balance`): puntos para canjear. Sube con compras, bonificaciones, premios y ajustes positivos; baja con canjes y ajustes negativos. **Nunca se reinicia.** | `src/mocks/server.js → addMovement()` (en producción: backend) |
| **Puntos del período** (`memberships.periodPoints`): **sólo los puntos de compras**. Sirven para nivel, ranking y desafíos de puntos. Un canje nunca los resta. | `src/domain/points.js → countsForPeriod()` + `addMovement()` |
| `counts_for_period` lo decide la regla según el **tipo** de movimiento: `compra` = sí; `bonificacion`, `desafio`, `premio`, `ajuste`, `canje` = no. Quien registra el movimiento no puede forzarlo. | `src/domain/points.js → PERIOD_TYPES` |
| **Niveles por período mensual:** los puntos del período de un mes determinan el nivel del **mes siguiente**. El nivel vigente (`memberships.level_id`) sólo cambia en el cierre. Un cliente nuevo arranca en el nivel más bajo. Ej.: septiembre 4.300 → octubre Oro; octubre 2.100 → noviembre Plata. | `src/domain/levels.js`, `closePeriod()` |
| **Cálculo de una compra, en este orden único:** importe → puntos base (equivalencia) → × multiplicador del **nivel vigente** → promociones de puntos → **redondeo final** (una sola vez; los pasos intermedios no se redondean). Ej.: $12.500, $100 = 1 → 125 → Oro ×1,2 = 150 → puntos dobles ×2 = 300. | `src/domain/points.js → calculate()` |
| **Promociones incompatibles:** las multiplicadoras (`puntos_dobles`) **no se acumulan**: se aplica sólo la de mayor multiplicador; si empatan, la que termina antes; si siguen empatadas, la más antigua. Las de puntos extra (`puntos_extra`) se suman después del multiplicador, cada una una vez y sólo si el cajero confirma la condición. | `src/domain/points.js → pickMultiplier()` |
| El **ranking** ordena por puntos del período. Empate: queda arriba quien llegó antes. | `src/domain/ranking.js` |
| **Cierre mensual:** guarda ranking y posiciones, ganador, entrega el premio, guarda para cada cliente el nivel vigente del mes y el **nivel ganado**, aplica ese nivel ganado como vigente del mes siguiente, cierra estadísticas y reinicia **sólo** `period_points`. No borra historial ni toca el saldo. | `closePeriod()` |
| **Premios de desafíos, premios del ranking, bonificaciones y ajustes** suman sólo al saldo. | `countsForPeriod()` |
| **Multi-negocio:** todo lo de fidelización cuelga de `membership_id` + `business_id`. Nunca se mezclan. | todas las consultas filtran por negocio |
| **Roles:** no están en `users`. Un cliente es una fila de `memberships`; un dueño, administrador o empleado es una fila de `business_staff`. La misma cuenta puede tener ambas cosas en negocios distintos (o en el mismo). | `src/mocks/server.js → addStaff(), staffRow()` · `src/mocks/api/common.js → staff()` |
| El **progreso de desafíos** no se guarda: se calcula desde los movimientos. Sólo se guarda cuándo se completó (para premiar una vez). | `src/domain/challenges.js`, `challengeCompletions` |
| Las **rachas** se calculan desde las fechas de compra (semanas lunes a domingo). | `src/domain/streaks.js` |

## 2. Tablas

Tipos pensados para MySQL/PostgreSQL. `id` = entero autoincremental; fechas en ISO 8601 (UTC).

### users — identidad global (una cuenta por persona)
`id, first_name, last_name, email (único), phone, password_hash, active, created_at`
**Sin rol ni negocio.** Lo que una persona puede hacer sale de sus filas en `memberships` (como cliente) y en `business_staff` (como dueño, administrador o empleado).

### business_staff — roles administrativos por negocio
`id, business_id, user_id, role ('owner'|'admin'|'empleado'), active, created_at` — único `(business_id, user_id)`.
- `owner`: dueño; tiene todo lo de `admin` (en el futuro: transferir o cerrar el negocio, facturación).
- `admin`: todo el panel del negocio.
- `empleado`: sólo Caja (buscar cliente, escanear QR, registrar compra, validar canje).
Quitar a un empleado borra (o desactiva) su fila acá; su cuenta de `users` y sus membresías de cliente siguen intactas.

### businesses
`id, slug (único, va en el QR), code_prefix (único, prefijo de códigos: CV), name, logo_url, logo_icon, description, category, address, city, phone, email, social (JSON), palette_id, palette_variant, points_rule (JSON: pesos, points, rounding, minPurchase, welcomeBonus, applyLevelMultiplier), ranking (JSON: enabled, showTop, showPosition), monthly_prize (JSON: enabled, type, points, rewardId, description), challenges_enabled, streaks (JSON), notifications (JSON por tipo + push), redemption_validity_days, status ('borrador'|'activo'), onboarding (JSON: completed, dismissed, steps), current_period ('AAAA-MM'), created_at`
El dueño no es una columna: es la fila `business_staff` con `role = 'owner'`.

> Los campos JSON se pueden normalizar en tablas propias si hace falta consultar por ellos.

### levels
`id, business_id, order, name, min_points (puntos de un período para ganarlo), multiplier (se aplica mientras es el nivel vigente), icon, color, description, benefits (JSON)`

### memberships — el cliente dentro de un negocio
`id, user_id, business_id, code (único, lo que codifica el QR personal: CV-000124), joined_at, balance, period_points, lifetime_points, purchases_count, last_purchase_at, level_id (nivel VIGENTE: se ganó en el período anterior; al sumarse = nivel más bajo), status`
Índice único `(user_id, business_id)`.

### membership_history — una fila por mes cerrado
`membership_id, period, points (puntos del período), level_id (nivel vigente durante ese período), earned_level_id (nivel ganado → vigente en el período siguiente), position` (en el mock está como array `memberships.history`, con `levelId`, `earnedLevelId` y sus nombres).

### movements — libro de puntos (nunca se borra)
`id, business_id, membership_id, user_id, date, type ('compra'|'bonificacion'|'canje'|'ajuste'|'premio'|'desafio'|'vencimiento'), concept, amount (pesos, sólo compras), points (+/-), balance_after, period, counts_for_period (true sólo en compras con puntos > 0), detail (JSON: pasos del cálculo con subtotales, promoción aplicada y omitidas, cajero), created_by, ref_id`

### rewards
`id, business_id, name, description, category, points, stock (null = ilimitado), image_url, valid_from, valid_to, status ('activa'|'pausada'|'finalizada'), featured, created_at`

### redemptions — canjes
`id, business_id, membership_id, user_id, reward_id, reward_name, points, code (único), status ('pendiente'|'entregado'|'vencido'|'anulado'), source ('canje'|'premio'), created_at, expires_at, validated_at, validated_by, validated_by_name`

### offers
`id, business_id, title, description, type ('porcentaje'|'monto_fijo'|'puntos_dobles'|'puntos_extra'|'exclusivo_nivel'|'temporal'), value, category, image_url, start_date, end_date, schedule (texto libre), conditions, level_ids (JSON o tabla offer_levels), featured, auto_apply, min_amount, status ('borrador'|'activa'|'pausada'|'finalizada'), created_at`
"Programada" y "vencida" no se guardan: se calculan con las fechas (`src/domain/offers.js → effectiveStatus`).

### challenges / challenge_completions
`challenges: id, business_id, name, description, type ('compras'|'puntos'|'semanas'|'visitas'|'primer_canje'|'compra_antes'), goal, reward_points, reward_text, start_date, end_date, status, created_at`
`challenge_completions: id, challenge_id, business_id, membership_id, user_id, completed_at` — único `(challenge_id, membership_id)`.

### notifications
`id, business_id (null = aviso de la plataforma), user_id, type, title, body, link, source ('auto'|'campaña'), campaign_id, created_at, read, popup_shown, dedupe_key`
`dedupe_key` evita avisos repetidos (ej. `racha-riesgo:2026-09-28`).

### campaigns
`id, business_id, title, message, audience (JSON: type + value | membershipIds), offer_id, recipients (tabla campaign_recipients), channels, sent_at, created_by, status`

### period_closes — cierre mensual
`id, business_id, period, closed_at, closed_by, ranking_enabled, participants, ranking (JSON top 10), winner (JSON), prize (JSON), stats (JSON: compras, facturación, puntos otorgados/canjeados, clientes activos/nuevos, desafíos completados)`

### push_subscriptions (futuro)
`id, user_id, endpoint, keys (JSON), created_at`


## 2 bis. Correspondencia con las tablas previstas para la base

Nombres en castellano acordados para el backend (MySQL/PostgreSQL). La columna "Hoy en el mock" indica dónde vive cada dato en el servidor simulado.

| Tabla prevista | Contenido | Hoy en el mock |
|---|---|---|
| `usuarios` | identidad global (una cuenta por persona, sin rol) | `users` |
| `negocios` | datos e identidad del negocio, estado, período actual | `businesses` |
| `personal_negocio` | dueño / administrador / empleado por negocio | `businessStaff` |
| `membresias` | el cliente dentro de un negocio: saldo, puntos del período, nivel vigente, código del QR | `memberships` |
| `niveles` | niveles configurables por negocio | `levels` |
| `historial_membresias` | una fila por mes cerrado: puntos, nivel vigente, nivel ganado, puesto | `memberships[].history` |
| `reglas_puntos` | equivalencia, redondeo, mínimo, bienvenida, multiplicador por nivel | `businesses.pointsRule` |
| `movimientos` | libro de puntos (compras, canjes, bonificaciones, premios, ajustes) | `movements` |
| `recompensas` | catálogo | `rewards` |
| `canjes` | canjes con código y validación | `redemptions` |
| `ofertas` / `ofertas_niveles` | promociones y niveles habilitados | `offers` / `offers.levelIds` |
| `desafios` / `desafios_completados` | desafíos y quién los completó | `challenges` / `challengeCompletions` |
| `campanas` / `destinatarios_campana` | campañas y sus destinatarios | `campaigns` / `campaigns.recipients` |
| `notificaciones` | campana del cliente | `notifications` |
| `suscripciones_push` | dispositivos para push (futuro) | — (`pushService` preparado) |
| `cierres_periodo` | cierre mensual: ganador, premio, estadísticas | `periodCloses` |
| `ranking_periodo` | posiciones finales de cada mes | `periodCloses.ranking` |
| `paletas_negocio` | paleta y variante elegidas | `businesses.paletteId / paletteVariant` (las paletas son un catálogo cerrado en `src/theme/palettes.js`) |
| `configuraciones_negocio` | ranking, premio, desafíos, rachas, notificaciones | campos JSON de `businesses` |
| `rachas` | (opcional) caché de rachas; hoy se calculan desde las compras | `src/domain/streaks.js` |
| `progreso_configuracion` | pasos del asistente inicial | `businesses.onboarding` |

## 3. Endpoints esperados

Cada archivo de `src/services/` documenta sus endpoints en el encabezado y declara las dos variantes (mock y API) en cada método. Con `VITE_USE_MOCKS=false` las vistas llaman a la API sin cambios. El encabezado `X-Business-Id` indica el negocio del contexto activo.

| Área | Endpoints | Service |
|---|---|---|
| Auth | `POST /auth/login` (identidad + `access`: roles por negocio y cantidad de membresías), `POST /auth/context {type:'cliente'} \| {type:'staff', businessId}`, `POST /auth/register`, `POST /auth/register-business`, `POST /auth/forgot-password`, `POST /auth/logout`, `PUT /me`, `PUT /me/password` | `authService` |
| Cliente | `GET /me/memberships`, `POST /me/memberships {slug}`, `GET /businesses?status=activo`, `GET /me/businesses/:id/dashboard · movements · profile`, `GET /me/movements` | `customerService` |
| Recompensas | `GET /me/businesses/:id/rewards · redemptions`, `POST /rewards/:id/redeem`, CRUD `/admin/rewards`, `PATCH /admin/rewards/:id/status`, `GET /admin/redemptions`, `GET /staff/redemptions/:code`, `POST /staff/redemptions/:code/validate`, `GET /staff/redemptions?status=pendiente` | `rewardService` |
| Ofertas | `GET /me/businesses/:id/offers`, CRUD `/admin/offers`, `PATCH /admin/offers/:id/status` | `offerService` |
| Puntos (Caja) | `POST /staff/purchases/quote`, `POST /staff/purchases` | `pointsService` |
| Caja (clientes) | `GET /staff/customers?q=`, `GET /staff/customers/by-code/:code`, `GET /staff/customers/:id` | `customerService`, `qrService` |
| Ranking | `GET /me/businesses/:id/ranking`, `GET /admin/ranking`, `POST /admin/periods/close` | `rankingService` |
| Desafíos | CRUD `/admin/challenges`, `PATCH /admin/challenges/:id/status` | `challengeService` |
| Campañas | `GET /admin/campaigns`, `POST /admin/campaigns/preview`, `POST /admin/campaigns` | `campaignService` |
| Notificaciones | `GET /me/notifications`, `GET /me/notifications/unread-count`, `PATCH /me/notifications/:id`, `POST /me/notifications/read-all`, `POST /me/push-subscriptions` | `notificationService`, `pushService` |
| Negocio | `GET /businesses/:slug/public`, `GET /businesses/:slug/rewards`, `GET/PATCH /business`, `PUT /business/levels`, `PATCH /business/onboarding`, `POST /business/onboarding/dismiss`, `POST /business/activate`, `GET/POST/PATCH/DELETE /business/employees` | `businessService` |
| Clientes (panel) | `GET /admin/customers[/:id]`, `POST /admin/customers/:id/adjust` | `customerService` |
| Métricas | `GET /admin/metrics?range=hoy\|semana\|mes\|historico` | `metricsService` |

**Autorización en la API:** los endpoints `/staff/*`, `/business/*` y `/admin/*` buscan la fila de `personal_negocio` del usuario del token para el negocio de `X-Business-Id` y validan el rol (`owner` ⊇ `admin` ⊇ `empleado` en Caja). Los endpoints `/me/*` usan `membresias`. Las guardias del router son sólo experiencia de usuario.

**Sesión en el frontend** (`src/services/session.js`, manejada por el store `auth`): `{ token, user (identidad, sin rol), context: {type:'cliente'} | {type:'staff', businessId, role}, access: {staff:[…], memberships}, activeBusinessId }`. El rol **siempre** sale del contexto activo.

**Tareas programadas del servidor:** cierre mensual (día 1, 00:05), vencimiento de canjes (diario) y aviso de racha en riesgo (miércoles). Mientras se usan mocks, se ejecutan al abrir la app o con el botón "Cerrar el mes".

## 4. Organización del frontend Vue

```
src/
├── config/        valores globales (app.config.js), catálogos y navegación
├── theme/         paletas cerradas y aplicación del tema (variables CSS)
├── utils/         fechas, formato, validadores, ayudas
├── domain/        REGLAS PURAS: points · levels · streaks · challenges · segments · ranking · offers · rewards · notifications · nudges
├── mocks/         API SIMULADA (se elimina con el backend): server.js, seed.js, db.js, adapter.js y api/* (un handler por endpoint)
├── services/      ÚNICA puerta a los datos: un service por área, interfaz idéntica en mock y API
├── stores/        Pinia: auth, business, customer, notification
├── composables/   useForm, useAsync, useToast, useConfirm, useSessionActions, useClientContext, useSettingsContext
├── router/        rutas, reglas de acceso (access.js) y guardias
├── layouts/       Public, Auth, Client, Bare, Admin
├── components/    base · brand · loyalty · admin · cashier · editors · settings
└── views/         public · auth · client · admin
```

- Los componentes y vistas **nunca** acceden a `localStorage`, a los mocks ni a endpoints: sólo a services (y stores).
- Las reglas de negocio viven en `src/domain/` (sin dependencias de Vue): las prueba `npm test` y el backend puede reutilizarlas.
- Para conectar la API: implementar los endpoints de la sección 3, poner `VITE_USE_MOCKS=false` y `VITE_API_URL`, y borrar `src/mocks/`.
