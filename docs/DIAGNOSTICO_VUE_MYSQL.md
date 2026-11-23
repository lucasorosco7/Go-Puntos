# GO Puntos · Diagnóstico Vue ↔ MySQL (go_puntos_v2) y plan de cambios

> **Estado:** documento de planificación de la **próxima etapa** (backend Node.js + Express + MySQL2). Nada de lo que propone está implementado todavía: la aplicación actual funciona con datos simulados. Las migraciones que menciona son propuestas y **no** se aplicaron a `database/go_puntos_v2.sql`.

**Etapa 1 (diagnóstico) y Etapa 2 (propuesta).** No modifiqué ningún archivo del proyecto ni del esquema. La Etapa 3 empieza cuando apruebes el plan y respondas las decisiones de la sección 11.

**Qué revisé:**
- `GO-Puntos-vue_2.zip`: es idéntico, archivo por archivo, al último ZIP entregado.
- `go_puntos_v2.sql`: 28 tablas.
- El diagrama EER.
- `docs/MODELO_DATOS.md`.

**Qué comprobé realmente:**
- `npm test`: **55 de 55 pruebas pasan** con Node 22. Cubren las reglas de puntos, niveles, ranking, desafíos y rachas, las guardias de rutas, los servicios en modo simulado y el contraste de las paletas.
- El SQL lo analicé leyéndolo. **No** lo cargué en un servidor MySQL. En la Etapa 3 voy a probar las migraciones contra un MySQL/MariaDB real si puedo instalar uno en el entorno; si no, lo voy a aclarar.

---

## 1. Resumen

1. **No existe backend.** Toda la aplicación funciona con una API simulada (`src/mocks/`), y los datos se guardan en el `localStorage` del navegador. Lo bueno es que la arquitectura ya está preparada: las vistas sólo hablan con `src/services/`, y cada servicio tiene su variante `api` con el endpoint documentado. Conectar MySQL es, sobre todo, construir el backend y ajustar la capa de servicios.
2. **El núcleo de la fidelización coincide bien con MySQL.** Coinciden el saldo, las compras, los movimientos, los canjes, los niveles, los períodos, los resultados mensuales, los desafíos, las campañas y las notificaciones. Muchos datos que Vue guarda (como el nivel vigente o los puntos del mes) **se pueden calcular** con las tablas existentes, sin agregar columnas.
3. **Hay cuatro huecos que impiden funcionar sin perder funciones:**
   - Las **ofertas** no tienen tipo ni valor. Sin esos datos, la Caja no puede calcular *puntos dobles* ni *puntos extra*.
   - **No hay dónde guardar la configuración del programa**: ranking activado o no, Top N, desafíos activados, rachas, avisos y días de validez de un canje. Es un requisito del proyecto (por ejemplo, "el negocio podrá activar o desactivar el ranking").
   - **No existe `usuarios.preferences`.** No hay dónde guardar el modo claro, oscuro o automático.
   - **El premio mensual "recompensa"** genera un canje de 0 puntos, y `canjes` lo rechaza (`CHECK puntos_utilizados > 0`).
4. **`negocios.custom_palette` tampoco existe, pero no hace falta.** Las tres columnas `color_primario`, `color_secundario` y `color_acento` alcanzan para guardar tanto las paletas prediseñadas como la personalizada (ver 5.3).
5. **Las 4 tablas nuevas de la plataforma no tienen contraparte en Vue.** Hoy cualquiera puede crear un negocio desde "Registrar mi negocio". Con el nuevo modelo hace falta:
   - una invitación;
   - una solicitud;
   - la aprobación de un administrador de la plataforma;
   - un panel para ese administrador.
6. **Hay tres reglas de Vue que chocan con el SQL y requieren tu decisión** (sección 11):
   - el estado `borrador` y el botón "Activar programa";
   - que una misma persona sea cliente y empleado del **mismo** negocio;
   - que una oferta aplique a **varios** niveles (MySQL guarda uno solo).
7. **Los datos de ejemplo del SQL tienen algunos problemas** que conviene corregir: contraseñas en texto plano, un negocio sin administrador y un saldo que no coincide con los movimientos (sección 8).

---

## 2. Funcionalidades de Vue y dónde quedarían en MySQL

**Todas** las funcionalidades usan hoy datos simulados. La columna "Encaje" indica qué tan directo es llevarlas a MySQL.

