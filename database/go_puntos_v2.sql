-- =====================================================================
--  GO PUNTOS - Script de creación de base de datos (MySQL 8.0+ / MariaDB 10.5+)
--  24 tablas · InnoDB · utf8mb4 · normalizado hasta 3FN
-- =====================================================================

DROP DATABASE IF EXISTS go_puntos_v2;
CREATE DATABASE go_puntos_v2
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE go_puntos_v2;


SET NAMES utf8mb4;

-- =====================================================================
-- 1. NÚCLEO: usuarios - negocios - roles
-- =====================================================================

CREATE TABLE roles (
  id_rol        INT           NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(30)   NOT NULL,
  descripcion   VARCHAR(150)  NULL,
  CONSTRAINT pk_roles        PRIMARY KEY (id_rol),
  CONSTRAINT uq_roles_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id_usuario      INT           NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(80)   NOT NULL,
  apellido        VARCHAR(80)   NOT NULL,
  email           VARCHAR(150)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  telefono        VARCHAR(30)   NULL,
  fecha_registro  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado          VARCHAR(20)   NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_usuarios       PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE negocios (
  id_negocio        INT           NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(120)  NOT NULL,
  descripcion       VARCHAR(255)  NULL,
  logo_url          VARCHAR(255)  NULL,
  color_primario    VARCHAR(20)   NULL,
  color_secundario  VARCHAR(20)   NULL,
  color_acento      VARCHAR(20)   NULL,
  qr_publico        VARCHAR(255)  NOT NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado            VARCHAR(20)   NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_negocios    PRIMARY KEY (id_negocio),
  CONSTRAINT uq_negocios_qr UNIQUE (qr_publico)
) ENGINE=InnoDB;

CREATE TABLE usuarios_negocios (
  id_usuario_negocio  INT          NOT NULL AUTO_INCREMENT,
  id_usuario          INT          NOT NULL,
  id_negocio          INT          NOT NULL,
  id_rol              INT          NOT NULL,
  fecha_asociacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado              VARCHAR(20)  NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_usuarios_negocios PRIMARY KEY (id_usuario_negocio),
  CONSTRAINT uq_un_usuario_negocio UNIQUE (id_usuario, id_negocio),
  CONSTRAINT fk_un_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_un_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT fk_un_rol     FOREIGN KEY (id_rol)     REFERENCES roles (id_rol),
  INDEX idx_un_negocio_rol (id_negocio, id_rol)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. CONFIGURACIÓN DEL NEGOCIO
-- =====================================================================

CREATE TABLE configuracion_puntos (
  id_configuracion   INT            NOT NULL AUTO_INCREMENT,
  id_negocio         INT            NOT NULL,
  pesos_por_punto    DECIMAL(12,2)  NOT NULL,
  vencimiento_meses  INT            NULL,       
  fecha_desde        DATE           NOT NULL,
  estado             VARCHAR(20)    NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_configuracion_puntos PRIMARY KEY (id_configuracion),
  CONSTRAINT fk_cfg_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_cfg_pesos   CHECK (pesos_por_punto > 0),
  CONSTRAINT ck_cfg_venc    CHECK (vencimiento_meses IS NULL OR vencimiento_meses > 0),
  INDEX idx_cfg_negocio_fecha (id_negocio, fecha_desde)
) ENGINE=InnoDB;

CREATE TABLE niveles (
  id_nivel        INT           NOT NULL AUTO_INCREMENT,
  id_negocio      INT           NOT NULL,
  nombre          VARCHAR(40)   NOT NULL,
  puntos_minimos  INT           NOT NULL,
  puntos_maximos  INT           NULL,            
  beneficio       VARCHAR(255)  NULL,
  orden           INT           NOT NULL,
  CONSTRAINT pk_niveles PRIMARY KEY (id_nivel),
  CONSTRAINT uq_niveles_negocio_nombre UNIQUE (id_negocio, nombre),
  CONSTRAINT uq_niveles_negocio_orden  UNIQUE (id_negocio, orden),
  CONSTRAINT fk_niveles_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_niveles_min   CHECK (puntos_minimos >= 0),
  CONSTRAINT ck_niveles_rango CHECK (puntos_maximos IS NULL OR puntos_maximos >= puntos_minimos)
) ENGINE=InnoDB;

CREATE TABLE periodos_mensuales (
  id_periodo    INT          NOT NULL AUTO_INCREMENT,
  id_negocio    INT          NOT NULL,
  anio          SMALLINT     NOT NULL,
  mes           TINYINT      NOT NULL,
  fecha_inicio  DATE         NOT NULL,
  fecha_fin     DATE         NOT NULL,
  estado        VARCHAR(20)  NOT NULL DEFAULT 'abierto',
  CONSTRAINT pk_periodos_mensuales PRIMARY KEY (id_periodo),
  CONSTRAINT uq_periodo_negocio_mes UNIQUE (id_negocio, anio, mes),
  CONSTRAINT fk_periodo_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_periodo_mes    CHECK (mes BETWEEN 1 AND 12),
  CONSTRAINT ck_periodo_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. PUNTOS Y COMPRAS
-- =====================================================================

CREATE TABLE saldos_puntos (
  id_saldo             INT       NOT NULL AUTO_INCREMENT,
  id_usuario_negocio   INT       NOT NULL,
  saldo_actual         INT       NOT NULL DEFAULT 0,
  fecha_actualizacion  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_saldos_puntos PRIMARY KEY (id_saldo),
  CONSTRAINT uq_saldo_usuario_negocio UNIQUE (id_usuario_negocio),   
  CONSTRAINT fk_saldo_un FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_saldo_no_negativo CHECK (saldo_actual >= 0)
) ENGINE=InnoDB;

CREATE TABLE compras (
  id_compra            INT            NOT NULL AUTO_INCREMENT,
  id_cliente_negocio   INT            NOT NULL,   
  id_operador_negocio  INT            NOT NULL,   
  importe              DECIMAL(12,2)  NOT NULL,
  puntos_generados     INT            NOT NULL DEFAULT 0,
  fecha_compra         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado               VARCHAR(20)    NOT NULL DEFAULT 'confirmada',
  observaciones        VARCHAR(255)   NULL,
  CONSTRAINT pk_compras PRIMARY KEY (id_compra),
  CONSTRAINT fk_compras_cliente  FOREIGN KEY (id_cliente_negocio)  REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT fk_compras_operador FOREIGN KEY (id_operador_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_compras_importe CHECK (importe > 0),
  CONSTRAINT ck_compras_puntos  CHECK (puntos_generados >= 0),
  INDEX idx_compras_cliente_fecha (id_cliente_negocio, fecha_compra),
  INDEX idx_compras_operador (id_operador_negocio)
) ENGINE=InnoDB;

CREATE TABLE movimientos_puntos (
  id_movimiento       INT           NOT NULL AUTO_INCREMENT,
  id_usuario_negocio  INT           NOT NULL,
  id_compra           INT           NULL,
  tipo                VARCHAR(30)   NOT NULL,     
  cantidad            INT           NOT NULL,     
  saldo_resultante    INT           NOT NULL,
  fecha_movimiento    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  descripcion         VARCHAR(255)  NULL,
  CONSTRAINT pk_movimientos_puntos PRIMARY KEY (id_movimiento),
  CONSTRAINT fk_mov_un     FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT fk_mov_compra FOREIGN KEY (id_compra)          REFERENCES compras (id_compra),
  CONSTRAINT ck_mov_saldo CHECK (saldo_resultante >= 0),
  INDEX idx_mov_un_fecha (id_usuario_negocio, fecha_movimiento),
  INDEX idx_mov_compra (id_compra)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. RANKING MENSUAL
-- =====================================================================

CREATE TABLE resultados_mensuales (
  id_resultado        INT            NOT NULL AUTO_INCREMENT,
  id_periodo          INT            NOT NULL,
  id_usuario_negocio  INT            NOT NULL,
  id_nivel_obtenido   INT            NOT NULL,
  puntos_ganados      INT            NOT NULL DEFAULT 0,
  cantidad_compras    INT            NOT NULL DEFAULT 0,
  gasto_total         DECIMAL(12,2)  NOT NULL DEFAULT 0,
  posicion_ranking    INT            NULL,
  CONSTRAINT pk_resultados_mensuales PRIMARY KEY (id_resultado),
  CONSTRAINT uq_resultado_periodo_un UNIQUE (id_periodo, id_usuario_negocio),
  CONSTRAINT fk_res_periodo FOREIGN KEY (id_periodo)         REFERENCES periodos_mensuales (id_periodo),
  CONSTRAINT fk_res_un      FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT fk_res_nivel   FOREIGN KEY (id_nivel_obtenido)  REFERENCES niveles (id_nivel),
  CONSTRAINT ck_res_puntos   CHECK (puntos_ganados >= 0),
  CONSTRAINT ck_res_compras  CHECK (cantidad_compras >= 0),
  CONSTRAINT ck_res_gasto    CHECK (gasto_total >= 0),
  CONSTRAINT ck_res_posicion CHECK (posicion_ranking IS NULL OR posicion_ranking >= 1),
  INDEX idx_res_periodo_pos (id_periodo, posicion_ranking),
  INDEX idx_res_un (id_usuario_negocio),
  INDEX idx_res_nivel (id_nivel_obtenido)
) ENGINE=InnoDB;

CREATE TABLE premios_ranking (
  id_premio_ranking  INT            NOT NULL AUTO_INCREMENT,
  id_periodo         INT            NOT NULL,
  posicion           INT            NOT NULL,
  tipo_premio        VARCHAR(40)    NOT NULL,
  valor              DECIMAL(12,2)  NULL,
  descripcion        VARCHAR(255)   NULL,
  CONSTRAINT pk_premios_ranking PRIMARY KEY (id_premio_ranking),
  CONSTRAINT uq_premio_periodo_pos UNIQUE (id_periodo, posicion),
  CONSTRAINT fk_premio_periodo FOREIGN KEY (id_periodo) REFERENCES periodos_mensuales (id_periodo),
  CONSTRAINT ck_premio_pos   CHECK (posicion >= 1),
  CONSTRAINT ck_premio_valor CHECK (valor IS NULL OR valor >= 0)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. RECOMPENSAS, CANJES Y OFERTAS
-- =====================================================================

CREATE TABLE recompensas (
  id_recompensa  INT           NOT NULL AUTO_INCREMENT,
  id_negocio     INT           NOT NULL,
  nombre         VARCHAR(120)  NOT NULL,
  descripcion    VARCHAR(255)  NULL,
  costo_puntos   INT           NOT NULL,
  stock          INT           NULL,             
  fecha_inicio   DATE          NULL,
  fecha_fin      DATE          NULL,
  estado         VARCHAR(20)   NOT NULL DEFAULT 'activa',
  CONSTRAINT pk_recompensas PRIMARY KEY (id_recompensa),
  CONSTRAINT fk_recomp_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_recomp_costo  CHECK (costo_puntos > 0),
  CONSTRAINT ck_recomp_stock  CHECK (stock IS NULL OR stock >= 0),
  CONSTRAINT ck_recomp_fechas CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  INDEX idx_recomp_negocio_estado (id_negocio, estado)
) ENGINE=InnoDB;

CREATE TABLE canjes (
  id_canje             INT          NOT NULL AUTO_INCREMENT,
  id_usuario_negocio   INT          NOT NULL,   
  id_recompensa        INT          NOT NULL,
  id_operador_negocio  INT          NULL,       
  puntos_utilizados    INT          NOT NULL,
  codigo_canje         VARCHAR(50)  NOT NULL,
  fecha_canje          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_validacion     DATETIME     NULL,
  estado               VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  CONSTRAINT pk_canjes PRIMARY KEY (id_canje),
  CONSTRAINT uq_canjes_codigo UNIQUE (codigo_canje),
  CONSTRAINT fk_canje_un        FOREIGN KEY (id_usuario_negocio)  REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT fk_canje_recompensa FOREIGN KEY (id_recompensa)      REFERENCES recompensas (id_recompensa),
  CONSTRAINT fk_canje_operador  FOREIGN KEY (id_operador_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_canje_puntos CHECK (puntos_utilizados > 0),
  CONSTRAINT ck_canje_fechas CHECK (fecha_validacion IS NULL OR fecha_validacion >= fecha_canje),
  INDEX idx_canje_un_fecha (id_usuario_negocio, fecha_canje),
  INDEX idx_canje_recompensa (id_recompensa),
  INDEX idx_canje_operador (id_operador_negocio)
) ENGINE=InnoDB;

CREATE TABLE ofertas (
  id_oferta           INT           NOT NULL AUTO_INCREMENT,
  id_negocio          INT           NOT NULL,
  id_nivel_requerido  INT           NULL,       
  titulo              VARCHAR(120)  NOT NULL,
  descripcion         VARCHAR(255)  NULL,
  beneficio           VARCHAR(150)  NULL,
  imagen_url          VARCHAR(255)  NULL,
  fecha_inicio        DATE          NULL,
  fecha_fin           DATE          NULL,
  estado              VARCHAR(20)   NOT NULL DEFAULT 'activa',
  CONSTRAINT pk_ofertas PRIMARY KEY (id_oferta),
  CONSTRAINT fk_oferta_negocio FOREIGN KEY (id_negocio)         REFERENCES negocios (id_negocio),
  CONSTRAINT fk_oferta_nivel   FOREIGN KEY (id_nivel_requerido) REFERENCES niveles (id_nivel),
  CONSTRAINT ck_oferta_fechas CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  INDEX idx_oferta_negocio_estado (id_negocio, estado),
  INDEX idx_oferta_nivel (id_nivel_requerido)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. GAMIFICACIÓN (2.ª etapa)
-- =====================================================================

CREATE TABLE desafios (
  id_desafio     INT           NOT NULL AUTO_INCREMENT,
  id_negocio     INT           NOT NULL,
  nombre         VARCHAR(120)  NOT NULL,
  descripcion    VARCHAR(255)  NULL,
  tipo_objetivo  VARCHAR(40)   NOT NULL,        
  meta           INT           NOT NULL,
  puntos_premio  INT           NOT NULL DEFAULT 0,
  fecha_inicio   DATE          NOT NULL,
  fecha_fin      DATE          NOT NULL,
  estado         VARCHAR(20)   NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_desafios PRIMARY KEY (id_desafio),
  CONSTRAINT fk_desafio_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_desafio_meta   CHECK (meta > 0),
  CONSTRAINT ck_desafio_premio CHECK (puntos_premio >= 0),
  CONSTRAINT ck_desafio_fechas CHECK (fecha_fin >= fecha_inicio),
  INDEX idx_desafio_negocio_estado (id_negocio, estado)
) ENGINE=InnoDB;

CREATE TABLE progreso_desafios (
  id_progreso         INT       NOT NULL AUTO_INCREMENT,
  id_desafio          INT       NOT NULL,
  id_usuario_negocio  INT       NOT NULL,
  progreso_actual     INT       NOT NULL DEFAULT 0,
  completado          BOOLEAN   NOT NULL DEFAULT FALSE,
  fecha_completado    DATETIME  NULL,
  CONSTRAINT pk_progreso_desafios PRIMARY KEY (id_progreso),
  CONSTRAINT uq_progreso_desafio_un UNIQUE (id_desafio, id_usuario_negocio),
  CONSTRAINT fk_prog_desafio FOREIGN KEY (id_desafio)         REFERENCES desafios (id_desafio),
  CONSTRAINT fk_prog_un      FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_prog_actual CHECK (progreso_actual >= 0),
  INDEX idx_prog_un (id_usuario_negocio)
) ENGINE=InnoDB;

CREATE TABLE rachas_clientes (
  id_racha            INT          NOT NULL AUTO_INCREMENT,
  id_usuario_negocio  INT          NOT NULL,
  tipo_racha          VARCHAR(40)  NOT NULL,     
  valor_actual        INT          NOT NULL DEFAULT 0,
  mejor_valor         INT          NOT NULL DEFAULT 0,
  ultima_actividad    DATE         NULL,
  CONSTRAINT pk_rachas_clientes PRIMARY KEY (id_racha),
  CONSTRAINT uq_racha_un_tipo UNIQUE (id_usuario_negocio, tipo_racha),
  CONSTRAINT fk_racha_un FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_racha_valores CHECK (valor_actual >= 0 AND mejor_valor >= valor_actual)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. MARKETING Y SEGMENTACIÓN (2.ª etapa)
-- =====================================================================

CREATE TABLE segmentos (
  id_segmento  INT           NOT NULL AUTO_INCREMENT,
  id_negocio   INT           NOT NULL,
  nombre       VARCHAR(50)   NOT NULL,
  descripcion  VARCHAR(255)  NULL,
  estado       VARCHAR(20)   NOT NULL DEFAULT 'activo',
  CONSTRAINT pk_segmentos PRIMARY KEY (id_segmento),
  CONSTRAINT uq_segmento_negocio_nombre UNIQUE (id_negocio, nombre),
  CONSTRAINT fk_segmento_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio)
) ENGINE=InnoDB;

CREATE TABLE usuarios_segmentos (
  id_usuario_segmento  INT       NOT NULL AUTO_INCREMENT,
  id_usuario_negocio   INT       NOT NULL,
  id_segmento          INT       NOT NULL,
  fecha_desde          DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_hasta          DATETIME  NULL,
  activo               BOOLEAN   NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_usuarios_segmentos PRIMARY KEY (id_usuario_segmento),
  CONSTRAINT fk_us_un       FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT fk_us_segmento FOREIGN KEY (id_segmento)        REFERENCES segmentos (id_segmento),
  CONSTRAINT ck_us_fechas CHECK (fecha_hasta IS NULL OR fecha_hasta >= fecha_desde),
  INDEX idx_us_un_activo (id_usuario_negocio, activo),
  INDEX idx_us_segmento_activo (id_segmento, activo)
) ENGINE=InnoDB;

CREATE TABLE campanas (
  id_campana    INT           NOT NULL AUTO_INCREMENT,
  id_negocio    INT           NOT NULL,
  nombre        VARCHAR(120)  NOT NULL,
  descripcion   VARCHAR(255)  NULL,
  fecha_inicio  DATETIME      NOT NULL,
  fecha_fin     DATETIME      NULL,
  estado        VARCHAR(20)   NOT NULL DEFAULT 'borrador',
  CONSTRAINT pk_campanas PRIMARY KEY (id_campana),
  CONSTRAINT fk_campana_negocio FOREIGN KEY (id_negocio) REFERENCES negocios (id_negocio),
  CONSTRAINT ck_campana_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
  INDEX idx_campana_negocio_estado (id_negocio, estado)
) ENGINE=InnoDB;

CREATE TABLE destinatarios_campana (
  id_destinatario     INT          NOT NULL AUTO_INCREMENT,
  id_campana          INT          NOT NULL,
  id_usuario_negocio  INT          NOT NULL,
  fecha_asignacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado              VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  CONSTRAINT pk_destinatarios_campana PRIMARY KEY (id_destinatario),
  CONSTRAINT uq_dest_campana_un UNIQUE (id_campana, id_usuario_negocio),
  CONSTRAINT fk_dest_campana FOREIGN KEY (id_campana)         REFERENCES campanas (id_campana),
  CONSTRAINT fk_dest_un      FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  INDEX idx_dest_un (id_usuario_negocio)
) ENGINE=InnoDB;

CREATE TABLE notificaciones (
  id_notificacion     INT           NOT NULL AUTO_INCREMENT,
  id_usuario_negocio  INT           NOT NULL,
  titulo              VARCHAR(120)  NOT NULL,
  mensaje             VARCHAR(500)  NOT NULL,
  tipo                VARCHAR(40)   NOT NULL,
  fecha_creacion      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura       DATETIME      NULL,
  leida               BOOLEAN       NOT NULL DEFAULT FALSE,
  CONSTRAINT pk_notificaciones PRIMARY KEY (id_notificacion),
  CONSTRAINT fk_notif_un FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio),
  CONSTRAINT ck_notif_lectura CHECK (fecha_lectura IS NULL OR fecha_lectura >= fecha_creacion),
  INDEX idx_notif_un_leida (id_usuario_negocio, leida, fecha_creacion)
) ENGINE=InnoDB;

CREATE TABLE auditoria (
  id_auditoria        BIGINT        NOT NULL AUTO_INCREMENT,
  id_usuario_negocio  INT           NULL,
  entidad             VARCHAR(60)   NOT NULL,      
  id_entidad          INT           NULL,          
  accion              VARCHAR(30)   NOT NULL,      
  fecha_accion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle             VARCHAR(500)  NULL,
  CONSTRAINT pk_auditoria PRIMARY KEY (id_auditoria),
  CONSTRAINT fk_audit_un FOREIGN KEY (id_usuario_negocio) REFERENCES usuarios_negocios (id_usuario_negocio)
    ON DELETE SET NULL,
  INDEX idx_audit_entidad (entidad, id_entidad),
  INDEX idx_audit_un_fecha (id_usuario_negocio, fecha_accion)
) ENGINE=InnoDB;


-- =====================================================================
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- Estos inserts preparan el entorno para que las consultas no den error.
-- =====================================================================

INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Gestiona el negocio, su configuración y a su equipo'),
  ('Empleado',      'Registra compras y valida canjes'),
  ('Cliente',       'Acumula puntos y canjea recompensas');

-- Creamos el negocio 1
INSERT INTO negocios (id_negocio, nombre, descripcion, qr_publico) VALUES 
  (1, 'Ferretería Alvear', 'Venta de materiales y herramientas', 'qr-alvear-123');

-- Creamos un operador (id_usuario = 2) y un cliente (id_usuario = 15)
INSERT INTO usuarios (id_usuario, nombre, apellido, email, password_hash) VALUES 
  (2, 'María', 'Gómez', 'maria.emp@email.com', '12345'),
  (15, 'Juan', 'Pérez', 'juan.cliente@email.com', '12345');

-- Los asociamos al negocio 1, forzando los IDs 2 (Empleado) y 15 (Cliente)
INSERT INTO usuarios_negocios (id_usuario_negocio, id_usuario, id_negocio, id_rol) VALUES 
  (2, 2, 1, 2),   
  (15, 15, 1, 3); 

-- Le damos un saldo inicial de 1000 puntos al cliente 15 para que pueda hacer el canje de 300
INSERT INTO saldos_puntos (id_usuario_negocio, saldo_actual) VALUES 
  (15, 1000); 

-- Creamos las recompensas específicas que usan las consultas (IDs 3 y 5)
INSERT INTO recompensas (id_recompensa, id_negocio, nombre, costo_puntos, stock, estado) VALUES 
  (3, 1, 'Descuento 10%', 300, 5, 'activa'),
  (5, 1, 'Corte de pelo gratis', 500, 10, 'activa');


-- =====================================================================
-- SCRIPT DE CONSULTAS - GO PUNTOS
-- Arquitectura Multi-Tenant (Filtrado por id_negocio)
-- =====================================================================

-- ---------------------------------------------------------------------
-- BLOQUE 1: CRUD BÁSICO Y GESTIÓN
-- ---------------------------------------------------------------------

-- 1. Listar todos los clientes activos de un negocio específico (Ej: id_negocio = 1)
SELECT u.id_usuario, u.nombre, u.apellido, u.email, sp.saldo_actual
FROM usuarios u
JOIN usuarios_negocios un ON u.id_usuario = un.id_usuario
JOIN roles r ON un.id_rol = r.id_rol
LEFT JOIN saldos_puntos sp ON un.id_usuario_negocio = sp.id_usuario_negocio
WHERE un.id_negocio = 1 
  AND r.nombre = 'Cliente' 
  AND un.estado = 'activo';

-- 2. Crear una nueva recompensa para un negocio
INSERT INTO recompensas (id_negocio, nombre, descripcion, costo_puntos, stock, estado)
VALUES (1, 'Tornillos extra gratis', 'Válido de martes a jueves', 500, 10, 'activa');

-- 3. Actualizar el estado de una recompensa (Pausar recompensa)
UPDATE recompensas 
SET estado = 'inactiva' 
WHERE id_recompensa = 5 AND id_negocio = 1;


-- ---------------------------------------------------------------------
-- BLOQUE 2: LÓGICA DE NEGOCIO (TRANSACCIONES)
-- ---------------------------------------------------------------------

-- 4. Registrar una COMPRA y sumar puntos al cliente
-- Ahora funcionará porque el id_cliente_negocio = 15 y id_operador = 2 EXISTEN.
START TRANSACTION;

    INSERT INTO compras (id_cliente_negocio, id_operador_negocio, importe, puntos_generados, estado)
    VALUES (15, 2, 5000.00, 50, 'confirmada');

    UPDATE saldos_puntos
    SET saldo_actual = saldo_actual + 50
    WHERE id_usuario_negocio = 15;

    INSERT INTO movimientos_puntos (id_usuario_negocio, id_compra, tipo, cantidad, saldo_resultante)
    VALUES (
        15, 
        LAST_INSERT_ID(),
        'compra', 
        50, 
        (SELECT saldo_actual FROM saldos_puntos WHERE id_usuario_negocio = 15)
    );

COMMIT;


-- 5. Registrar un CANJE de recompensa (Descontar puntos)
-- Ahora funcionará porque el saldo ya no es nulo y la recompensa 3 EXISTE.
START TRANSACTION;

    INSERT INTO canjes (id_usuario_negocio, id_recompensa, puntos_utilizados, codigo_canje, estado)
    VALUES (15, 3, 300, 'CANJE-XYZ123', 'pendiente');

    UPDATE saldos_puntos
    SET saldo_actual = saldo_actual - 300
    WHERE id_usuario_negocio = 15;

    INSERT INTO movimientos_puntos (id_usuario_negocio, tipo, cantidad, saldo_resultante)
    VALUES (
        15, 
        'canje', 
        -300, 
        (SELECT saldo_actual FROM saldos_puntos WHERE id_usuario_negocio = 15)
    );

    UPDATE recompensas
    SET stock = stock - 1
    WHERE id_recompensa = 3 AND stock IS NOT NULL AND stock > 0;

COMMIT;


-- ---------------------------------------------------------------------
-- BLOQUE 3: CONSULTAS DE REPORTES Y ESTADÍSTICAS
-- ---------------------------------------------------------------------

-- 6. Consultar el historial de movimientos de un cliente específico
SELECT mp.fecha_movimiento, mp.tipo, mp.cantidad, mp.saldo_resultante, c.importe
FROM movimientos_puntos mp
LEFT JOIN compras c ON mp.id_compra = c.id_compra
WHERE mp.id_usuario_negocio = 15
ORDER BY mp.fecha_movimiento DESC;

-- 7. Ranking de los 10 clientes con más puntos acumulados en un negocio
SELECT u.nombre, u.apellido, sp.saldo_actual
FROM saldos_puntos sp
JOIN usuarios_negocios un ON sp.id_usuario_negocio = un.id_usuario_negocio
JOIN usuarios u ON un.id_usuario = u.id_usuario
WHERE un.id_negocio = 1
ORDER BY sp.saldo_actual DESC
LIMIT 10;

-- 8. Recompensas más canjeadas en un negocio (Reporte de Marketing)
SELECT r.nombre AS recompensa, COUNT(c.id_canje) AS total_canjes, SUM(c.puntos_utilizados) AS puntos_consumidos
FROM canjes c
JOIN recompensas r ON c.id_recompensa = r.id_recompensa
WHERE r.id_negocio = 1
GROUP BY r.id_recompensa, r.nombre
ORDER BY total_canjes DESC;

-- 9. Total facturado y puntos emitidos en el mes actual por negocio
SELECT 
    n.nombre AS negocio,
    COUNT(c.id_compra) AS cantidad_ventas,
    SUM(c.importe) AS total_facturado,
    SUM(c.puntos_generados) AS puntos_entregados
FROM compras c
JOIN usuarios_negocios un ON c.id_cliente_negocio = un.id_usuario_negocio
JOIN negocios n ON un.id_negocio = n.id_negocio
WHERE un.id_negocio = 1 
  AND MONTH(c.fecha_compra) = MONTH(CURRENT_DATE()) 
  AND YEAR(c.fecha_compra) = YEAR(CURRENT_DATE())
GROUP BY n.id_negocio;