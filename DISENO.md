# Sistema de diseño GO Puntos

## Idea central

GO Puntos es una plataforma digital de fidelización. El cliente acumula puntos, ve cuánto le falta para una recompensa, canjea y muestra su QR en caja.

La app del cliente se diseñó **primero para el celular** y se reduce a tres secciones: **Mis puntos, Recompensas y Ofertas**. Cada pantalla tiene una sola acción principal, grande y visible.

La pieza protagonista es la **tarjeta de puntos** (`GO.ui.pointsCard()`): saldo grande, barra de progreso y cuánto falta para la próxima recompensa.

## Color

| Token | Hex | Uso |
|---|---|---|
| `--forest` | #1F4D3A | Marca, botones principales |
| `--deep` | #102A1E | Fondos profundos, menú del admin, footer |
| `--sage` / `--sage-2` | #DCEBD2 / #EDF4E7 | Superficies de apoyo, estados activos |
| `--cream` | #F1EFE6 | Fondo general |
| `--honey` | #E6A73A | Acento: progreso, acción de sumar puntos |
| `--tomato` | #C2533D | Errores y puntos descontados |

El acento es **miel**: remite a granola, miel y frutos secos. Los textos sobre miel usan `--honey-ink` para cumplir contraste AA.

## Tipografía

**Onest** en todo el sistema, con números tabulares para que las columnas de puntos no se muevan. Los pesos se limitan a regular y medium: en pantallas chicas, el tamaño y el espacio ordenan mejor que el negrita.

## Forma y espacio

Los radios marcan jerarquía: 12 px en chips, 16 px en campos, 22 px en tarjetas y 28 px en la tarjeta de puntos y las hojas. Las sombras están teñidas de verde, no de gris. El espaciado va en múltiplos de 4 px.

## Patrones del celular

- **Barra inferior de tres pestañas.** En pantallas grandes pasa arriba.
- **Hoja inferior** para confirmar acciones, con `<dialog>` nativo.
- **Botón principal ancho** de al menos 56 px de alto.
- **Áreas táctiles** de 44 px como mínimo.
- **Una acción por pantalla:** en Recompensas el único botón es *Canjear*.

## Accesibilidad

- Foco visible con anillo miel.
- Errores conectados al campo con `aria-describedby` y anunciados con `role="alert"`.
- Barra de progreso con `role="progressbar"` y valores.
- Enlace "Saltar al contenido" y `aria-current` en la pestaña activa.
- Los modales usan `<dialog>`: foco atrapado y cierre con Escape ya resueltos.
- Se respeta `prefers-reduced-motion`.
