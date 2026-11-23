# GO Puntos · Plan de la Etapa 3 (ajustado a la guía de la UTN)

> **Estado:** documento de planificación de la **próxima etapa** (backend Node.js + Express + MySQL2). Nada de lo que propone está implementado todavía: la aplicación actual funciona con datos simulados. Las migraciones que menciona son propuestas y **no** se aplicaron a `database/go_puntos_v2.sql`.

Este plan reúne:
- la guía *"De la maqueta al sistema web"* (MySQL · Node.js y Express · Vue 3);
- las decisiones A–F;
- las 7 correcciones del equipo.

Completa el `DIAGNOSTICO_VUE_MYSQL.md` y prevalece sobre él donde no coinciden. **Todavía no ejecuté nada**: ni migraciones, ni correcciones de datos, ni código nuevo.

---

## 1. ¿El plan cumple la guía?

Sí. La guía propone exactamente el camino 3.1 → 3.5:
- núcleo común: MySQL, Express y la API probada con curl;
- Opción B: Vue 3 + Vite con proxy;
- "empiecen con una pantalla y una entidad real";
- transacción cuando el alta toca varias tablas;
- bitácora de IA y ensayo de la defensa.

Hay que ajustar algunos puntos de mi propuesta anterior para seguirla al pie de la letra:

| Indicación de la guía | Cómo la cumplimos | Ajuste respecto del diagnóstico |
|---|---|---|
| Node.js 24 LTS (24.12 o superior), npm | `backend/package.json` con `"engines": { "node": ">=24.12" }` | Antes no fijaba versión. Aviso: yo pruebo aquí con Node 22, que es compatible con todo lo que se usa |
| Carpeta `backend/`, `npm pkg set type=commonjs`, `express@5`, `mysql2@3` | Igual: CommonJS, Express 5 y mysql2/promise | Antes proponía ESM; paso a **CommonJS** como la guía |
| `npm start` = `node --env-file=.env server.js` | Igual, sin `dotenv` | Una dependencia menos |
| `.env` con DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME y PORT, y `.env.example` ficticio | Igual, más `JWT_SECRET` y `TZ_DB` | Ningún valor real en el repositorio ni en el chat |
| `.gitignore` con `node_modules/` y `.env` | `backend/.gitignore` + el `.gitignore` raíz (ya excluye `.env`, `.env.local` y `dist`) | — |
| `db.js` con `createPool` (connectionLimit 5) | Igual, más la zona horaria (ver 4.5) y un ayudante de transacciones | — |
| `server.js`: `express.json({limit:'16kb'})`, 404 JSON para `/api`, manejador de errores (400 JSON inválido, 413, 500), `SELECT 1` antes de escuchar, `app.listen(puerto, '127.0.0.1')` | Igual, con los mismos mensajes en español | Los logos e imágenes no viajan en JSON: van por una subida aparte (3.4), así que el límite de 16 kB se mantiene |
| Cuenta de MySQL propia de la app con permisos mínimos (`GRANT SELECT, INSERT ON …`) | Usuario `gopuntos_app` con `SELECT, INSERT, UPDATE` sólo en las tablas que usan las rutas. Sin `DELETE`, `ALTER` ni `DROP` | Las migraciones las ejecuta la cuenta administradora desde Workbench, nunca la app |
| "Para una base existente, usen una **copia** con datos de prueba" | Base **`go_puntos_v2_dev`**, importada desde tu dump. Migraciones, correcciones y compras de prueba van **sólo ahí** | Cumple también la decisión F |
| SQL siempre parametrizado (`?` + `execute`) | Obligatorio en todo `backend/` | — |
| Probar la API con curl o Bruno antes del frontend: 200, 201, 400 y 404 | Cada etapa trae su lista de pruebas curl (válida, inválida y ruta inexistente) y la consulta para Workbench | — |
| Opción B: `server.proxy: { '/api': 'http://127.0.0.1:3000' }` en el `vite.config.js` existente, conservando los plugins | Se agrega al `vite.config.js` actual (que ya tiene `whitespace: 'preserve'`) y `VITE_API_URL=/api` | Antes proponía puerto 5000 y CORS; con el proxy de la guía no hace falta CORS |
| Mantener estados de carga, error y lista vacía | Ya existen en Vue (`PageLoading`, `PageError`, `EmptyState`) | — |
| Servir la compilación de Vue desde Express para la defensa | `express.static(path.join(__dirname, '..', 'dist'))` | Nuestra app Vue está en la raíz, no en `frontend-vue/`, así que la ruta es `'..', 'dist'`. **No muevo carpetas** |
| Validar permisos en cada operación si hay usuarios | Middleware de sesión (JWT) + rol en `usuarios_negocios` en **cada** ruta | Ver la pregunta P2 (cuándo entra el login) |
| Bitácora breve por cambio importante: pedido a la IA, archivos, prueba y corrección del equipo | `docs/BITACORA_IA.md`, una entrada por etapa | Nuevo |
| README para que otra persona arranque el proyecto, `.env.example` y `package-lock.json` en Git | README con instalación paso a paso, tabla de errores frecuentes (la de la guía, página 14) y **`package-lock.json` de frontend y backend** | El ZIP actual **no trae `package-lock.json`**; lo genero en 3.1 |
| Ensayo de la demostración (GET con JSON, 201 en Network, el mismo id en Workbench, 400 desde el cliente HTTP) | Guion de la demo con datos reales en 3.5 | — |

