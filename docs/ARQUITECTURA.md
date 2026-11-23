# GO Puntos · Arquitectura del frontend Vue

Documentación técnica del proyecto: estructura, componentes, rutas, stores, services, personalización visual y reglas de negocio. La guía para instalar y probar la aplicación está en el [README](../README.md); el modelo de datos y los endpoints, en [MODELO_DATOS.md](MODELO_DATOS.md).

## 1. Estructura del proyecto

```
go-puntos/
├── index.html              punto de montaje + script que aplica la paleta antes de pintar
├── vite.config.js          Vite + plugin de Vue + alias "@" → src
├── package.json
├── .env.example
├── public/favicon.svg
├── database/               esquema MySQL go_puntos_v2 (diseño; todavía no conectado)
├── docs/                   MODELO_DATOS.md, ARQUITECTURA.md, diagnóstico y plan de la integración con MySQL
├── tests/                  pruebas con node --test
├── tools/generar-iconos.mjs
└── src/
    ├── main.js             crea la app, registra Pinia y el router
    ├── App.vue             ruta actual + avisos (toasts) + confirmaciones
    ├── assets/styles/      CSS de la maqueta, sin cambios (tokens, base, components, app, admin, auth, landing)
    ├── config/             app.config.js (useMocks, apiUrl…), catalogs.js, navigation.js
    ├── theme/              palettes.js (paletas prediseñadas), paletteBuilder.js (paleta personalizada guiada),
    │                       darkMode.js (modo oscuro derivado), checks.js (controles WCAG), color.js, theme.js (aplicación)
    ├── utils/              dates, format, validators, helpers
    ├── domain/             REGLAS DE NEGOCIO PURAS (sin Vue): points, levels, streaks, challenges,
    │                       segments, ranking, offers, rewards, notifications, nudges, platform (Superadmin)
    ├── mocks/              API SIMULADA (se elimina con el backend)
    │   ├── server.js       operaciones del "servidor": compras, canjes, cierre del mes…
    │   ├── seed.js         genera 5 meses de historia usando las mismas reglas
    │   ├── db.js           persistencia de los datos de prueba en el navegador
    │   ├── adapter.js      simula latencia, contexto del pedido y errores HTTP
    │   └── api/*.js        un handler por endpoint (auth, customers, businesses, rewards…)
    ├── services/           ÚNICA puerta a los datos (ver sección 5)
    ├── stores/             Pinia: auth, business, customer, notification, platform
    ├── composables/        useForm, useAsync, useToast, useConfirm, useSessionActions,
    │                       useClientContext, useSettingsContext, useImageResize, useBusinessStatusAction
    ├── router/             routes.js, access.js (reglas de acceso puras), guards.js, index.js
    ├── layouts/            PublicLayout, AuthLayout, ClientLayout, BareLayout, AdminLayout, PlatformLayout
    ├── components/         base · brand · loyalty · admin · cashier · editors · settings · platform
    └── views/              public · auth · client · admin · platform
```

Todo el código está comentado en español: cada archivo tiene un encabezado con su responsabilidad y los templates marcan sus partes con comentarios HTML.

---

## 2. Componentes reutilizables

| Carpeta | Componentes |
|---|---|
| `base/` | **ThemeModePicker** (claro / oscuro / automático), **BaseButton** (variantes, enlace, estado de carga), **BaseField** (texto, email, teléfono, número, fecha, contraseña con ojo, textarea, select; errores accesibles), **BaseToggle**, **BaseCheckbox**, **BaseSheet** (hoja/modal con `<dialog>`), **BaseAlert**, **BaseIcon** (Lucide), **ChipTabs** (pestañas/filtros), **EmptyState**, **ProgressBar**, **SkeletonBlock**, **StatusPill**, **UserAvatar**, **ImagePicker**, **ScreenHead** (encabezado de pantalla), **ToastHost**, **ConfirmHost** |
| `brand/` | **GoLogo** (marca de la plataforma), **BusinessLogo** (logo o monograma del negocio) |
| `loyalty/` | **PointsCard** (saldo disponible), **LevelCard** (nivel vigente y puntos del mes), **LevelBadge**, **RewardRow**, **RewardArt**, **OfferRow**, **MovementList**, **NotificationItem**, **BellButton** (campana con contador), **CelebrateSheet**, **ChallengeItem**, **StreakCard**, **RankingList**, **QrCode**, **BusinessSwitcher**, **NoBusinessState** |
| `admin/` | **PanelShell** (estructura común de los paneles: menú lateral, cajón móvil, barra superior y Apariencia; la usan AdminLayout y PlatformLayout), **PageHead**, **StatTile** (KPI), **BarChart** (una serie, tooltip y tabla accesible), **HBars** (distribuciones), **CustomerChip**, **ActionsSheet** (menú de acciones), **PageLoading**, **PageError** |
| `cashier/` | **CustomerPicker** (escanear o buscar), **PurchaseForm** (importe, ofertas y cálculo), **PurchaseResult**, **RedemptionsPanel**, **RedemptionCard**, **ScannerSheet** (lector simulado) |
| `editors/` | **RewardEditor**, **OfferEditor**, **ChallengeEditor** (los usan las pantallas y el asistente) |
| `platform/` | **ReasonSheet** (confirmación con motivo: rechazar, suspender, bloquear), **AuditList** (actividad de la plataforma), **BusinessCell** (logo, nombre y rubro) |
| `settings/` | Una sección por tema (**SettingsInfo**, **SettingsIdentity**, **SettingsPoints**, **SettingsLevels**, **SettingsRewards**, **SettingsOffers**, **SettingsRanking**, **SettingsPrize**, **SettingsChallenges**, **SettingsNotifications**, **SettingsSummary**, **SettingsTeam**, **SettingsQr**), **PalettePreview** y `sections.js`. Cada sección expone `save()` y se reutiliza en el asistente y en Configuración |