| Funcionalidad en Vue | Tablas MySQL | Encaje |
|---|---|---|
| Login, registro, una cuenta para varios negocios | `usuarios`, `usuarios_negocios`, `roles` | ✅ directo |
| Contexto activo (cliente o personal de un negocio) | `usuarios_negocios` (+ `roles`) | ✅ directo |
| Dueño, administrador y empleado | `usuarios_negocios.id_rol` | 🟡 en SQL no existe "dueño" (se deduce; ver 5.1) |
| Equipo (alta y baja de empleados) | `usuarios_negocios` | 🟡 regla de "un rol por negocio" (decisión B) |
| Alta de negocio y configuración inicial | `negocios`, `solicitudes_negocio`, `invitaciones_registro` | 🔴 cambia el flujo (decisión A) |
| Identidad visual y paleta personalizada | `negocios.color_*` | ✅ sin migración (5.3) |
| Modo claro, oscuro o automático por persona | — | 🔴 falta una columna (migración M1) |
| Regla de puntos (equivalencia, redondeo, mínimo, bienvenida) | `configuracion_puntos` (versionada por `fecha_desde`) | ✅ (falta sólo "aplicar multiplicador del nivel") |
| Niveles Bronce, Plata y Oro configurables | `niveles` | 🟡 color y descripción (5.4) |
| Caja: cotizar y registrar compra | `compras` + `movimientos_puntos` + `saldos_puntos` + `resultados_mensuales` | ✅ (el detalle del cálculo no se guarda; 5.6) |
| Saldo disponible | `saldos_puntos.saldo_actual` | ✅ |
| Puntos del período | `resultados_mensuales.puntos_ganados` del período abierto | ✅ se calcula |
| Nivel vigente | `id_nivel_obtenido` del período **anterior** | ✅ se calcula |
| Movimientos | `movimientos_puntos` | 🟡 falta el vínculo con el canje (5.6) |
| Recompensas | `recompensas` | 🟡 faltan imagen, categoría y destacada (5.7) |
| Canjes con código y validación | `canjes` | 🟡 falta el vencimiento y el premio de 0 puntos no entra (5.8) |
| Ofertas (6 tipos) | `ofertas` | 🔴 falta el tipo y el valor (migración M2) |
| Ranking mensual, Top 5 y posición propia | `resultados_mensuales.posicion_ranking` | ✅ |
| Premio mensual | `premios_ranking` (por período) | 🟡 se configura por período, no por negocio (5.9) |
| Cierre mensual e historial | `periodos_mensuales`, `resultados_mensuales`, `premios_ranking` | ✅ |
| Desafíos y su progreso | `desafios`, `progreso_desafios` | ✅ |
| Rachas | `rachas_clientes` | ✅ (como caché; hoy se calculan) |
| Segmentos (nuevos, frecuentes, VIP, en riesgo, inactivos) | `segmentos`, `usuarios_segmentos` | 🟡 hoy se calculan; MySQL permite guardarlos |
| Campañas | `campanas`, `destinatarios_campana` | ✅ (el público elegido no se guarda, sólo los destinatarios) |
| Notificaciones y campana con contador | `notificaciones` | 🟡 faltan enlace, origen y clave anti-duplicado (5.10) |
| Activar o desactivar ranking, desafíos, rachas y avisos | — | 🔴 falta una tabla (migración M3) |
| Dashboard y estadísticas | consultas sobre `compras`, `movimientos_puntos`, `canjes` | ✅ se calculan |
| QR público del negocio | `negocios.qr_publico` | ✅ (es el `slug` de Vue) |
| QR personal del cliente | — | ✅ se calcula a partir de `id_usuario_negocio` |
| Ajustes manuales de puntos | `movimientos_puntos` (tipo `ajuste`) + `auditoria` | ✅ |
| Push (preparado, no real) | — | ⏳ puede esperar |
| Recuperar contraseña | — | ⏳ puede hacerse sin tabla (token firmado) |
| Administración de la plataforma | 4 tablas nuevas | 🆕 no existe en Vue |

---

## 3. Las 28 tablas, una por una

| # | Tabla | Equivalente en Vue | Estado |
|---|---|---|---|
| 1 | `usuarios` | `users` | 🟡 falta la preferencia de apariencia; Vue no usa `email_verificado` |
| 2 | `roles` | owner/admin/empleado en `businessStaff`, cliente en `memberships` | 🟡 SQL: Administrador, Empleado y Cliente (no hay "dueño") |
| 3 | `usuarios_negocios` | `businessStaff` + `memberships` | 🟡 único por `(usuario, negocio)`: **un solo rol por negocio** |
| 4 | `negocios` | `businesses` | 🟡 faltan campos de Vue (5.2); los estados no coinciden |
| 5 | `configuracion_puntos` | `businesses.pointsRule` | ✅ falta sólo `applyLevelMultiplier`; SQL agrega `vencimiento_meses` |
| 6 | `niveles` | `levels` | 🟡 `color` (hex frente a token), sin `description`, `beneficio` es un solo texto |
| 7 | `saldos_puntos` | `memberships.balance` | ✅ |
| 8 | `compras` | movimientos de tipo `compra` | ✅ `id_operador_negocio` = quien cobró |
| 9 | `movimientos_puntos` | `movements` | 🟡 sin `detail`, `createdBy` ni `refId` |
| 10 | `recompensas` | `rewards` | 🟡 sin imagen, categoría, destacada ni fecha de alta |
| 11 | `canjes` | `redemptions` | 🟡 sin `expiresAt` ni `source`; `CHECK > 0` |
| 12 | `ofertas` | `offers` | 🔴 sin tipo, valor, aplicación automática ni mínimo; **un** nivel en vez de varios |
| 13 | `desafios` | `challenges` | ✅ (falta `rewardText`, que es opcional) |
| 14 | `progreso_desafios` | `challengeCompletions` | ✅ (y además permite guardar el progreso) |
| 15 | `rachas_clientes` | se calcula (`domain/streaks.js`) | ✅ caché |
| 16 | `periodos_mensuales` | `businesses.currentPeriod` + `periodCloses` | ✅ |
| 17 | `resultados_mensuales` | `memberships.history` + puntos del período | ✅ |
| 18 | `premios_ranking` | `businesses.monthlyPrize` + `periodCloses.prize` | 🟡 por período |
| 19 | `notificaciones` | `notifications` | 🟡 sin `link`, `source`, `campaignId`, `popupShown` ni `dedupeKey` |
| 20 | `campanas` | `campaigns` | ✅ (sin `audience` ni `offerId`) |
| 21 | `destinatarios_campana` | `campaigns.recipients` | ✅ |
| 22 | `segmentos` | `domain/segments.js` (fijos) | 🟡 hay que cargar los 5 segmentos estándar en cada negocio |
| 23 | `usuarios_segmentos` | se calcula | 🟡 opcional: tarea nocturna |
| 24 | `auditoria` | — | 🆕 Vue no registra auditoría (lo haría el backend) |
| 25 | `administradores_plataforma` | — | 🆕 |
| 26 | `invitaciones_registro` | — | 🆕 |
| 27 | `solicitudes_negocio` | — | 🆕 |
| 28 | `auditoria_plataforma` | — | 🆕 |