**Limitación de mi entorno.** Aquí no puedo instalar MySQL: no tengo acceso a los paquetes del sistema. Puedo escribir el backend y probarlo con pruebas que reemplazan la base. **La conexión real con MySQL y la comprobación en Workbench las vas a hacer vos en tu computadora**, que es lo que la guía pide: yo te doy los comandos y vos me pasás el resultado, sin contraseñas.

---

## 2. Decisiones registradas

### A · Alta de negocios con invitación, solicitud y aprobación

Problema: `solicitudes_negocio` permite **una sola solicitud por negocio** (`uq_solicitud_negocio`) y **una por invitación**. Además, el negocio necesita recordar de qué invitación vino. Por eso la solicitud se crea en el registro, y "Enviar a revisión" sólo tiene sentido si queda registrado **cuándo** se envió. Propongo una columna mínima (**M10**):

```sql
ALTER TABLE solicitudes_negocio ADD COLUMN fecha_envio DATETIME NULL;  -- NULL = el dueño todavía la está preparando
```

**Flujo** (todos los estados son los del SQL; no se agrega `borrador`):

| Paso | Quién | `negocios.estado` | `solicitudes_negocio` | Qué ve el dueño |
|---|---|---|---|---|
| 1. Crear invitación (token SHA-256, vence) | Admin de plataforma | — | — | — (`auditoria_plataforma: crear_invitacion`) |
| 2. Registrarse con el enlace (en **una transacción**: usuario, negocio, rol Administrador, configuración y niveles por defecto, solicitud, invitación `utilizada`) | Dueño | `pendiente` | `pendiente`, `fecha_envio` NULL | **"En preparación"**: el asistente de configuración, como hoy |
| 3. "Enviar a revisión" (sólo con la configuración mínima completa: niveles, regla de puntos y al menos una recompensa) | Dueño | `pendiente` | `fecha_envio = ahora` | **"En revisión"**: puede seguir editando, pero no registrar compras |
| 4a. Aprobar | Admin de plataforma | `activo` | `aprobada`, revisor, fecha y motivo opcional | Programa activo: los clientes ya pueden sumarse |
| 4b. Rechazar (motivo obligatorio) | Admin de plataforma | `rechazado` | `rechazada` + `motivo_revision` | **"Rechazado"** con el motivo + "Corregir y reenviar" |
| 5. Reenviar después de un rechazo | Dueño | `pendiente` | vuelve a `pendiente`, `fecha_envio = ahora` (la misma fila) | "En revisión". El rechazo anterior queda en `auditoria_plataforma` |
| Suspender o reactivar | Admin de plataforma | `suspendido` ↔ `activo` | — | Panel en sólo lectura; los clientes ven "programa pausado". **Los saldos no se tocan** |
| Bloquear | Admin de plataforma | `bloqueado` | — | Sin acceso al panel; el negocio desaparece para los clientes. **Los saldos se conservan** |

