# Base de datos de GO Puntos (diseño)

`go_puntos_v2.sql` es el volcado (MySQL 8.0) de la base de datos diseñada para GO Puntos: **28 tablas**, con sus claves, restricciones `CHECK` y algunos datos de prueba.

> **Importante:** la aplicación Vue de este repositorio **todavía no se conecta a MySQL**. Funciona con datos simulados guardados en el navegador. **No hace falta instalar MySQL para ejecutar la maqueta.** La conexión real (Node.js + Express + MySQL2) es la próxima etapa: ver [`docs/PLAN_ETAPA3.md`](../docs/PLAN_ETAPA3.md).

## Cómo importarla (opcional, para revisar el modelo)

1. Abrí MySQL Workbench con una cuenta administradora.
2. Creá la base: `CREATE DATABASE go_puntos_v2 CHARACTER SET utf8mb4;`
3. *Server → Data Import → Import from Self-Contained File* → elegí `go_puntos_v2.sql` y como esquema destino `go_puntos_v2`.
4. Comprobá: `USE go_puntos_v2; SHOW TABLES;` debe listar 28 tablas.

## Tablas

| Área | Tablas |
|---|---|
| Cuentas y roles | `usuarios`, `roles`, `usuarios_negocios` (un rol por usuario y negocio) |
| Negocios y programa | `negocios`, `configuracion_puntos`, `niveles`, `recompensas`, `ofertas`, `desafios`, `campanas`, `segmentos` |
| Fidelización | `saldos_puntos`, `compras`, `movimientos_puntos`, `canjes`, `progreso_desafios`, `rachas_clientes`, `usuarios_segmentos`, `destinatarios_campana`, `notificaciones` |
| Períodos y ranking | `periodos_mensuales`, `resultados_mensuales`, `premios_ranking` |
| Auditoría del negocio | `auditoria` |
| **Plataforma (Superadmin)** | `administradores_plataforma`, `invitaciones_registro`, `solicitudes_negocio`, `auditoria_plataforma` |

La correspondencia entre estas tablas y los datos que usa Vue está en [`docs/MODELO_DATOS.md`](../docs/MODELO_DATOS.md) y el análisis completo de diferencias en [`docs/DIAGNOSTICO_VUE_MYSQL.md`](../docs/DIAGNOSTICO_VUE_MYSQL.md).

## Datos de prueba del volcado

Los registros incluidos (Ferretería Alvear y sus usuarios) son **ficticios**. Las contraseñas de prueba del volcado están en texto plano sólo porque es un ejemplo: el backend guardará únicamente hashes (bcrypt). Las correcciones propuestas a estos datos están en `docs/PLAN_ETAPA3.md` (sección 3) y **no** se aplicaron.

El archivo se conserva tal como se exportó: esta entrega no modifica el esquema ni ejecuta migraciones.