---

## 3. Vistas y rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | LandingView | público |
| `/unirse/:slug` | JoinView (QR público del negocio) | público (con o sin sesión) |
| `/ingresar` · `/registro` · `/recuperar` | LoginView · RegisterView · ForgotPasswordView | sólo sin sesión |
| `/registro-negocio?invitacion=TOKEN` | RegisterBusinessView (alta de un negocio con invitación) | con o sin sesión |
| `/app/puntos` | PointsView (Mis puntos) | contexto cliente |
| `/app/recompensas` (`?vista=canjes` = Mis canjes) | RewardsView | cliente |
| `/app/ofertas` | OffersView | cliente |
| `/app/perfil` | ProfileView (rachas, desafíos, niveles, negocios, cuenta) | cliente |
| `/app/movimientos` | MovementsView | cliente |
| `/app/ranking` | RankingView | cliente |
| `/app/notificaciones` | NotificationsView | cliente |
| `/app/codigo` | QrView (Mi código) | cliente |
| `/app/canje` | RedemptionDoneView (canje confirmado) | cliente |
| `/panel` | DashboardView | dueño o administrador |
| `/panel/caja` (`?vista=canjes`, `?cliente=ID`) | CashierView | dueño, administrador o empleado |
| `/panel/clientes` (`?segmento=`) · `/panel/clientes/:id` | CustomersView · CustomerDetailView | dueño o administrador |
| `/panel/recompensas` · `/panel/ofertas` · `/panel/ranking` · `/panel/desafios` · `/panel/campanas` | RewardsAdminView · OffersAdminView · RankingAdminView · ChallengesAdminView · CampaignsView | dueño o administrador |
| `/panel/configuracion/:section` (negocio, identidad, puntos, niveles, ranking, premio, desafios, notificaciones, empleados, qr) | SettingsView | dueño o administrador |
| `/panel/configuracion-inicial` | OnboardingView (asistente de 11 pasos; el último envía la solicitud a revisión) | dueño o administrador |
| `/plataforma` | PlatformDashboardView | Superadmin |
| `/plataforma/solicitudes` (`?ver=ID`) | RequestsView | Superadmin |
| `/plataforma/negocios` · `/plataforma/negocios/:id` | BusinessesView · BusinessDetailView | Superadmin |
| `/plataforma/invitaciones` (`?nueva=1`) | InvitationsView | Superadmin |
| `/plataforma/auditoria` | AuditView | Superadmin |

**Guardias** (`src/router/access.js`): sesión requerida, sólo invitados, contexto (`cliente` / `staff` / `plataforma`) y roles por negocio (`owner`, `admin`, `empleado`). El rol **depende del contexto activo**, nunca es un dato global de la cuenta. Son experiencia de usuario: la seguridad real la debe hacer la API.

---

## 4. Stores y services

**Stores (Pinia)** — sólo donde hay estado compartido:

| Store | Responsabilidad |
|---|---|
| `auth` | sesión, contexto activo (cliente o panel de un negocio con su rol), permisos, ingreso, registro, cambio de contexto y salida |
| `business` | negocio del panel (nombre, logo, estado, paleta aplicada) |
| `customer` | negocios del cliente y negocio activo (cambiarlo recarga las vistas con los datos de ese negocio) |
| `notification` | contador de no leídas de la campana |
| `platform` | indicadores del panel de la plataforma (contador de solicitudes del menú y dashboard) |

**Services** (`src/services/`) — los componentes nunca acceden a `localStorage`, a los mocks ni a endpoints:

`authService`, `businessService`, `customerService`, `pointsService`, `rewardService`, `offerService`, `rankingService`, `challengeService`, `campaignService`, `notificationService`, `metricsService`, `pushService`, `qrService`, `platformService`.

Cada método declara las dos formas de obtener el dato (handler simulado y llamada HTTP) y `request.js` elige según `useMocks`. Los mocks se cargan con `import()` dinámico: con la API real ni siquiera se descargan. Los errores llegan siempre como `ApiError { message, status, details }` (con `details.field` el formulario marca el campo).

---

## 5. Personalización visual y modo oscuro