- Cada acción del administrador queda en `auditoria_plataforma` (las 7 acciones que permite el CHECK). Las del dueño (enviar, reenviar) quedan en `auditoria`.
- Los negocios que ya existen sin solicitud (como Ferretería Alvear) se tratan como **aprobados históricos**.
- En Vue, el botón actual **"Activar programa"** pasa a ser **"Enviar a revisión"**, y la lista "Terminá de configurar" sigue igual.

### B · Un rol por usuario y negocio

Se mantiene el SQL (`uq_un_usuario_negocio`). **Limitación documentada:**
- una persona no puede ser cliente y empleado o administrador **del mismo** negocio;
- sí puede tener roles distintos en negocios distintos.

En Vue:
- "Agregar empleado" rechaza a quien ya es cliente de ese negocio, con un mensaje claro;
- "Unirme" (el QR del negocio) rechaza a quien ya es parte del equipo.

El servidor simulado va a aplicar la misma regla, y la limitación se documenta en `MODELO_DATOS.md`.

### C · Ofertas exclusivas con nivel mínimo

`id_nivel_requerido` = nivel mínimo: aplica a ese nivel y a los de `orden` mayor.
- En el editor, la selección múltiple pasa a ser "Nivel mínimo".
- `domain/offers.js → isEligible` compara por `orden`.
- Las ofertas del simulador que hoy tienen `levelIds: [3]` quedan igual.

### D · Premio mensual de tipo recompensa con canje de 0 puntos

Reemplaza la M4 anterior: el canje de premio queda **marcado y vinculado** con el premio, y la base garantiza que no haya canjes de 0 puntos sueltos.

```sql
-- M4 · Premios de ranking de tipo recompensa
ALTER TABLE premios_ranking
  ADD COLUMN id_recompensa INT NULL,
  ADD CONSTRAINT fk_premio_recompensa FOREIGN KEY (id_recompensa) REFERENCES recompensas (id_recompensa);

ALTER TABLE canjes
  ADD COLUMN id_premio_ranking INT NULL,
  ADD UNIQUE KEY uq_canje_premio (id_premio_ranking),              -- un premio genera como mucho un canje
  ADD CONSTRAINT fk_canje_premio FOREIGN KEY (id_premio_ranking) REFERENCES premios_ranking (id_premio_ranking);
ALTER TABLE canjes DROP CHECK ck_canje_puntos;
ALTER TABLE canjes ADD CONSTRAINT ck_canje_puntos CHECK (
  (id_premio_ranking IS NULL     AND puntos_utilizados > 0)   -- canje normal
  OR (id_premio_ranking IS NOT NULL AND puntos_utilizados = 0)   -- canje de premio
);
```

**Validación del backend** (además de la base): un canje de premio sólo se crea **dentro de la transacción del cierre mensual**. Antes de crearlo, el backend verifica que:
1. el premio sea de ese período, de tipo `recompensa`, y que la recompensa sea **del mismo negocio**;
2. el `id_usuario_negocio` tenga la `posicion_ranking` del premio en `resultados_mensuales` de ese período;
3. el ranking estuviera activo.

Ningún endpoint público acepta `puntos_utilizados = 0`. En la Caja y en el historial se ve como **"Premio del ranking"**, distinto de un canje.

### E · Datos de presentación (M8 revisada campo por campo)

Revisé en el código qué se usa realmente. Agrego sólo lo que Vue muestra o edita hoy:

| Tabla.columna | Uso en Vue | ¿Entra? |
|---|---|---|
| `negocios.categoria VARCHAR(40)` | Rubro: landing, unirse, ilustración por defecto (16 archivos) | ✅ |
| `negocios.ciudad VARCHAR(80)` | Ficha del negocio, unirse, landing (3 archivos) | ✅ |
| `negocios.redes_sociales JSON` | Instagram, Facebook, WhatsApp, web en el perfil del negocio | ✅ JSON de MySQL 8 (no se consulta por dentro) |
| `negocios.icono_logo VARCHAR(40)` | Ícono que se muestra cuando no hay logo | ✅ |
| `negocios.paleta_id VARCHAR(30)` + `paleta_variante VARCHAR(30)` + `nombre_paleta VARCHAR(40)` | **Identidad y nombre de la paleta** (corrección 3). Los colores siguen en `color_primario/secundario/acento` | ✅ |
| `niveles.descripcion VARCHAR(255)` | Texto del nivel en "Camino de niveles" | ✅ |
| `recompensas.categoria VARCHAR(40)` + `destacada TINYINT(1)` | Ilustración, filtros y "Destacadas" | ✅ |
| `ofertas.categoria VARCHAR(40)` + `destacada TINYINT(1)` | Ilustración y oferta de la semana | ✅ |
| `ofertas.horario VARCHAR(120)` + `condiciones VARCHAR(255)` | "Todos los miércoles", "Llevando 2 paquetes" | ✅ |
| `fecha_creacion` en recompensas y ofertas | **No se muestra en ninguna pantalla** | ❌ no hace falta |
| Lista de beneficios del nivel | Entra en `niveles.beneficio` (separados por salto de línea) | ❌ no hace falta columna |