---

## 4. Reglas de negocio: cómo se cumplen con este esquema

| Regla | Cómo se resuelve con las tablas actuales |
|---|---|
| La configuración de puntos pertenece a cada negocio | `configuracion_puntos.id_negocio`. Se usa la fila `activo` con la `fecha_desde` más reciente que no sea posterior a la fecha de la compra. Las reglas anteriores quedan como historial (mejor que en Vue, que guarda una sola). |
| **Saldo disponible** | `saldos_puntos.saldo_actual`. Lo modifica **sólo** el backend, en la misma transacción que inserta el `movimientos_puntos` (y `saldo_resultante` debe coincidir). |
| **Puntos del período** = sólo compras | `resultados_mensuales.puntos_ganados` del período `abierto`. Se suma únicamente cuando se registra una **compra**. Bonificaciones, premios, desafíos y ajustes no lo tocan. |
| Un canje **no** resta puntos del período | El canje inserta un movimiento negativo y descuenta `saldos_puntos`, pero **no toca** `resultados_mensuales`. |
| Nivel según los puntos de compras del mes | Al cerrar, `resultados_mensuales.id_nivel_obtenido` queda con el nivel ganado ese mes. El **nivel vigente** de un cliente es el `id_nivel_obtenido` de su último período cerrado; si no tiene ninguno, es el nivel de `orden` más bajo. Es la misma regla que ya usa Vue ("lo ganado en septiembre rige en octubre"), y **no hace falta ninguna columna nueva**. |
| Multiplicador del nivel | `niveles.multiplicador` del nivel vigente, con el mismo orden de cálculo de `domain/points.js`. |
| Ranking por negocio y período | `resultados_mensuales` filtrado por `id_periodo`. Se ordena por `puntos_ganados` y, si hay empate, queda arriba quien llegó antes (fecha de la última compra que sumó). En el cierre se guarda `posicion_ranking`. |
| Cierre mensual | Período a `cerrado`, posiciones guardadas, premio entregado y nuevo período `abierto`. **El saldo no se toca.** |
| Separación entre negocios | Todo cuelga de `id_usuario_negocio` o `id_negocio`. El backend obtiene el negocio del contexto (`X-Business-Id`) y verifica que la fila de `usuarios_negocios` del usuario pertenezca a ese negocio. |
| Permisos por rol | El middleware lee `usuarios_negocios.id_rol` del usuario del token. Los permisos son: **Administrador** = panel completo + Caja; **Empleado** = sólo Caja; **Cliente** = sólo `/me/*`. Las guardias del router de Vue siguen siendo sólo una ayuda visual. |

> La regla "lo ganado en un mes rige el mes siguiente" es la que definimos antes. Tu mensaje dice "los niveles se determinan según los puntos obtenidos por compras durante el período mensual", que la confirma, así que la mantengo. Si en realidad querías que el nivel cambie **en el momento** dentro del mismo mes, avisame, porque cambia el cálculo de la Caja.

---

## 5. Campos que usa Vue y no existen en MySQL, y cómo resolverlos

Cada caso lleva una de estas resoluciones:
- **Calcular**: se obtiene con las tablas actuales.
- **Columna existente**: se guarda en una columna que ya está.
- **Migración**: necesita un cambio en el esquema (sección 9).
- **Sin guardar**: se deja de guardar (se pierde algo menor).
- **Sólo en el navegador**: preferencia local.

### 5.1 Usuarios, roles y personal

| Vue | Resolución |
|---|---|
| `users.preferences.mode` | **Migración M1**: columna `usuarios.modo_apariencia` con CHECK. |
| `users.active` (booleano) | Columna existente: `usuarios.estado` (`activo` / `inactivo`). |
| `users.password` (texto plano en el simulador) | Columna existente: `password_hash` con **bcrypt**. |
| Rol `owner` (dueño) | **Calcular**: es el `id_usuario` de la `solicitudes_negocio` aprobada. Si un negocio no tiene solicitud (como el negocio 1 del SQL), el dueño es su Administrador más antiguo. |
| Rol `admin` | `roles` = Administrador. |
| Cliente y empleado del **mismo** negocio a la vez | **Choca con `uq_un_usuario_negocio`. Decisión B.** |
| `memberships.code` (CV-000124, el que va en el QR) | **Calcular** a partir de `id_usuario_negocio` (por ejemplo `GP-000015`), sin columna. |
| `memberships.levelId`, `periodPoints`, `lifetimePoints`, `purchasesCount`, `lastPurchaseAt` | **Calcular** (sección 4; conteos sobre `compras` y `movimientos_puntos`). |
| `memberships.history` | Columna existente: `resultados_mensuales`. El nivel vigente de cada mes se calcula con el mes anterior. |