- **Paletas prediseñadas**: Bosque, Océano, Terracota, Violeta, Grafito y Frambuesa, cada una con sus variantes de acento.
- **Paleta personalizada (guiada)**: en *Personalización* el negocio elige **sólo dos colores** (principal y acento). El resto (fondos, superficies, textos, bordes, degradé, sombras y su versión oscura) se genera solo (`src/theme/paletteBuilder.js`). Si un color no se lee bien, se ajusta automáticamente (más oscuro o más claro) y la pantalla explica qué se cambió. Muestra cuántos controles de legibilidad cumple en claro y en oscuro; el servidor vuelve a validarla al guardar. Así se mantiene la regla de no permitir colores sueltos ilegibles.
- **Modo claro / oscuro / automático**: es una **preferencia de cada persona** (cliente, dueño, administrador o empleado), no del negocio. El cliente la cambia en *Perfil → Apariencia*; en el panel, con *Apariencia* en el menú lateral. Se guarda en la cuenta (`PUT /me/preferences`), así se respeta en todos sus dispositivos. "Automático" sigue la configuración del sistema.
- El modo oscuro no es una segunda paleta escrita a mano: se deriva de la paleta del negocio (`src/theme/darkMode.js`) y pasa sus propios controles de contraste. La vista previa de *Personalización* permite ver la paleta en claro y en oscuro.
- Todos los colores salen de variables CSS (`tokens.css`), por eso cambiar de paleta o de modo no requiere tocar componentes.

## 6. Qué sigue simulado y qué se conecta a la API

| Hoy (simulado) | Con el backend |
|---|---|
| Datos de prueba en el navegador (`src/mocks/`) | MySQL `go_puntos_v2` (`database/`) a través de una API Node.js + Express + MySQL2 |
| Handlers de `src/mocks/api/*` | Endpoints REST listados en cada service y en `docs/MODELO_DATOS.md` |
| Token `mock-token-<id>` | Token real (JWT o sesión) + validación de rol por negocio (`X-Business-Id`) |
| Recuperar contraseña: no envía correo | `POST /auth/forgot-password` |
| QR ilustrativo (no escaneable) y lector simulado | `qrService.generate()` con una librería real y `createReader()` con la cámara (BarcodeDetector o similar) |
| Push: permiso del navegador y aviso local | Service worker + `POST /me/push-subscriptions` con clave VAPID |
| Imágenes como dataURL | Subida de archivos a la API |
| Cierre del mes con botón; vencimientos y avisos al abrir la app | Tareas programadas del servidor |

Para pasar a la API: implementar los endpoints, poner `VITE_USE_MOCKS=false` y `VITE_API_URL`, y borrar `src/mocks/`. No hace falta tocar componentes ni vistas.

---

## 7. Reglas de negocio (resumen)

- **Saldo disponible** (para canjear) ≠ **puntos del período** (nivel, ranking y desafíos). Sólo las **compras** suman al período; canjes, premios, bonificaciones y ajustes no.
- Canjear descuenta del saldo y **no** baja el nivel ni el ranking.
- Los puntos de un mes definen el **nivel del mes siguiente**. El saldo nunca se reinicia.
- Cálculo de una compra, en orden único: importe → puntos base → multiplicador del nivel vigente → promociones (multiplicadoras no acumulables: gana la de mayor multiplicador; puntos extra después) → redondeo final.
- Todo dato de fidelización pertenece a una **membresía** (cliente + negocio): nunca se mezcla entre negocios.

Detalle completo en `docs/MODELO_DATOS.md`. Las reglas viven en `src/domain/` y las cubre `npm test`.

---

## 8. Diferencias con la maqueta HTML

- Una sola página con router: las URLs pasan de `puntos.html` a `/app/puntos`, de `admin-compras.html` a `/panel/caja`, etc. (las viejas `inicio.html`, `puntos.html`, `login.html` y `admin.html` redirigen).
- La página del QR público pasa de `unirse.html?b=slug` a `/unirse/slug`.
- Pestañas y filtros que antes iban en el `#hash` ahora van en la URL (`?vista=canjes`, `?segmento=vip`, `/panel/configuracion/niveles`).
- El menú lateral del panel suma dos accesos directos a secciones que ya existían dentro de Configuración: **Personalización** (paletas) y **Empleados**.
- Los avisos que la maqueta guardaba en `sessionStorage` para mostrarlos en la página siguiente ahora se muestran directamente (el contenedor de avisos sobrevive al cambio de ruta). El canje confirmado recibe sus datos por el estado de la navegación.
- Los íconos se registran explícitamente (Lucide para Vue, misma versión 0.460 que la maqueta) en lugar de cargarse desde un CDN.
- La sesión guarda el contexto como `{ type, businessId, role }` en lugar de `user.role`.
- Agregados después de la migración: indicadores del dashboard con colores por tema y títulos más grandes, paleta personalizada guiada, modo claro/oscuro/automático por persona y el rol **Superadmin** (invitaciones, solicitudes, estado de los negocios y auditoría).

El diseño (CSS, estructura de cada pantalla y textos) es el de la maqueta.