### F · Migraciones aprobadas (sólo en `go_puntos_v2_dev`)

| Migración | Contenido |
|---|---|
| M1 | `usuarios.modo_apariencia` |
| M2 | ofertas: tipo, valor, aplicación automática, mínimo |
| M3 | `configuracion_programa` |
| **M4 (revisada)** | premio vinculado (sección D) |
| M5 | `recompensas.imagen_url` |
| M6 | `movimientos_puntos.id_canje` |
| M7 | CHECK de estados |
| **M8 (revisada)** | datos de presentación (sección E) |
| **M9 (nueva)** | ver 4.2 |
| **M10 (nueva)** | ver sección A |

Cada una va en su archivo `database/migrations/NNN_nombre.sql` con su reversión. Se aplican en Workbench con la cuenta administradora **sobre la copia**. La base principal no se toca hasta que lo indiques.

---

## 3. Correcciones de datos propuestas (no aplicadas)

Atendiendo la corrección 4, **ninguna se aplica sin tu aprobación**. Irían en `database/correcciones/001_datos_demo.sql`, ejecutado sólo sobre `go_puntos_v2_dev`.

| # | Qué corrige | Cambio | ¿Por qué? |
|---|---|---|---|
| C1 | **Movimiento de origen de Juan** (corrección 1) | Agrega un movimiento `+1000`, tipo `ajuste`, descripción "Saldo inicial anterior al registro de movimientos", `saldo_resultante = 1000`, fechado un segundo antes del primer movimiento. **El saldo 850 no cambia** | La cadena queda 1000 → 1050 → 750 → 850 y el libro cuadra. Es un `ajuste`: suma al saldo pero **no** a los puntos del período (los 150 del mes siguen siendo sólo de compras) |
| C2 | Vigencia de la regla de puntos | `configuracion_puntos.fecha_desde`: 2026-11-23 → **2026-11-22** (día de alta del negocio y de la primera compra) | Con la fecha actual, la compra 1 (22/11 22:21) no tiene ninguna regla vigente |
| C3 | **Ferretería Alvear sin Administrador** | Nuevo usuario de demostración `admin.alvear@gopuntos.example` con rol Administrador en el negocio 1 | Sin esto nadie puede entrar al panel. María sigue como Empleada (sirve de ejemplo de empleado) |
| C4 | Contraseñas en texto plano | Reemplaza `'12345'` (usuarios 2 y 15, y el nuevo C3) por **hashes bcrypt**, generados por un script que lee la contraseña de demostración de tu `.env` local. Ninguna contraseña queda escrita en el repositorio | El login real compara hashes. Los usuarios 16 y 17 (`CUENTA_PRUEBA_SIN_LOGIN`) quedan igual, a propósito |
| C5 | Estado de recompensa | `'inactiva'` → `'pausada'` (recompensa 5) | Lo necesita el CHECK de M7 |
| C6 | Canje sin vínculo | `movimientos_puntos.id_canje = 1` en el movimiento 2 | Después de M6 |
| C7 | Colores de niveles en hex | `#CD7F32` → `bronce`, `#A8A9AD` → `plata`, `#D4AF37` → `oro` | Para que los niveles respeten la paleta y el modo oscuro. Si preferís no tocarlos, el backend convierte al leer |
| C8 | Configuración del programa y segmentos | Fila por defecto en `configuracion_programa` y los 5 segmentos estándar del negocio 1 | Después de M3 |

---

## 4. Respuestas a las correcciones del equipo