### 5.2 Negocios

| Vue | Resolución |
|---|---|
| `slug` | Columna existente: `qr_publico` (único). |
| `codePrefix` (prefijo "CV" de los códigos) | **Calcular** con el nombre o usar un prefijo fijo "GP". No hace falta guardarlo: `codigo_canje` admite cualquier texto. |
| `logo` (Vue guarda la imagen como *data URL*, decenas de KB) | **No entra en `logo_url VARCHAR(255)`.** El backend recibe el archivo, lo guarda en `uploads/` y guarda la URL. Imprescindible. |
| `email`, `phone`, `address`, `createdAt` | Columnas existentes: `email_contacto`, `telefono`, `direccion`, `fecha_registro`. |
| `category`, `city`, `social`, `logoIcon` | **No existen. Decisión E** (agregarlas o dejar de mostrarlas). |
| `status`: `borrador` / `activo` | SQL: `pendiente` / `activo` / `rechazado` / `suspendido` / `bloqueado`. **Decisión A.** |
| `onboarding` (pasos del asistente) | **Calcular** con los datos (¿tiene niveles?, ¿recompensas?, ¿regla de puntos?), como ya hace la lista "Terminá de configurar". "Terminar más tarde" pasa a ser una preferencia del navegador. |
| `currentPeriod` | Columna existente: el `periodos_mensuales` con `estado = 'abierto'`. |
| `ranking`, `challengesEnabled`, `streaks`, `notifications`, `redemptionValidityDays`, `pointsRule.applyLevelMultiplier` | **Migración M3**: tabla `configuracion_programa` (1 a 1 con el negocio). |
| `monthlyPrize` | Columna existente: `premios_ranking` del período abierto (5.9). |

### 5.3 Paleta: **no hace falta migración**

Comprobé que en las paletas prediseñadas **cada combinación de color principal y acento es única** (13 combinaciones, ninguna repetida). Por eso:

- `color_primario` guarda el principal y `color_acento` el acento. Para las prediseñadas, `color_secundario` guarda el tono oscuro (`deep`); para la personalizada queda en NULL.
- Al leer: si el par principal + acento coincide con una paleta del catálogo, es esa paleta y variante; si no, es la **paleta personalizada**, y se reconstruye con `paletteBuilder.js`, como hoy.
- El backend **vuelve a validar el contraste** con los mismos `checks.js` y `paletteBuilder.js` antes de guardar, como ya hace el simulador.
- Lo único que se pierde es el **nombre** de la paleta personalizada (se mostraría "Paleta personalizada"). Si querés conservarlo, se agrega `negocios.nombre_paleta VARCHAR(40) NULL` (opcional, M8).

Esto reemplaza mi propuesta anterior de `custom_palette` y evita agregar columnas.

### 5.4 Niveles

| Vue | Resolución |
|---|---|
| `color`: token (`bronce`, `plata`, `oro`, `acento`) que se adapta a la paleta y al modo oscuro | El SQL guarda hex (`#CD7F32`). Propuesta: guardar el **token** en la misma columna `color VARCHAR(20)`; el backend convierte los hex existentes al token más cercano. Así no se rompe el modo oscuro. |
| `description` | No existe. Puede esperar (se muestra sólo `beneficio`) o agregarse en M8. |
| `benefits` (lista) | Columna existente: `beneficio VARCHAR(255)`, con los beneficios separados por " · ". |
| — `puntos_maximos` (sólo en SQL) | **Calcular**: el backend lo completa como "mínimo del nivel siguiente − 1" cada vez que se guardan los niveles. |

### 5.5 Regla de puntos

- Vue permite "$X = **N** puntos". SQL guarda `pesos_por_punto DECIMAL(12,2)`. Con N distinto de 1 aparecen decimales que se redondean (por ejemplo, $100 = 3 puntos da 33,33). **Propuesta:** fijar la interfaz en "$X = 1 punto", que es la regla del proyecto y la del SQL.
- `vencimiento_meses` (sólo en SQL): Vue **no** implementa el vencimiento de puntos. Puede esperar; si se implementa, es una tarea del backend que genera movimientos de tipo `vencimiento`, que ya están previstos en el catálogo.

### 5.6 Compras y movimientos

| Vue | Resolución |
|---|---|
| `movement.detail` (pasos del cálculo, oferta aplicada, cajero) | No existe. El cajero sale de `compras.id_operador_negocio`. El resumen del cálculo se guarda como texto en `movimientos_puntos.descripcion` (por ejemplo "125 base × Oro 1,5 × Puntos dobles"). La pantalla de Caja ve el detalle completo en la respuesta. |
| `movement.refId` (canje, desafío o cierre que lo generó) | **Falta el vínculo movimiento ↔ canje** (en el SQL de ejemplo, el movimiento de canje no apunta a ningún canje). Recomiendo **M6**: `movimientos_puntos.id_canje` (NULL, FK). |
| `movement.createdBy` en los ajustes | Columna existente: `auditoria` (con `id_usuario_negocio` de quien hizo el ajuste). |
| `period`, `countsForPeriod`, `businessId`, `userId` | **Calcular** (fecha + `periodos_mensuales`; tipo = `compra`; desde `usuarios_negocios`). |

### 5.7 Recompensas

