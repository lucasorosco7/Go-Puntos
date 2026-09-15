# GO Puntos · Frontend en HTML, CSS y JavaScript (Etapa 1)

Sistema de fidelización para **CV Dietética**. Proyecto final TUP, UTN FRT.

Sin frameworks ni instalación. La app del cliente está pensada **primero para el celular**, porque es desde donde más se va a usar.

## 1. Cómo abrirlo en Visual Studio Code

1. Descomprimí la carpeta y abrila en VS Code (*File → Open Folder*).
2. Instalá la extensión **Live Server** (de Ritwick Dey).
3. Clic derecho sobre `index.html` → **Open with Live Server**.

Para verlo como en el celular: abrí las herramientas del navegador con `F12` y activá la vista móvil (`Ctrl + Shift + M`).

> Los iconos (Lucide) y la tipografía (Onest) se cargan desde internet. Sin conexión la página funciona, pero sin iconos y con la fuente del sistema.

## 2. Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | martina@demo.com | demo1234 |
| Administrador | admin@cvdietetica.com | admin1234 |

En el login hay botones que completan estos datos.

## 3. La app del cliente: tres secciones

La barra inferior tiene sólo tres pestañas. Cuanto menos tenga que decidir la persona, mejor.

| Pestaña | Archivo | Qué muestra |
|---|---|---|
| **Mis puntos** | `puntos.html` | Saldo, cuánto falta para la próxima recompensa, botón para mostrar el código, lo que ya puede canjear, la oferta de la semana y los últimos movimientos |
| **Recompensas** | `recompensas.html` | Lista simple con un solo botón. Arranca en "Me alcanzan" |
| **Ofertas** | `ofertas.html` | Promociones del local de esta semana |

Pantallas de apoyo, sin pestaña propia:

- `codigo.html` — el QR en pantalla completa para mostrar en caja.
- `canje.html` — el código para retirar la recompensa en el local.
- `movimientos.html` — historial completo (se abre desde "Ver todos").
- `perfil.html` — datos, contraseña y nivel (se abre tocando el avatar).

En pantallas de más de 720 px la barra de pestañas pasa arriba y el contenido se centra.

## 4. Qué probar

1. **Login:** enviá vacío para ver los errores; probá el ojo para mostrar la contraseña.
2. **Mis puntos:** el saldo, la barra de progreso y el botón grande del código.
3. **Recompensas:** tocá *Canjear*. Sube una hoja de confirmación, y al aceptar aparece el código de retiro y el saldo nuevo.
4. **Ofertas:** la promo destacada y el resto de las promociones.
5. **Registro:** creá una cuenta y entrás con 100 puntos de bienvenida.
6. Abrí `puntos.html` sin sesión: te manda al login y después vuelve.

**Volver a los datos iniciales:** en la consola del navegador (`F12`):

```js
localStorage.clear(); sessionStorage.clear(); location.reload();
```

## 5. Estructura

```
go-puntos-html/
├── index.html                         landing pública
├── login.html · registro.html · recuperar.html
├── puntos.html · recompensas.html · ofertas.html     las 3 pestañas
├── codigo.html · canje.html · movimientos.html · perfil.html
├── admin*.html                        etapa 3 (pantallas temporales)
└── assets/
    ├── img/favicon.svg
    ├── css/
    │   ├── tokens.css      colores, tipografía, espacios, radios y sombras
    │   ├── base.css        reset, tipografía global y accesibilidad
    │   ├── components.css  botones, campos, filas, tarjeta de puntos, hojas…
    │   ├── app.css         área del cliente y barra de pestañas
    │   ├── admin.css       menú lateral del administrador
    │   ├── auth.css        login y registro
    │   └── landing.css     sitio público
    └── js/
        ├── config.js       configuración, rutas, reglas del programa y pestañas
        ├── data.js         datos de prueba (imitan las tablas de MySQL)
        ├── utils.js        formato, validaciones y cálculo de puntos y niveles
        ├── services.js     sesión, cliente HTTP y servicios del dominio
        ├── ui.js           componentes: tarjeta de puntos, filas, QR, hojas, avisos
        ├── forms.js        errores accesibles y mostrar/ocultar contraseña
        ├── layout.js       genera header, footer, pestañas o menú, y protege páginas
        └── pages/          un script por página
```

**Decisiones importantes**

- **Una página HTML por pantalla.** Cada una se convierte después en una plantilla de Flask.
- **Scripts clásicos con un objeto global `GO`.** Funciona abriendo el archivo directo, sin servidor ni módulos. El orden de los `<script>` importa: cada uno usa lo que definieron los anteriores.
- **`layout.js` genera las partes repetidas.** Cambiar las pestañas es editar `GO.nav` en `config.js`, no 12 archivos.
- **`GO.escape()`** se usa siempre que un dato se inserta con `innerHTML`, para evitar inyección de HTML (XSS).
- **El canje se resuelve en una sola hoja de confirmación** y el resultado va a su propia pantalla: en el celular se lee mejor que un modal con varios pasos.

## 6. Conectar con Flask más adelante

En `assets/js/config.js` poné `useMocks: false` y la URL de tu API. Cada servicio en `services.js` documenta el endpoint que espera:

```
POST /auth/login           -> { token, user }
POST /auth/register        -> { token, user }
GET  /me/dashboard         -> { user, movements, rewards, offers, notifications }
GET  /me/movements         -> [movement]
GET  /rewards              -> [reward]
POST /rewards/:id/redeem   -> { user, movement, code }
GET  /offers               -> [offer]
```

Las páginas no cambian: sólo llaman a los servicios.

## 7. Pendiente para las próximas etapas

- **Etapa 2:** detalle de recompensa con condiciones de canje ampliadas.
- **Etapa 3:** las cuatro pantallas del administrador (métricas, registrar compra, clientes y recompensas). Como ahora hay una sección **Ofertas**, el administrador también va a necesitar una pantalla para cargarlas y editarlas.
- **A definir:** el bonus por nivel (Plata +25%, Oro +50%) viene de la propuesta de mejora del PDF. Falta confirmar si entra en el sistema base.

## 8. Git

```bash
git init
git add .
git commit -m "Etapa 1: app del cliente en tres secciones, mobile first"
git branch -M main
git remote add origin https://github.com/USUARIO/go-puntos.git
git push -u origin main
```