**4.1 · El saldo de Juan.** Correcto: el diagnóstico ya no habla de "−150" como valor válido. Se corrige con C1, que agrega el movimiento de origen y **conserva el 850**. El backend controla siempre que `saldos_puntos.saldo_actual` coincida con el `saldo_resultante` del último movimiento.

**4.2 · Equivalencia configurable.** Retiro la propuesta de limitar a "$X = 1 punto". `pesos_por_punto` ya permite cualquier equivalencia de 1 punto (por ejemplo, $150 o $87,50). Para conservar **exactamente** lo que permite Vue ("$X = N puntos", como $100 = 3 puntos) sin redondeos intermedios propongo **M9**:

```sql
ALTER TABLE configuracion_puntos
  ADD COLUMN puntos_por_tramo INT NOT NULL DEFAULT 1,
  ADD CONSTRAINT ck_cfg_puntos_tramo CHECK (puntos_por_tramo > 0);
-- Regla: cada `pesos_por_punto` pesos se otorgan `puntos_por_tramo` puntos.
-- Con el valor por defecto (1) todo sigue igual que hoy.
```

Contra: el nombre `pesos_por_punto` queda un poco impreciso cuando el tramo es mayor a 1 (lo aclaro en la documentación). La alternativa sin migración es guardar `pesos / puntos` con 2 decimales, aceptando diferencias de ±1 punto en algunos importes.

**4.3 · Identidad y nombre de las paletas personalizadas.** Se guardan explícitamente:
- `paleta_id` + `paleta_variante` (por ejemplo `bosque`/`miel`, o `personalizada`/`propia`);
- `nombre_paleta`;
- los colores en `color_primario/secundario/acento`.

Ya no se deduce la paleta por los colores. El backend vuelve a validar el contraste con `paletteBuilder.js` antes de guardar.

**4.4 · Datos de prueba.** Ver la sección 3: todo explicado, nada aplicado y sólo sobre la copia.

**4.5 · Vigencia de la regla de puntos y zona horaria.**
- **Regla aplicable a una compra:** la fila de `configuracion_puntos` del negocio con `estado = 'activo'` y `fecha_desde <= DATE(fecha_compra)`, la de `fecha_desde` más reciente y, si empatan, la de `id` mayor.
  - Un cambio de regla inserta una fila nueva; no edita la anterior, que queda como historial.
  - Si se carga una regla con fecha futura, rige desde ese día.
  - Los puntos de cada compra quedan guardados en `compras.puntos_generados`: **nunca se recalculan** si cambia la regla.
- **Zona horaria:**
  - Todas las fechas se guardan en **hora de Argentina (−03:00, sin horario de verano)**, que es como ya están los datos del dump: los `DATETIME` cargados con `CURRENT_TIMESTAMP` en tu computadora.
  - En `db.js`, la opción `timezone: '-03:00'` de mysql2 y `SET time_zone = '-03:00'` en cada conexión del pool. Así `CURRENT_TIMESTAMP` y las fechas que manda Node coinciden.
  - El período de una compra es el `periodos_mensuales` donde `DATE(fecha_compra)` cae entre `fecha_inicio` y `fecha_fin`.
  - El cierre corre a las 00:05 hora de Argentina.
  - **En 3.1 lo comprobamos** con `SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();`.

**4.6 · Desempate del ranking.** Hoy Vue desempata con `lastPurchaseAt` (la última compra de **cualquier** período, aunque no haya sumado puntos). Eso **no** es consistente: una compra por debajo del mínimo (0 puntos) le haría perder el puesto a alguien. La regla calculable con los datos guardados queda así:
1. más `puntos_ganados` en el período (`resultados_mensuales`);
2. si empatan, **quien alcanzó ese total antes**: el menor `MAX(fecha_compra)` entre sus compras `confirmada` del período con `puntos_generados > 0`;
3. si coinciden en el mismo segundo (`DATETIME` no guarda fracciones), el menor `MAX(id_compra)` de esas compras (autoincremental: siempre consistente);
4. por último, el menor `id_usuario_negocio`.

En el cierre la posición queda fija en `resultados_mensuales.posicion_ranking` y el historial ya no se recalcula. Ajusto `domain/ranking.js` para que use la misma regla (con una prueba nueva), de modo que el modo demo y el real ordenen igual.