| Vue | Resolución |
|---|---|
| `image` | **No existe `recompensas.imagen_url`**, pero `ofertas` sí la tiene y las instrucciones del proyecto la piden. Recomiendo **M5**. |
| `category` (define la ilustración y los filtros), `featured`, `createdAt` | **Decisión E** (M8 opcional). Sin categoría se usa la ilustración genérica. |
| `status`: `activa` / `pausada` / `finalizada` | La columna es libre, pero el SQL de ejemplo usa `inactiva`. Hay que acordar los valores (propongo los de Vue) y agregar un CHECK. |

### 5.8 Canjes

| Vue | Resolución |
|---|---|
| `expiresAt` | **Calcular**: `fecha_canje` + días de validez del negocio (de `configuracion_programa`, M3). |
| `source = 'premio'` con `points: 0` (premio mensual tipo recompensa) | **Choca con `ck_canje_puntos (> 0)`. Decisión D.** |
| `validatedBy` / `validatedByName` | Columna existente: `id_operador_negocio` + join a `usuarios`. |
| `status`: `pendiente` / `entregado` / `vencido` / `anulado` | Columna libre: se documentan los valores y se agrega un CHECK. |

### 5.9 Premio mensual

`premios_ranking` guarda el premio **de un período** (`posicion`, `tipo_premio`, `valor`, `descripcion`). Vue lo guarda como configuración del negocio. Propuesta sin migración:

- "Configurar el premio" escribe la fila `posicion = 1` del período abierto.
- Al cerrar el mes, el backend copia el premio al período nuevo.
- En los premios de tipo `recompensa`, `valor` guarda el `id_recompensa` (queda documentado).

De paso, el esquema permite premios para el 2.º, 3.º y demás puestos, algo que Vue hoy no ofrece; puede esperar.

### 5.10 Notificaciones y campañas

| Vue | Resolución |
|---|---|
| `link` | **Calcular** con el `tipo`, como ya hace Vue en la mayoría de los casos. |
| `source`, `campaignId` | **Calcular** con `destinatarios_campana`. |
| `popupShown` | Sólo en el navegador. |
| `dedupeKey` (evita avisos repetidos de racha o desafío) | Puede esperar: el backend controla duplicados por `(id_usuario_negocio, tipo, título, día)`. Si después hace falta, se agrega una columna opcional. |
| `businessId = null` (aviso de la plataforma) | No entra (`id_usuario_negocio` es obligatorio). Vue hoy no lo usa. |
| `campaign.audience`, `offerId` | No se guardan. Quedan los destinatarios, que es lo importante. |
| `campaign.message` | Vue no limita el largo; en SQL `campanas.descripcion` admite 255 caracteres y `notificaciones.mensaje` 500. Hay que limitar el formulario a 255. |

### 5.11 Ofertas

| Vue | Resolución |
|---|---|
| `type` (`porcentaje`, `monto_fijo`, `puntos_dobles`, `puntos_extra`, `exclusivo_nivel`, `temporal`), `value`, `autoApply`, `minAmount` | **No existen y la Caja los necesita** para calcular puntos. Sólo hay `beneficio` (texto libre). **Migración M2.** |
| `levelIds` (varios niveles) | SQL: `id_nivel_requerido` (uno). **Decisión C.** |
| `category`, `featured`, `schedule`, `conditions` | `schedule` y `conditions` pueden ir en `beneficio`/`descripcion`. `category` y `featured`, decisión E. |
| `startDate` / `endDate` con hora | `DATE`: el día completo. Alcanza para el uso actual. |

---

## 6. Datos que MySQL tiene y Vue todavía no usa

| Dato | Qué propongo |
|---|---|
| `usuarios.email_verificado`, `fecha_verificacion` | Puede esperar: la verificación por mail necesita un servicio de correo. Mientras tanto, el registro funciona igual. |
| `configuracion_puntos.vencimiento_meses` | Puede esperar (5.5). |
| `configuracion_puntos` versionada por fecha | Se aprovecha: al cambiar la regla se inserta una fila nueva y se conserva la anterior. |
| `niveles.puntos_maximos` | El backend lo completa. |
| `notificaciones.fecha_lectura` | El backend la completa al marcar como leída. |
| `auditoria` (negocio) | El backend registra ajustes, validaciones de canjes, cambios de configuración y altas o bajas de empleados. En Vue, una sección "Actividad del equipo" puede esperar. |
| `rachas_clientes`, `progreso_desafios.progreso_actual` | El backend los actualiza en cada compra (sirven de caché y para consultas rápidas). |
| `segmentos`, `usuarios_segmentos` | Se cargan los 5 segmentos estándar en cada negocio. Guardar la asignación con una tarea nocturna puede esperar. |
| `premios_ranking` para posiciones mayores a 1 | Puede esperar. |
| `compras.estado` / `observaciones` | `observaciones` = la nota del cajero. Anular compras puede esperar. |

---

## 7. Diferencias entre `MODELO_DATOS.md` y el esquema SQL

El documento del proyecto describe **una propuesta anterior**. El SQL es ahora la referencia.

