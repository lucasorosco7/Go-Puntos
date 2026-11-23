# GO Puntos

**Plataforma web de fidelización para comercios.** Trabajo Final Integrador · Tecnicatura Universitaria en Programación · UTN.

GO Puntos permite que cada comercio cree **su propio programa de puntos**: define cuántos puntos da cada compra, sus niveles (Bronce, Plata, Oro o los que quiera), recompensas, ofertas, desafíos, rachas, un ranking mensual con premio, campañas y notificaciones, con su identidad visual. Los clientes usan **una sola cuenta** para sumar puntos en todos los comercios adheridos, y los datos de cada comercio se mantienen siempre separados.

> **Estado actual:** esta es la **maqueta funcional en Vue 3**. Funciona completa con **datos simulados guardados en el navegador**. La base de datos MySQL ya está diseñada (`database/`), pero **todavía no está conectada**. **No hace falta instalar MySQL** para ejecutar y evaluar la aplicación. Ver [Estado del proyecto](#9-estado-actual-del-proyecto).

---

## Índice

1. [Tecnologías](#1-tecnologías)
2. [Funcionalidades principales](#2-funcionalidades-principales)
3. [Los cuatro roles](#3-los-cuatro-roles)
4. [Requisitos](#4-requisitos)
5. [Instalación y ejecución](#5-instalación-y-ejecución)
6. [Cuentas de demostración](#6-cuentas-de-demostración)
7. [Recorrido de demostración](#7-recorrido-de-demostración-paso-a-paso)
8. [Otras pruebas rápidas](#8-otras-pruebas-rápidas)
9. [Estado actual del proyecto](#9-estado-actual-del-proyecto)
10. [Estructura de carpetas](#10-estructura-de-carpetas)
11. [Pruebas automáticas](#11-pruebas-automáticas)
12. [Solución de problemas](#12-solución-de-problemas)
13. [Documentación adicional](#13-documentación-adicional)

---

## 1. Tecnologías

| Tecnología | Uso |
|---|---|
| **Vue 3** (Composition API, `<script setup>`) | Interfaz por componentes |
| **Vite 6** | Servidor de desarrollo y compilación |
| **Vue Router 4** | Navegación entre pantallas y rutas protegidas por rol |
| **Pinia 3** | Estado compartido (sesión, negocio activo, notificaciones, plataforma) |
| **JavaScript** (ES modules) | Todo el código, comentado en español |
| **Lucide** (`lucide-vue-next`) | Íconos |
| **CSS propio con variables** | Paletas por negocio, modo claro/oscuro, diseño adaptable (prioridad celular) |
| **node:test** | Pruebas automáticas, sin dependencias extra |
| **MySQL 8** (diseño) | Esquema `go_puntos_v2` con 28 tablas, todavía no conectado |

## 2. Funcionalidades principales

**Para los clientes (app pensada para el celular):**
- Saldo disponible para canjear y **puntos del mes**, que son dos cosas distintas: canjear no baja el nivel ni el ranking.
- Niveles con beneficios, recompensas, canjes con código, ofertas, desafíos, rachas, ranking mensual y notificaciones.
- QR personal para que el comercio lo identifique.
- Una sola cuenta para varios comercios.

**Para los comercios (panel del negocio):**
- Dashboard con métricas, Caja (registrar compras y validar canjes), clientes con segmentos, recompensas, ofertas, ranking y cierre mensual, desafíos, campañas y empleados.
- Configuración completa del programa e identidad visual, con paletas prediseñadas o una paleta propia validada para que sea legible.

**Para GO Puntos (panel de la plataforma):**
- El **Superadmin** invita comercios, revisa y aprueba o rechaza sus solicitudes de alta, suspende, bloquea o reactiva negocios y consulta la auditoría de todas esas acciones.

**Para todos:**
- Modo **claro, oscuro o automático**, elegido por cada persona.
- Diseño adaptable a computadoras y celulares.

## 3. Los cuatro roles

| Rol | Qué hace | Dónde trabaja |
|---|---|---|
| **Superadmin** (administrador de la plataforma) | Administra GO Puntos: crea invitaciones, aprueba o rechaza negocios, suspende, bloquea o reactiva, y consulta la auditoría. **No** es administrador de los negocios ni entra a sus paneles. | `/plataforma` |
| **Administrador** (dueño del negocio) | Configura su programa, ve métricas y clientes, crea recompensas y ofertas, cierra el mes y gestiona su equipo. También puede hacer todo lo del empleado. | `/panel` |
| **Empleado** (opcional) | Sólo la Caja de su negocio: identificar al cliente, registrar compras, acreditar puntos y validar canjes. | `/panel/caja` |
| **Cliente** | Suma puntos en los comercios donde participa, canjea recompensas y consulta ofertas, nivel, ranking y desafíos. | `/app` |

Una misma cuenta puede tener **roles distintos en negocios distintos** (por ejemplo, ser empleado de un comercio y cliente de otro). Dentro de **un mismo** negocio cada cuenta tiene **un solo rol**, como define la base de datos (`usuarios_negocios`).

---

## 4. Requisitos

- **Node.js 20 o superior** (recomendado: **22 LTS**). Incluye npm.
- **npm 10 o superior.**
- Un navegador actualizado (Chrome, Edge o Firefox).
- **No** se necesita MySQL, ni Express, ni ninguna otra instalación.

Para ver qué versiones tenés, abrí una terminal (en Windows: *PowerShell* o *Símbolo del sistema*) y escribí:

```bash
node -v
npm -v
```

Tienen que mostrar algo como `v22.x.x` y `10.x.x`. Si dicen que el comando no existe, instalá Node.js desde <https://nodejs.org> (versión **LTS**) y volvé a abrir la terminal.

## 5. Instalación y ejecución

**1. Descargá el proyecto** (cualquiera de las dos formas):

- **ZIP:** en la página del repositorio en GitHub, elegí la rama **`vue`**, tocá el botón verde **Code → Download ZIP** y descomprimilo.
- **Git:**
  ```bash
  git clone -b vue <URL-del-repositorio>
  ```

**2. Abrí una terminal dentro de la carpeta del proyecto**: la que contiene `package.json`. En Visual Studio Code: *File → Open Folder* y después *Terminal → New Terminal*.

**3. Instalá las dependencias** (sólo la primera vez; tarda uno o dos minutos y necesita internet):

```bash
npm install
```

**4. Iniciá la aplicación:**

```bash
npm run dev
```

**5. Abrí la dirección que muestra la terminal.** Vite muestra algo así:

```
  VITE v6.x.x  ready in 500 ms
  ➜  Local:   http://localhost:5173/
```

Abrí esa dirección en el navegador (con Ctrl + clic sobre ella, o copiándola). Para detener la aplicación, volvé a la terminal y presioná **Ctrl + C**.

> Para verla como en un celular: en el navegador, **F12** y luego el ícono de dispositivo móvil (**Ctrl + Shift + M**).

**Otros comandos:**

| Comando | Qué hace |
|---|---|
| `npm test` | Corre las pruebas automáticas (ver [sección 11](#11-pruebas-automáticas)) |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión compilada para probarla |

---

## 6. Cuentas de demostración

Todas las cuentas y datos son **ficticios** y existen sólo en el modo de demostración. En la pantalla **Ingresar** hay un botón para cada cuenta que completa el email y la contraseña.

| Rol | Email | Contraseña | Pantalla a la que accede |
|---|---|---|---|
| **Superadmin** | `superadmin@gopuntos.demo` | `super1234` | Panel de la plataforma (`/plataforma`) |
| **Administrador** | `admin@cvdietetica.com` | `admin1234` | Panel de **CV Dietética** (`/panel`) |
| **Empleado** | `caja@cvdietetica.com` | `caja1234` | Caja de CV Dietética (`/panel/caja`) |
| **Cliente** | `martina@demo.com` | `demo1234` | App del cliente (`/app/puntos`), con puntos en **CV Dietética** y **Café Aroma** |

Cuentas adicionales para ver otros casos:

| Caso | Email | Contraseña | Qué muestra |
|---|---|---|---|
| Otro negocio | `admin@cafearoma.com` | `admin1234` | Café Aroma: otra paleta, otros niveles, premio con recompensa |
| Negocio en preparación | `nuevo@demo.com` | `demo1234` | Sofía registró *Almacén Doña Rosa* y lo está configurando para enviarlo a revisión |
| Solicitud en revisión | `panaderia@demo.com` | `demo1234` | *Panadería La Espiga* espera la aprobación del Superadmin |
| Solicitud rechazada | `kiosco@demo.com` | `demo1234` | *Kiosco Avenida* ve el motivo del rechazo y puede corregir y reenviar |
| Negocio suspendido | `libreria@demo.com` | `demo1234` | *Librería del Sur* ve el motivo de la suspensión y no puede operar |

---

## 7. Recorrido de demostración (paso a paso)

Este recorrido prueba el circuito completo, desde que GO Puntos invita a un comercio hasta que un cliente canjea una recompensa. Lleva unos 10 minutos.

> Para empezar con los datos originales: en **Ingresar**, tocá **"Restablecer datos de prueba"** (abajo, en el recuadro *Cuentas de prueba*).

**1. Iniciar sesión como Superadmin**
En `http://localhost:5173/ingresar`, tocá el botón **Superadmin** y después **Ingresar**. Se abre el **Dashboard de la plataforma**: negocios por estado, solicitudes para revisar, invitaciones, usuarios y la actividad reciente.

**2. Crear una invitación**
Menú lateral → **Invitaciones** → **Nueva invitación**.
- El email es opcional. Si lo completás, el registro sólo acepta ese email; para la prueba dejalo vacío.
- Elegí la vigencia y tocá **Generar enlace**.
- Tocá **Copiar**. El enlace se muestra **una sola vez**, porque se guarda sólo una huella (hash) del enlace.

**3. Abrir el enlace de invitación**
Tocá **Listo** y **cerrá la sesión** (menú lateral → *Cerrar sesión*). Pegá el enlace copiado en la barra del navegador. La pantalla muestra **"Invitación válida"** y hasta cuándo se puede usar.

**4. Registrar un negocio**
Completá:
- **Nombre del negocio**: por ejemplo *Heladería Polo*;
- **Rubro**;
- **tus datos**: por ejemplo `heladeria@demo.com`, contraseña `demo1234`.

Tocá **Crear mi programa**. Entrás al **asistente de configuración inicial**. El negocio queda **pendiente**: todavía no puede operar con clientes.

**5. Configurar el programa y enviar la solicitud**
Recorré los pasos con **Guardar y seguir**. Los valores por defecto sirven: $100 = 1 punto, niveles Bronce, Plata y Oro.
- En el paso **Recompensas** creá al menos una, por ejemplo *Cucurucho de regalo* por **150** puntos. Es obligatoria para enviar a revisión.
- En el último paso (**Resumen y envío a revisión**) se ven los requisitos cumplidos. Tocá **Enviar a revisión**.

El panel muestra **"Tu solicitud está en revisión"**.

**6. Aprobarla desde el Superadmin**
Cerrá la sesión e ingresá como **Superadmin**. El menú muestra **Solicitudes** con un contador. Abrila: tu negocio aparece en **En revisión**, con sus datos y su configuración. Tocá **Aprobar** y después **Aprobar negocio**.
- El negocio pasa a **activo**.
- La acción queda registrada en **Auditoría**.

> También podés probar **Rechazar**: pide un motivo de al menos 10 caracteres, y el dueño lo ve en su panel.

**7. Sumar un cliente al negocio**
Cerrá la sesión e ingresá como **Cliente** (`martina@demo.com` / `demo1234`). Abrí la página del **QR público** del negocio: `http://localhost:5173/unirse/heladeria-polo`. Si usaste otro nombre, la dirección está en *Configuración → QR del negocio* y en la ficha del negocio del Superadmin. Tocá **Sumarme a Heladería Polo**: Martina recibe los puntos de bienvenida.

**8. Ingresar como administrador del negocio**
Cerrá la sesión e ingresá con la cuenta que creaste en el paso 4 (`heladeria@demo.com` / `demo1234`). Estás en el **Dashboard** de tu negocio, ya activo.

**9. Registrar una compra desde la Caja**
Menú → **Caja**.
1. En **Buscar**, escribí *Martina* y elegila. Otra opción es **Escanear QR del cliente**, que simula el lector.
2. Ingresá el importe, por ejemplo **10000**. Se muestra el cálculo: $10.000 → 100 puntos.
3. Tocá **Confirmar y sumar 100 puntos**.

**10. Consultar los puntos del cliente**
Cerrá la sesión e ingresá como **Cliente**. Arriba a la izquierda está el **selector de negocio**: elegí *Heladería Polo*. Vas a ver el **saldo disponible**, en este ejemplo 200 (100 de bienvenida y 100 de la compra), los **puntos del mes**, el nivel y los movimientos.

**11. Canjear una recompensa**
Pestaña **Recompensas** → **Canjear** en *Cucurucho de regalo* → **Sí, canjear**.
- Aparece el **código de canje**, para mostrar en el local; también queda en *Recompensas → Mis canjes*.
- El saldo baja, pero los **puntos del mes no**.
- El administrador o un empleado validan el código en **Caja → Validar canje**.

**12. Consultar estadísticas y ranking**
- Como administrador del negocio: **Dashboard** (clientes, compras, facturación, puntos otorgados y canjeados, recompensas) y **Ranking** (posiciones del mes, premio y cierre mensual).
- Como Superadmin: **Dashboard de la plataforma**, **Negocios** (con búsqueda y filtros por estado) y **Auditoría**.

## 8. Otras pruebas rápidas

| Qué probar | Cómo |
|---|---|
| **Invitaciones inválidas** | Abrí `http://localhost:5173/registro-negocio?invitacion=invitacion-vencida` (vencida), `?invitacion=invitacion-revocada` (revocada) o `?invitacion=demo-sofia` (ya utilizada): no permiten registrarse. Hay una invitación vigente de prueba: `?invitacion=invitacion-demo`. |
| **Suspender y reactivar** | Superadmin → **Negocios** → *Suspender* en un negocio activo (pide motivo). Ingresá como su administrador: ve el aviso y la Caja no registra compras. Volvé y tocá *Reactivar*. |
| **Bloquear** | Superadmin → *Bloquear* CV Dietética. Su administrador y su empleado ya no pueden usar el panel; Martina ve que el comercio no está disponible y conserva sus puntos. Reactivalo al terminar. |
| **Permisos** | Como administrador, escribí `/plataforma` en la barra: te devuelve a tu panel. Como Superadmin, `/panel` te devuelve a la plataforma. El empleado sólo ve la Caja. |
| **Modo claro y oscuro** | Panel: menú lateral → **Apariencia**. App del cliente: **Perfil → Apariencia**. Cada persona elige el suyo (claro, oscuro o automático). |
| **Paletas** | Como administrador: **Personalización** → elegí una paleta prediseñada o **Crear mi paleta** (dos colores; el resto se genera y se valida para que sea legible). |

---

## 9. Estado actual del proyecto

- La maqueta está **desarrollada en Vue 3** y es **funcional**: todas las pantallas y operaciones responden de verdad, con validaciones y reglas de negocio.
- Funciona con **datos simulados**: un "servidor simulado" (`src/mocks/`) reproduce lo que hará la API. Los datos de prueba se generan con unos 5 meses de historia, usando las mismas reglas de la aplicación.
- Los datos se **guardan localmente en el navegador** (`localStorage`). Cada navegador tiene su propia copia: lo que hagas en uno no aparece en otro.
- La base **MySQL `go_puntos_v2` está diseñada** (28 tablas, en `database/`), pero **todavía no está conectada** a Vue. Las funciones nuevas del Superadmin respetan sus tablas y estados: `administradores_plataforma`, `invitaciones_registro`, `solicitudes_negocio` y `auditoria_plataforma`.
- La **siguiente etapa** es implementar el backend con **Node.js, Express y MySQL2**, siguiendo la guía de la cátedra. La planificación está en [`docs/PLAN_ETAPA3.md`](docs/PLAN_ETAPA3.md).
- **No es necesario instalar MySQL** para ejecutar la maqueta actual.
- Los servicios del frontend (`src/services/`) ya declaran, para cada operación, la llamada HTTP que usarán con el backend. Pasar a la API real no requiere cambiar las pantallas.

## 10. Estructura de carpetas

```
GO-Puntos/
├── package.json        dependencias y comandos (npm run dev, npm test…)
├── vite.config.js      configuración de Vite y del plugin de Vue
├── index.html          punto de montaje de la aplicación
├── .env.example        variables opcionales (no hace falta crear .env para la maqueta)
├── public/             archivos estáticos (ícono)
├── src/                código de la aplicación
│   ├── views/          pantallas: public · auth · client · admin · platform (Superadmin)
│   ├── layouts/        estructura de cada zona: sitio, ingreso, app del cliente, panel del negocio, panel de la plataforma
│   ├── components/     componentes reutilizables (base, marca, fidelización, panel, caja, editores, configuración, plataforma)
│   ├── router/         rutas y reglas de acceso por rol
│   ├── stores/         estado compartido con Pinia
│   ├── services/       ÚNICA puerta a los datos (hoy simulados; mañana la API)
│   ├── domain/         reglas de negocio puras (puntos, niveles, ranking, desafíos, plataforma…)
│   ├── mocks/          servidor simulado y datos de prueba (se reemplaza por el backend)
│   ├── theme/          paletas, paleta personalizada, modo oscuro y controles de contraste
│   ├── composables/    lógica reutilizable de Vue (formularios, cargas, avisos…)
│   ├── config/         configuración, catálogos y menús
│   ├── utils/          fechas, formatos, validaciones, hash
│   └── assets/styles/  estilos (tokens de color, componentes, app, panel)
├── tests/              pruebas automáticas (node --test)
├── database/           esquema MySQL go_puntos_v2 (diseño, todavía no conectado)
├── docs/               modelo de datos, arquitectura, diagnóstico y plan de la integración con MySQL
└── tools/              script para regenerar el registro de íconos
```

## 11. Pruebas automáticas

```bash
npm test
```

Ejecuta **68 pruebas** con el corredor de pruebas de Node (no requiere instalar nada más):

| Archivo | Qué verifica |
|---|---|
| `tests/reglas.test.js` | Reglas de negocio: cálculo de puntos, saldo frente a puntos del mes, niveles, ranking, desafíos, rachas, cierre mensual, roles |
| `tests/paletas.test.js` | Contraste (WCAG) de todas las paletas en claro y oscuro, y de cientos de paletas personalizadas |
| `tests/guardias.test.js` | Acceso a las rutas según el rol y el contexto |
| `tests/servicios.test.js` | Services en modo simulado: ingreso, canje, Caja, QR, permisos, paleta personalizada, modo claro/oscuro |
| `tests/plataforma.test.js` | **Superadmin:** invitaciones (vigente, vencida, utilizada, revocada), registro con invitación, envío, aprobación y rechazo, suspensión, bloqueo y reactivación, auditoría, dashboard global y permisos |

Resultado esperado al final de la salida:

```
# tests 68
# pass 68
# fail 0
```

## 12. Solución de problemas

| Problema | Qué hacer |
|---|---|
| **`node` o `npm` "no se reconoce como comando"** | Node.js no está instalado o la terminal se abrió antes de instalarlo. Instalá la versión **LTS** desde <https://nodejs.org>, cerrá y volvé a abrir la terminal, y comprobá con `node -v`. |
| **`npm run dev` da "vite no se reconoce" o "Cannot find module"** | Faltan dependencias: ejecutá `npm install` en la carpeta que contiene `package.json`. Si sigue fallando, borrá la carpeta `node_modules` (y `package-lock.json` si da conflictos) y volvé a ejecutar `npm install`. |
| **El puerto 5173 está ocupado** | Vite usa automáticamente el siguiente libre (5174, 5175…): abrí la dirección que muestra la terminal. Para elegir uno: `npm run dev -- --port 5180`. |
| **Los datos se ven raros o desactualizados** (por ejemplo, después de actualizar el código) | En **Ingresar**, tocá **"Restablecer datos de prueba"**. Los datos también se regeneran solos cuando cambia su versión en el código. |
| **Reiniciar la demostración desde cero** | Opción 1: **Ingresar → Restablecer datos de prueba** (cerrá la sesión primero). Opción 2: abrí la app en una **ventana privada o de incógnito**, que empieza siempre con datos nuevos. Opción 3: F12 → *Application* (o *Almacenamiento*) → *Local Storage* → `http://localhost:5173` → borrá las claves que empiezan con `gopuntos:`. |
| **Quedó abierta una sesión de otra cuenta** | Menú lateral (o Perfil, en la app del cliente) → **Cerrar sesión**. |
| **La página queda en blanco** | Recargá con **Ctrl + F5**. Si persiste, abrí la consola (F12 → *Console*) para ver el error y probá restablecer los datos de prueba. |
| **No se ven los íconos o la tipografía** | La tipografía (Onest) se descarga de Google Fonts: sin internet se usa una de reemplazo. Los íconos vienen con el proyecto. |

## 13. Documentación adicional

| Documento | Contenido |
|---|---|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Estructura técnica: componentes, rutas, stores, services, personalización visual y reglas de negocio |
| [`docs/ENDPOINTS_SUPERADMIN.md`](docs/ENDPOINTS_SUPERADMIN.md) | Endpoints que necesitará el backend para el panel del Superadmin y su correspondencia con MySQL |
| [`docs/MODELO_DATOS.md`](docs/MODELO_DATOS.md) | Reglas de negocio, modelo de datos, correspondencia con MySQL (incluidas las tablas del Superadmin) y endpoints previstos |
| [`docs/DIAGNOSTICO_VUE_MYSQL.md`](docs/DIAGNOSTICO_VUE_MYSQL.md) | Comparación entre los datos que usa Vue y las 28 tablas de `go_puntos_v2` |
| [`docs/PLAN_ETAPA3.md`](docs/PLAN_ETAPA3.md) | Plan de la próxima etapa: backend Node.js + Express + MySQL2, según la guía de la cátedra |
| [`database/README.md`](database/README.md) | Cómo importar el esquema MySQL (opcional) |