**4.7 · Sin contraseñas ni `.env` en GitHub.**
- `.env` excluido en la raíz y en `backend/`, con `.env.example` de valores ficticios;
- la contraseña de demostración sólo vive en tu `.env` local;
- los secretos de JWT se generan localmente;
- **nunca te voy a pedir que me pegues una contraseña**: para diagnosticar alcanza con el código de error.

---

## 5. Etapas

| Etapa | Qué incluye | Cómo se comprueba | Toca la base |
|---|---|---|---|
| **3.1 Backend y conexión** | `backend/` según la guía (package.json CommonJS, `db.js`, `server.js`, `.env.example`, `.gitignore`); `GET /api/salud` (base conectada, versión de MySQL, zona horaria, cantidad de tablas = 28); script de creación de `go_puntos_v2_dev` y del usuario `gopuntos_app` con permisos mínimos; `package-lock.json` de los dos proyectos; README de arranque; primera entrada de la bitácora | `npm start` muestra `API en http://127.0.0.1:3000`; `curl -i /api/salud` → 200 con 28 tablas; `/api/nada` → 404; las 55 pruebas del frontend siguen pasando | Sólo lectura |
| **3.2 GET de clientes en Vue** | Ruta con el **mismo contrato** que ya usa `customerService.list` (nivel vigente, saldo, puntos del mes, compras, última actividad, posición, segmentos), proxy de Vite, `VITE_USE_MOCKS=false`, aviso visible **"Conectado a MySQL"** frente a **"Modo demostración · datos de prueba"**; las rutas todavía no implementadas responden **501** y Vue muestra su pantalla de error (no mezcla datos simulados con reales) | curl 200 con los clientes de Ferretería Alvear; la pantalla Clientes de Vue con Juan (850 pts) y los demás; la comparación con un `SELECT` en Workbench | Lectura (+ C1–C4 si incluye login) |
| **3.3 Compra con transacción** | `POST /api/staff/purchases` (y `/quote`): **una transacción** que inserta en `compras` y `movimientos_puntos`, actualiza `saldos_puntos`, crea o actualiza `resultados_mensuales` y crea el período si falta; `ROLLBACK` ante cualquier error. Reutiliza `domain/points.js` (el mismo cálculo que la Caja); la Caja de Vue registra la compra real | 201 en Network; `SELECT` en Workbench con el `id_compra` nuevo; compra inválida (importe 0) → 400 sin filas nuevas; saldo y puntos del mes correctos; canje no resta puntos del mes | Escritura en la **copia** |
| **3.4 Migraciones y módulos** | M1–M10 aprobadas + C5–C8; login, contexto y permisos completos; canjes, recompensas, ofertas, niveles, regla de puntos, identidad y paletas, preferencias, desafíos, rachas, ranking y cierre mensual (con premio de 0 puntos validado), campañas, notificaciones, equipo, invitaciones, solicitudes y panel de plataforma, auditoría; mocks alineados con el modelo SQL | Pruebas del backend por módulo + curl de cada ruta nueva | Copia |
| **3.5 Pruebas, documentación y demo** | 55 pruebas + las nuevas del dominio y del backend; recorrido completo en modo demo y en modo MySQL; `MODELO_DATOS.md` reescrito desde el SQL; API.md; README; bitácora; guion de la defensa (los 5 pasos de la guía); `npm run build` servido desde Express | Otra persona del equipo arranca el proyecto sólo con el README | — |

---

## 6. Preguntas antes de empezar

| | Pregunta | Mi recomendación |
|---|---|---|
| **P1** | ¿Apruebo las correcciones C1–C8 (sección 3)? En particular: C1 como `ajuste` y C3 con un usuario administrador nuevo (en vez de convertir a María en Administradora) | Sí a todas |
| **P2** | ¿El GET de clientes de 3.2 ya pide **login real** (Administrador de Ferretería, con C3 y C4 aplicadas antes), o lo hacemos sin login, temporalmente, y el login entra en 3.4? | **Login real en 3.2.** La guía pide validar permisos en cada operación, y la compra de 3.3 necesita saber quién la registra (`id_operador_negocio`) |
| **P3** | ¿Apruebo **M9** (puntos por tramo) y **M10** (`fecha_envio`)? | Sí a las dos |
| **P4** | ¿Nombre de la base de copia: `go_puntos_v2_dev`? | Sí |