| MODELO_DATOS.md | go_puntos_v2.sql |
|---|---|
| `business_staff` / `personal_negocio` + `memberships` / `membresias` (dos tablas) | **Una sola**: `usuarios_negocios` con `id_rol` |
| Roles `owner`, `admin` y `empleado` | `roles`: Administrador, Empleado y Cliente |
| `memberships.balance` | `saldos_puntos` (tabla aparte) |
| `memberships.period_points` / `level_id` | No existen: se calculan desde `resultados_mensuales` |
| `membership_history` | `resultados_mensuales` |
| `period_closes` (JSON con ranking, ganador y estadísticas) | `periodos_mensuales` + `resultados_mensuales` + `premios_ranking` |
| `challenge_completions` | `progreso_desafios` |
| `businesses.points_rule` (JSON) | `configuracion_puntos` (tabla versionada) |
| `businesses.palette_id` / `custom_palette` | `color_primario` / `color_secundario` / `color_acento` |
| `users.preferences` | no existe |
| `offers.type`, `value`, `level_ids` | no existen; `id_nivel_requerido` es uno solo |
| Ranking, desafíos, rachas y avisos en JSON del negocio | no existen |
| `businesses.status = borrador` | `pendiente` / `activo` / `rechazado` / `suspendido` / `bloqueado` |
| — | `administradores_plataforma`, `invitaciones_registro`, `solicitudes_negocio`, `auditoria_plataforma`, `auditoria`, `segmentos`, `rachas_clientes` |
| `push_subscriptions` | no existe (puede esperar) |
| Nombres en inglés (`created_at`, `business_id`) | Nombres en castellano (`fecha_registro`, `id_negocio`) |

En la Etapa 3 reescribo `MODELO_DATOS.md` a partir del SQL real.

---

## 8. Problemas en los datos de ejemplo del SQL

1. **Contraseñas en texto plano**: `password_hash = '12345'`. Ese valor no es un hash. El login real usará bcrypt, así que esas cuentas no podrían entrar. Propongo un script de datos de prueba que genere los hashes, con contraseñas de demostración documentadas como tales y ninguna real.
2. **"Ferretería Alvear" no tiene Administrador**: `usuarios_negocios` sólo tiene una empleada (María) y tres clientes. Nadie podría entrar al panel. Tampoco tiene una `solicitudes_negocio`, que hoy es obligatoria para los negocios nuevos.
3. **El saldo no coincide con los movimientos**: los movimientos suman 50 − 300 + 100 = −150, pero el saldo es 850. Falta el movimiento inicial (por ejemplo, la bonificación de 1.000 que deja `saldo_resultante = 1050` en el primer movimiento).
4. **El movimiento de canje no apunta al canje** (`id_compra = NULL` y no hay `id_canje`). Por eso recomiendo M6.
5. **`configuracion_puntos.fecha_desde = 2026-11-23`**, pero las compras son del 22 y del 23 a la 01:50. La regla vigente es posterior a esas compras.
6. **`recompensas.estado = 'inactiva'`**: Vue usa `pausada`. Hay que acordar los valores.
7. **`niveles.color` en hex**: ver 5.4.
8. **Zona horaria**: el volcado usa `TIME_ZONE='+00:00'` y las columnas son `DATETIME` (sin zona). Los períodos mensuales se cortan a medianoche de Argentina. Propongo que el backend use siempre `-03:00` (Argentina no tiene horario de verano) y lo configure en la conexión `mysql2`, para que una compra del 30 a las 22 h no caiga en el mes siguiente.

---

## 9. Migraciones propuestas (no aplicadas)

Son **sólo una propuesta**. Todas agregan columnas o tablas y **no borran datos**. Las numero para que puedas aprobarlas una por una.

### Imprescindibles (sin ellas se pierde una función existente)

```sql
-- M1 · Modo claro / oscuro / automático de cada persona
ALTER TABLE usuarios
  ADD COLUMN modo_apariencia VARCHAR(10) NOT NULL DEFAULT 'claro',
  ADD CONSTRAINT ck_usuarios_modo CHECK (modo_apariencia IN ('claro','oscuro','auto'));

-- M2 · Ofertas: lo que la Caja necesita para calcular puntos
ALTER TABLE ofertas
  ADD COLUMN tipo_oferta VARCHAR(30) NOT NULL DEFAULT 'temporal',
  ADD COLUMN valor DECIMAL(10,2) NULL,
  ADD COLUMN aplica_automatica TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN compra_minima DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD CONSTRAINT ck_oferta_tipo CHECK (tipo_oferta IN
    ('porcentaje','monto_fijo','puntos_dobles','puntos_extra','exclusivo_nivel','temporal')),
  ADD CONSTRAINT ck_oferta_valor CHECK (valor IS NULL OR valor >= 0);

-- M3 · Configuración del programa de cada negocio (1 a 1)
CREATE TABLE configuracion_programa (
  id_negocio INT NOT NULL PRIMARY KEY,
  ranking_activo TINYINT(1) NOT NULL DEFAULT 1,
  ranking_top SMALLINT NOT NULL DEFAULT 5,
  ranking_mostrar_posicion TINYINT(1) NOT NULL DEFAULT 1,
  desafios_activos TINYINT(1) NOT NULL DEFAULT 1,
  rachas_activas TINYINT(1) NOT NULL DEFAULT 1,
  rachas_recordatorio TINYINT(1) NOT NULL DEFAULT 1,
  aplicar_multiplicador_nivel TINYINT(1) NOT NULL DEFAULT 1,
  dias_validez_canje SMALLINT NOT NULL DEFAULT 30,
  avisos_desactivados VARCHAR(255) NULL,  -- tipos de aviso apagados, separados por coma
  CONSTRAINT fk_cfgprog_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_cfgprog_top CHECK (ranking_top BETWEEN 1 AND 20),
  CONSTRAINT ck_cfgprog_validez CHECK (dias_validez_canje BETWEEN 1 AND 365)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO configuracion_programa (id_negocio) SELECT id_negocio FROM negocios;
```

