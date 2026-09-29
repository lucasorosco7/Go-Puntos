# Resolución del conflicto de fusión

## Archivo afectado
`assets/js/config.js`

## Conflicto generado
Para demostrar la resolución de conflictos en Git, se crearon dos ramas que modificaban la misma regla de configuración de GO Puntos.

- `conflicto/nombre-plataforma`: establecía 150 pesos por punto.
- `conflicto/regla-puntos-alternativa`: establecía 200 pesos por punto.

Al intentar fusionar ambas ramas, Git detectó que las dos modificaban la misma línea de `config.js`, generando un conflicto de fusión.

## Resolución
El conflicto se resolvió manualmente comparando ambas alternativas.

Se decidió conservar la configuración de **150 pesos por punto**, ya que permite que los clientes acumulen puntos más rápidamente que con la alternativa de 200 pesos, facilitando el acceso a las recompensas del programa de fidelización.

Se eliminaron manualmente los marcadores de conflicto generados por Git y se conservó la configuración elegida.

La resolución quedó registrada originalmente en el commit:

`fe20590 - merge: resolver conflicto en regla de puntos usando 150 pesos`