**M4 (sólo si en la decisión D elegís conservar el premio "recompensa" como canje).** MySQL 8 no permite modificar un CHECK, así que se reemplaza:

```sql
ALTER TABLE canjes DROP CHECK ck_canje_puntos;
ALTER TABLE canjes ADD CONSTRAINT ck_canje_puntos CHECK (puntos_utilizados >= 0);
```

### Recomendadas

```sql
-- M5 · Imagen de las recompensas (las instrucciones del proyecto la piden)
ALTER TABLE recompensas ADD COLUMN imagen_url VARCHAR(255) NULL;

-- M6 · Vincular el movimiento de un canje con su canje
ALTER TABLE movimientos_puntos
  ADD COLUMN id_canje INT NULL,
  ADD KEY idx_mov_canje (id_canje),
  ADD CONSTRAINT fk_mov_canje FOREIGN KEY (id_canje) REFERENCES canjes (id_canje);

-- M7 · Valores de estado documentados como CHECK
ALTER TABLE recompensas ADD CONSTRAINT ck_recomp_estado CHECK (estado IN ('activa','pausada','finalizada'));
ALTER TABLE canjes ADD CONSTRAINT ck_canje_estado CHECK (estado IN ('pendiente','entregado','vencido','anulado'));
-- (antes: UPDATE recompensas SET estado = 'pausada' WHERE estado = 'inactiva';)
```

### Opcionales (decisión E)

**M8 · Datos de presentación** que Vue ya muestra:
- `negocios`: `categoria VARCHAR(40)`, `ciudad VARCHAR(80)`, `redes_sociales JSON`, `nombre_paleta VARCHAR(40)`;
- `recompensas`: `categoria VARCHAR(40)`, `destacada TINYINT(1)`;
- `ofertas`: `categoria VARCHAR(40)`, `destacada TINYINT(1)`;
- `niveles`: `descripcion VARCHAR(255)`.

> Las migraciones irían en `database/migrations/` con un número y una descripción, junto con un archivo para deshacerlas (`down`).

---

## 10. Propuesta de arquitectura

### 10.1 Separación

```
GO-Puntos/
├── (frontend Vue, como está hoy: src/, tests/, vite.config.js …)
│   └── src/services/  ← única puerta a los datos (modo mock o API)
├── backend/                       ← NUEVO: Node.js + Express + mysql2
│   ├── .env.example               (DB_HOST, DB_USER, DB_PASSWORD=, JWT_SECRET= … sin valores reales)
│   ├── src/app.js · server.js
│   ├── src/db/pool.js             (pool mysql2/promise, zona horaria -03:00, ayudante de transacciones)
│   ├── src/middlewares/           auth (JWT) · contexto (X-Business-Id → usuarios_negocios) · requireRol · plataforma · errores
│   ├── src/routes/                un archivo por área, con los MISMOS endpoints que ya documentan los services
│   ├── src/controllers/           validan la entrada y responden
│   ├── src/services/              lógica: compra, canje, cierre mensual… (reutilizan src/domain del frontend)
│   ├── src/repositories/          ÚNICO lugar con SQL; convierten filas MySQL ↔ objetos que espera Vue
│   └── tests/                     pruebas de servicios contra una base de pruebas
├── database/
│   ├── go_puntos_v2.sql           (tu esquema, sin cambios)
│   ├── migrations/001_… .sql      (M1–M8 aprobadas)
│   └── seeds/demo.sql             (datos de DEMOSTRACIÓN, contraseñas hasheadas por script)
└── docs/                          MODELO_DATOS.md (reescrito desde el SQL), API.md, INSTALACION.md
```

**Principios:**
- **Vue nunca se conecta a MySQL.** Habla con Express por HTTP.
- **Las reglas de puntos no se duplican.** `src/domain/` (points, levels, ranking, challenges, streaks, segments) y `src/theme/` (validación de paletas) son JavaScript puro: el backend los importa tal cual. Las mismas pruebas validan las dos puntas.
- **Los repositorios traducen nombres.** MySQL usa `id_usuario_negocio`, `saldo_actual`…; Vue recibe los mismos objetos de hoy (`membershipId`, `balance`…). Así las vistas casi no cambian.
- **Toda operación de puntos va en una transacción**: compra + movimiento + saldo + resultado mensual + desafíos + racha. Si falla una parte, no se guarda nada.
- **Seguridad:**
  - bcrypt para las contraseñas y JWT con vencimiento;
  - los permisos se validan en **cada** endpoint con la fila de `usuarios_negocios`, y el panel de plataforma con `administradores_plataforma`;
  - las consultas siempre son parametrizadas;
  - los tokens de invitación se guardan sólo como SHA-256 (como ya prevé `token_hash`);
  - límite de intentos de login.

### 10.2 Cambios en el frontend

| Cambio | Prioridad |
|---|---|
| `http.js`: token JWT y encabezado `X-Business-Id` (ya están previstos), manejo de 401 y 403 | Imprescindible |
| Estados de negocio del SQL: avisos para `pendiente` (en revisión), `rechazado` (con motivo), `suspendido` y `bloqueado`; los clientes no pueden sumarse ni operar en un negocio que no está activo | Imprescindible |
| "Registrar mi negocio" con **invitación** (`/registro-negocio?invitacion=…`), que crea el negocio en `pendiente` y la solicitud | Imprescindible |
| **Panel de plataforma** (nuevo, mínimo): invitaciones (crear, copiar enlace, revocar), solicitudes (aprobar o rechazar con motivo), negocios (suspender, bloquear, reactivar) y auditoría | Imprescindible |
| Paleta: guardar y leer con las columnas de color (5.3), sin cambiar la pantalla | Imprescindible |
| Regla de puntos: "$X = 1 punto" (5.5) | Imprescindible |
| Ofertas: selector de nivel según la decisión C | Imprescindible |
| Logo e imágenes: subida de archivo en lugar de *data URL* | Imprescindible |
| **Indicador "Modo demostración · datos de prueba"** visible siempre que se usen mocks, para no presentarlos como reales | Imprescindible |
| Mocks: actualizarlos para que imiten el modelo SQL (estados, plataforma, invitaciones, un rol por negocio) y que el modo demo se comporte igual que el real | Imprescindible |
| Límite de 255 caracteres en el mensaje de las campañas | Imprescindible |
| Ocultar o conservar categoría, ciudad, redes y destacadas, según la decisión E | Según la decisión |
| "Actividad del equipo" (auditoría del negocio) | Puede esperar |

### 10.3 Qué hace falta del backend para que funcione de verdad

Todo lo que hoy resuelve `src/mocks/server.js`:
- login, registro y contexto;
- unirse a un negocio por QR;
- la Caja: cotizar, registrar la compra, buscar al cliente por código y validar canjes;
- canjear;
- la ABM de recompensas, ofertas, desafíos, niveles, regla de puntos, identidad y equipo;
- dashboard y métricas, ranking y **cierre mensual**;
- campañas y notificaciones.

También hay **tareas programadas**, que hoy corren al abrir la app:
- cierre mensual (día 1, 00:05);
- vencimiento de canjes (diario);
- aviso de racha en riesgo (miércoles).

En el backend correrían con `node-cron` dentro del mismo proceso, que es lo más simple para un proyecto integrador.

### 10.4 Orden sugerido para la Etapa 3

1. Migraciones aprobadas + datos de demostración + backend base (conexión, auth, contexto y permisos, errores).
2. Endpoints del cliente y de la Caja (lo que más se usa): unirse, mis puntos, movimientos, recompensas, canjear, registrar compra, validar canje.
3. Panel del negocio: configuración, recompensas, ofertas, desafíos, clientes, métricas, campañas, ranking y cierre.
4. Plataforma: invitaciones, solicitudes, estados de negocio y auditoría.
5. Frontend: ajustes de la tabla 10.2 y mocks alineados.
6. Pruebas:
   - las 55 actuales;
   - pruebas nuevas del backend contra una base MySQL de prueba;
   - recorrido completo en el navegador en modo demo y en modo API.

---

## 11. Decisiones que necesito antes de implementar

| | Decisión | Opciones | Mi recomendación |
|---|---|---|---|
| **A** | **Alta de negocios y estado `borrador`** | (1) Con invitación: el negocio nace `pendiente`, el dueño lo configura mientras tanto y el administrador de la plataforma lo aprueba (`activo`). El botón "Activar programa" pasa a ser "Enviar a revisión", y los clientes pueden sumarse recién cuando está activo. (2) Mantener el borrador agregando `'borrador'` al CHECK de `negocios.estado`. | **(1)**: respeta el SQL y le da sentido a las tablas nuevas |
| **B** | **¿Una persona puede ser cliente y empleado del mismo negocio?** (el SQL lo impide con `uq_un_usuario_negocio`) | (1) No: un rol por negocio, como en el SQL. Al agregar un empleado que ya es cliente de ese negocio se muestra un aviso. Sigue pudiendo ser cliente de **otros** negocios. (2) Sí: cambiar la clave única a `(usuario, negocio, rol)`. | **(1)**: además evita que un empleado se acredite puntos a sí mismo |
| **C** | **Ofertas exclusivas por nivel** (SQL: un solo `id_nivel_requerido`) | (1) Interpretarlo como **nivel mínimo** ("Oro" = sólo Oro; "Plata" = Plata y Oro). (2) Una tabla `ofertas_niveles` para varios niveles. | **(1)**: no agrega tablas y es más fácil de entender para el cliente |
| **D** | **Premio mensual de tipo "recompensa"** (genera un canje de 0 puntos) | (1) Permitir canjes de 0 puntos (M4). (2) Quitar ese tipo de premio y dejar sólo "puntos" y "texto". | **(1)**: no se pierde una función existente |
| **E** | **Datos de presentación sin columna** (rubro, ciudad y redes del negocio; categoría y destacada de recompensas y ofertas; descripción del nivel; nombre de la paleta) | (1) Agregarlos (M8). (2) Dejar de guardarlos y ocultarlos en los formularios. | **(1)** sólo para `categoria` (define ilustraciones y filtros) y `destacada`; lo demás, (2) |
| **F** | **Migraciones M1, M2, M3, M5, M6 y M7** | Aprobar todas, o indicar cuáles no | Aprobar todas |

Con tus respuestas paso a la Etapa 3.
