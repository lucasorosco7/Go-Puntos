-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: go_puntos_v2
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administradores_plataforma`
--

DROP TABLE IF EXISTS `administradores_plataforma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores_plataforma` (
  `id_administrador` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `uq_administrador_usuario` (`id_usuario`),
  CONSTRAINT `fk_administrador_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `ck_administrador_estado` CHECK ((`estado` in (_utf8mb4'activo',_utf8mb4'inactivo')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administradores_plataforma`
--

LOCK TABLES `administradores_plataforma` WRITE;
/*!40000 ALTER TABLE `administradores_plataforma` DISABLE KEYS */;
/*!40000 ALTER TABLE `administradores_plataforma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id_auditoria` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int DEFAULT NULL,
  `entidad` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_entidad` int DEFAULT NULL,
  `accion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_accion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `detalle` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_audit_entidad` (`entidad`,`id_entidad`),
  KEY `idx_audit_un_fecha` (`id_usuario_negocio`,`fecha_accion`),
  CONSTRAINT `fk_audit_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_plataforma`
--

DROP TABLE IF EXISTS `auditoria_plataforma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria_plataforma` (
  `id_auditoria_plataforma` bigint NOT NULL AUTO_INCREMENT,
  `id_administrador` int NOT NULL,
  `id_negocio` int DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `accion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_accion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria_plataforma`),
  KEY `fk_auditoria_admin` (`id_administrador`),
  KEY `fk_auditoria_negocio` (`id_negocio`),
  KEY `fk_auditoria_solicitud` (`id_solicitud`),
  CONSTRAINT `fk_auditoria_admin` FOREIGN KEY (`id_administrador`) REFERENCES `administradores_plataforma` (`id_administrador`),
  CONSTRAINT `fk_auditoria_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `fk_auditoria_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes_negocio` (`id_solicitud`),
  CONSTRAINT `ck_auditoria_accion` CHECK ((`accion` in (_utf8mb4'crear_invitacion',_utf8mb4'revocar_invitacion',_utf8mb4'aprobar_negocio',_utf8mb4'rechazar_negocio',_utf8mb4'suspender_negocio',_utf8mb4'bloquear_negocio',_utf8mb4'reactivar_negocio')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_plataforma`
--

LOCK TABLES `auditoria_plataforma` WRITE;
/*!40000 ALTER TABLE `auditoria_plataforma` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria_plataforma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campanas`
--

DROP TABLE IF EXISTS `campanas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campanas` (
  `id_campana` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'borrador',
  PRIMARY KEY (`id_campana`),
  KEY `idx_campana_negocio_estado` (`id_negocio`,`estado`),
  CONSTRAINT `fk_campana_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_campana_fechas` CHECK (((`fecha_fin` is null) or (`fecha_fin` >= `fecha_inicio`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campanas`
--

LOCK TABLES `campanas` WRITE;
/*!40000 ALTER TABLE `campanas` DISABLE KEYS */;
/*!40000 ALTER TABLE `campanas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canjes`
--

DROP TABLE IF EXISTS `canjes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canjes` (
  `id_canje` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `id_recompensa` int NOT NULL,
  `id_operador_negocio` int DEFAULT NULL,
  `puntos_utilizados` int NOT NULL,
  `codigo_canje` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_canje` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_validacion` datetime DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_canje`),
  UNIQUE KEY `uq_canjes_codigo` (`codigo_canje`),
  KEY `idx_canje_un_fecha` (`id_usuario_negocio`,`fecha_canje`),
  KEY `idx_canje_recompensa` (`id_recompensa`),
  KEY `idx_canje_operador` (`id_operador_negocio`),
  CONSTRAINT `fk_canje_operador` FOREIGN KEY (`id_operador_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `fk_canje_recompensa` FOREIGN KEY (`id_recompensa`) REFERENCES `recompensas` (`id_recompensa`),
  CONSTRAINT `fk_canje_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_canje_fechas` CHECK (((`fecha_validacion` is null) or (`fecha_validacion` >= `fecha_canje`))),
  CONSTRAINT `ck_canje_puntos` CHECK ((`puntos_utilizados` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canjes`
--

LOCK TABLES `canjes` WRITE;
/*!40000 ALTER TABLE `canjes` DISABLE KEYS */;
INSERT INTO `canjes` VALUES (1,15,3,NULL,300,'CANJE-XYZ123','2026-11-22 22:21:24',NULL,'pendiente');
/*!40000 ALTER TABLE `canjes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id_compra` int NOT NULL AUTO_INCREMENT,
  `id_cliente_negocio` int NOT NULL,
  `id_operador_negocio` int NOT NULL,
  `importe` decimal(12,2) NOT NULL,
  `puntos_generados` int NOT NULL DEFAULT '0',
  `fecha_compra` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmada',
  `observaciones` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_compra`),
  KEY `idx_compras_cliente_fecha` (`id_cliente_negocio`,`fecha_compra`),
  KEY `idx_compras_operador` (`id_operador_negocio`),
  CONSTRAINT `fk_compras_cliente` FOREIGN KEY (`id_cliente_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `fk_compras_operador` FOREIGN KEY (`id_operador_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_compras_importe` CHECK ((`importe` > 0)),
  CONSTRAINT `ck_compras_puntos` CHECK ((`puntos_generados` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,15,2,5000.00,50,'2026-11-22 22:21:24','confirmada',NULL),(2,15,2,10000.00,100,'2026-11-23 01:50:12','confirmada','Compra de prueba - Paso 44');
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_puntos`
--

DROP TABLE IF EXISTS `configuracion_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_puntos` (
  `id_configuracion` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `pesos_por_punto` decimal(12,2) NOT NULL,
  `vencimiento_meses` int DEFAULT NULL,
  `fecha_desde` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `compra_minima` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tipo_redondeo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'abajo',
  `bono_bienvenida` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_configuracion`),
  KEY `idx_cfg_negocio_fecha` (`id_negocio`,`fecha_desde`),
  CONSTRAINT `fk_cfg_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_cfg_pesos` CHECK ((`pesos_por_punto` > 0)),
  CONSTRAINT `ck_cfg_venc` CHECK (((`vencimiento_meses` is null) or (`vencimiento_meses` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_puntos`
--

LOCK TABLES `configuracion_puntos` WRITE;
/*!40000 ALTER TABLE `configuracion_puntos` DISABLE KEYS */;
INSERT INTO `configuracion_puntos` VALUES (1,1,100.00,12,'2026-11-23','activo',1000.00,'abajo',100);
/*!40000 ALTER TABLE `configuracion_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `desafios`
--

DROP TABLE IF EXISTS `desafios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `desafios` (
  `id_desafio` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_objetivo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta` int NOT NULL,
  `puntos_premio` int NOT NULL DEFAULT '0',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_desafio`),
  KEY `idx_desafio_negocio_estado` (`id_negocio`,`estado`),
  CONSTRAINT `fk_desafio_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_desafio_fechas` CHECK ((`fecha_fin` >= `fecha_inicio`)),
  CONSTRAINT `ck_desafio_meta` CHECK ((`meta` > 0)),
  CONSTRAINT `ck_desafio_premio` CHECK ((`puntos_premio` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `desafios`
--

LOCK TABLES `desafios` WRITE;
/*!40000 ALTER TABLE `desafios` DISABLE KEYS */;
/*!40000 ALTER TABLE `desafios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `destinatarios_campana`
--

DROP TABLE IF EXISTS `destinatarios_campana`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinatarios_campana` (
  `id_destinatario` int NOT NULL AUTO_INCREMENT,
  `id_campana` int NOT NULL,
  `id_usuario_negocio` int NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_destinatario`),
  UNIQUE KEY `uq_dest_campana_un` (`id_campana`,`id_usuario_negocio`),
  KEY `idx_dest_un` (`id_usuario_negocio`),
  CONSTRAINT `fk_dest_campana` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`),
  CONSTRAINT `fk_dest_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `destinatarios_campana`
--

LOCK TABLES `destinatarios_campana` WRITE;
/*!40000 ALTER TABLE `destinatarios_campana` DISABLE KEYS */;
/*!40000 ALTER TABLE `destinatarios_campana` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitaciones_registro`
--

DROP TABLE IF EXISTS `invitaciones_registro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitaciones_registro` (
  `id_invitacion` int NOT NULL AUTO_INCREMENT,
  `id_administrador` int NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_destinatario` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` datetime NOT NULL,
  `fecha_uso` datetime DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_invitacion`),
  UNIQUE KEY `uq_invitacion_token` (`token_hash`),
  KEY `fk_invitacion_administrador` (`id_administrador`),
  CONSTRAINT `fk_invitacion_administrador` FOREIGN KEY (`id_administrador`) REFERENCES `administradores_plataforma` (`id_administrador`),
  CONSTRAINT `ck_invitacion_estado` CHECK ((`estado` in (_utf8mb4'pendiente',_utf8mb4'utilizada',_utf8mb4'revocada'))),
  CONSTRAINT `ck_invitacion_fechas` CHECK ((`fecha_vencimiento` > `fecha_creacion`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitaciones_registro`
--

LOCK TABLES `invitaciones_registro` WRITE;
/*!40000 ALTER TABLE `invitaciones_registro` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitaciones_registro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_puntos`
--

DROP TABLE IF EXISTS `movimientos_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_puntos` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `id_compra` int DEFAULT NULL,
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `saldo_resultante` int NOT NULL,
  `fecha_movimiento` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_movimiento`),
  KEY `idx_mov_un_fecha` (`id_usuario_negocio`,`fecha_movimiento`),
  KEY `idx_mov_compra` (`id_compra`),
  CONSTRAINT `fk_mov_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`),
  CONSTRAINT `fk_mov_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_mov_saldo` CHECK ((`saldo_resultante` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_puntos`
--

LOCK TABLES `movimientos_puntos` WRITE;
/*!40000 ALTER TABLE `movimientos_puntos` DISABLE KEYS */;
INSERT INTO `movimientos_puntos` VALUES (1,15,1,'compra',50,1050,'2026-11-22 22:21:24',NULL),(2,15,NULL,'canje',-300,750,'2026-11-22 22:21:24',NULL),(3,15,2,'compra',100,850,'2026-11-23 01:50:37','Puntos acreditados por compra de prueba');
/*!40000 ALTER TABLE `movimientos_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `negocios`
--

DROP TABLE IF EXISTS `negocios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `negocios` (
  `id_negocio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_primario` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_secundario` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_acento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_publico` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `email_contacto` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_negocio`),
  UNIQUE KEY `uq_negocios_qr` (`qr_publico`),
  CONSTRAINT `ck_negocios_estado` CHECK ((`estado` in (_utf8mb4'pendiente',_utf8mb4'activo',_utf8mb4'rechazado',_utf8mb4'suspendido',_utf8mb4'bloqueado')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `negocios`
--

LOCK TABLES `negocios` WRITE;
/*!40000 ALTER TABLE `negocios` DISABLE KEYS */;
INSERT INTO `negocios` VALUES (1,'Ferretería Alvear','Venta de materiales y herramientas',NULL,NULL,NULL,NULL,'qr-alvear-123','2026-11-22 22:21:24','activo',NULL,NULL,NULL);
/*!40000 ALTER TABLE `negocios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niveles`
--

DROP TABLE IF EXISTS `niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `niveles` (
  `id_nivel` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `nombre` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `puntos_minimos` int NOT NULL,
  `puntos_maximos` int DEFAULT NULL,
  `beneficio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int NOT NULL,
  `multiplicador` decimal(5,2) NOT NULL DEFAULT '1.00',
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_nivel`),
  UNIQUE KEY `uq_niveles_negocio_nombre` (`id_negocio`,`nombre`),
  UNIQUE KEY `uq_niveles_negocio_orden` (`id_negocio`,`orden`),
  CONSTRAINT `fk_niveles_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_niveles_min` CHECK ((`puntos_minimos` >= 0)),
  CONSTRAINT `ck_niveles_rango` CHECK (((`puntos_maximos` is null) or (`puntos_maximos` >= `puntos_minimos`)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niveles`
--

LOCK TABLES `niveles` WRITE;
/*!40000 ALTER TABLE `niveles` DISABLE KEYS */;
INSERT INTO `niveles` VALUES (1,1,'Bronce',0,1499,'Nivel inicial',1,1.00,'#CD7F32','medal'),(2,1,'Plata',1500,3999,'Multiplicador de puntos 1.25',2,1.25,'#A8A9AD','award'),(3,1,'Oro',4000,NULL,'Multiplicador de puntos 1.50',3,1.50,'#D4AF37','crown');
/*!40000 ALTER TABLE `niveles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `titulo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_lectura` datetime DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notif_un_leida` (`id_usuario_negocio`,`leida`,`fecha_creacion`),
  CONSTRAINT `fk_notif_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_notif_lectura` CHECK (((`fecha_lectura` is null) or (`fecha_lectura` >= `fecha_creacion`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ofertas`
--

DROP TABLE IF EXISTS `ofertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ofertas` (
  `id_oferta` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `id_nivel_requerido` int DEFAULT NULL,
  `titulo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `beneficio` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id_oferta`),
  KEY `idx_oferta_negocio_estado` (`id_negocio`,`estado`),
  KEY `idx_oferta_nivel` (`id_nivel_requerido`),
  CONSTRAINT `fk_oferta_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `fk_oferta_nivel` FOREIGN KEY (`id_nivel_requerido`) REFERENCES `niveles` (`id_nivel`),
  CONSTRAINT `ck_oferta_fechas` CHECK (((`fecha_inicio` is null) or (`fecha_fin` is null) or (`fecha_fin` >= `fecha_inicio`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ofertas`
--

LOCK TABLES `ofertas` WRITE;
/*!40000 ALTER TABLE `ofertas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ofertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodos_mensuales`
--

DROP TABLE IF EXISTS `periodos_mensuales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodos_mensuales` (
  `id_periodo` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `anio` smallint NOT NULL,
  `mes` tinyint NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'abierto',
  PRIMARY KEY (`id_periodo`),
  UNIQUE KEY `uq_periodo_negocio_mes` (`id_negocio`,`anio`,`mes`),
  CONSTRAINT `fk_periodo_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_periodo_fechas` CHECK ((`fecha_fin` >= `fecha_inicio`)),
  CONSTRAINT `ck_periodo_mes` CHECK ((`mes` between 1 and 12))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodos_mensuales`
--

LOCK TABLES `periodos_mensuales` WRITE;
/*!40000 ALTER TABLE `periodos_mensuales` DISABLE KEYS */;
INSERT INTO `periodos_mensuales` VALUES (1,1,2026,11,'2026-11-01','2026-11-30','abierto');
/*!40000 ALTER TABLE `periodos_mensuales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `premios_ranking`
--

DROP TABLE IF EXISTS `premios_ranking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `premios_ranking` (
  `id_premio_ranking` int NOT NULL AUTO_INCREMENT,
  `id_periodo` int NOT NULL,
  `posicion` int NOT NULL,
  `tipo_premio` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(12,2) DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_premio_ranking`),
  UNIQUE KEY `uq_premio_periodo_pos` (`id_periodo`,`posicion`),
  CONSTRAINT `fk_premio_periodo` FOREIGN KEY (`id_periodo`) REFERENCES `periodos_mensuales` (`id_periodo`),
  CONSTRAINT `ck_premio_pos` CHECK ((`posicion` >= 1)),
  CONSTRAINT `ck_premio_valor` CHECK (((`valor` is null) or (`valor` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `premios_ranking`
--

LOCK TABLES `premios_ranking` WRITE;
/*!40000 ALTER TABLE `premios_ranking` DISABLE KEYS */;
/*!40000 ALTER TABLE `premios_ranking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `progreso_desafios`
--

DROP TABLE IF EXISTS `progreso_desafios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progreso_desafios` (
  `id_progreso` int NOT NULL AUTO_INCREMENT,
  `id_desafio` int NOT NULL,
  `id_usuario_negocio` int NOT NULL,
  `progreso_actual` int NOT NULL DEFAULT '0',
  `completado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_completado` datetime DEFAULT NULL,
  PRIMARY KEY (`id_progreso`),
  UNIQUE KEY `uq_progreso_desafio_un` (`id_desafio`,`id_usuario_negocio`),
  KEY `idx_prog_un` (`id_usuario_negocio`),
  CONSTRAINT `fk_prog_desafio` FOREIGN KEY (`id_desafio`) REFERENCES `desafios` (`id_desafio`),
  CONSTRAINT `fk_prog_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_prog_actual` CHECK ((`progreso_actual` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `progreso_desafios`
--

LOCK TABLES `progreso_desafios` WRITE;
/*!40000 ALTER TABLE `progreso_desafios` DISABLE KEYS */;
/*!40000 ALTER TABLE `progreso_desafios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rachas_clientes`
--

DROP TABLE IF EXISTS `rachas_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rachas_clientes` (
  `id_racha` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `tipo_racha` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_actual` int NOT NULL DEFAULT '0',
  `mejor_valor` int NOT NULL DEFAULT '0',
  `ultima_actividad` date DEFAULT NULL,
  PRIMARY KEY (`id_racha`),
  UNIQUE KEY `uq_racha_un_tipo` (`id_usuario_negocio`,`tipo_racha`),
  CONSTRAINT `fk_racha_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_racha_valores` CHECK (((`valor_actual` >= 0) and (`mejor_valor` >= `valor_actual`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rachas_clientes`
--

LOCK TABLES `rachas_clientes` WRITE;
/*!40000 ALTER TABLE `rachas_clientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `rachas_clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recompensas`
--

DROP TABLE IF EXISTS `recompensas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recompensas` (
  `id_recompensa` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costo_puntos` int NOT NULL,
  `stock` int DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id_recompensa`),
  KEY `idx_recomp_negocio_estado` (`id_negocio`,`estado`),
  CONSTRAINT `fk_recomp_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `ck_recomp_costo` CHECK ((`costo_puntos` > 0)),
  CONSTRAINT `ck_recomp_fechas` CHECK (((`fecha_inicio` is null) or (`fecha_fin` is null) or (`fecha_fin` >= `fecha_inicio`))),
  CONSTRAINT `ck_recomp_stock` CHECK (((`stock` is null) or (`stock` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recompensas`
--

LOCK TABLES `recompensas` WRITE;
/*!40000 ALTER TABLE `recompensas` DISABLE KEYS */;
INSERT INTO `recompensas` VALUES (3,1,'Descuento 10%',NULL,300,4,NULL,NULL,'activa'),(5,1,'Corte de pelo gratis',NULL,500,10,NULL,NULL,'inactiva'),(6,1,'Tornillos extra gratis','Válido de martes a jueves',500,10,NULL,NULL,'activa');
/*!40000 ALTER TABLE `recompensas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resultados_mensuales`
--

DROP TABLE IF EXISTS `resultados_mensuales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resultados_mensuales` (
  `id_resultado` int NOT NULL AUTO_INCREMENT,
  `id_periodo` int NOT NULL,
  `id_usuario_negocio` int NOT NULL,
  `id_nivel_obtenido` int NOT NULL,
  `puntos_ganados` int NOT NULL DEFAULT '0',
  `cantidad_compras` int NOT NULL DEFAULT '0',
  `gasto_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `posicion_ranking` int DEFAULT NULL,
  PRIMARY KEY (`id_resultado`),
  UNIQUE KEY `uq_resultado_periodo_un` (`id_periodo`,`id_usuario_negocio`),
  KEY `idx_res_periodo_pos` (`id_periodo`,`posicion_ranking`),
  KEY `idx_res_un` (`id_usuario_negocio`),
  KEY `idx_res_nivel` (`id_nivel_obtenido`),
  CONSTRAINT `fk_res_nivel` FOREIGN KEY (`id_nivel_obtenido`) REFERENCES `niveles` (`id_nivel`),
  CONSTRAINT `fk_res_periodo` FOREIGN KEY (`id_periodo`) REFERENCES `periodos_mensuales` (`id_periodo`),
  CONSTRAINT `fk_res_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_res_compras` CHECK ((`cantidad_compras` >= 0)),
  CONSTRAINT `ck_res_gasto` CHECK ((`gasto_total` >= 0)),
  CONSTRAINT `ck_res_posicion` CHECK (((`posicion_ranking` is null) or (`posicion_ranking` >= 1))),
  CONSTRAINT `ck_res_puntos` CHECK ((`puntos_ganados` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resultados_mensuales`
--

LOCK TABLES `resultados_mensuales` WRITE;
/*!40000 ALTER TABLE `resultados_mensuales` DISABLE KEYS */;
INSERT INTO `resultados_mensuales` VALUES (1,1,15,1,150,2,15000.00,1);
/*!40000 ALTER TABLE `resultados_mensuales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador','Gestiona el negocio, su configuración y a su equipo'),(2,'Empleado','Registra compras y valida canjes'),(3,'Cliente','Acumula puntos y canjea recompensas');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saldos_puntos`
--

DROP TABLE IF EXISTS `saldos_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saldos_puntos` (
  `id_saldo` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `saldo_actual` int NOT NULL DEFAULT '0',
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_saldo`),
  UNIQUE KEY `uq_saldo_usuario_negocio` (`id_usuario_negocio`),
  CONSTRAINT `fk_saldo_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_saldo_no_negativo` CHECK ((`saldo_actual` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saldos_puntos`
--

LOCK TABLES `saldos_puntos` WRITE;
/*!40000 ALTER TABLE `saldos_puntos` DISABLE KEYS */;
INSERT INTO `saldos_puntos` VALUES (1,15,850,'2026-11-23 01:50:37');
/*!40000 ALTER TABLE `saldos_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `segmentos`
--

DROP TABLE IF EXISTS `segmentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `segmentos` (
  `id_segmento` int NOT NULL AUTO_INCREMENT,
  `id_negocio` int NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_segmento`),
  UNIQUE KEY `uq_segmento_negocio_nombre` (`id_negocio`,`nombre`),
  CONSTRAINT `fk_segmento_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `segmentos`
--

LOCK TABLES `segmentos` WRITE;
/*!40000 ALTER TABLE `segmentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `segmentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_negocio`
--

DROP TABLE IF EXISTS `solicitudes_negocio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_negocio` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `id_invitacion` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_negocio` int NOT NULL,
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `id_administrador_revisor` int DEFAULT NULL,
  `fecha_revision` datetime DEFAULT NULL,
  `motivo_revision` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  UNIQUE KEY `uq_solicitud_invitacion` (`id_invitacion`),
  UNIQUE KEY `uq_solicitud_negocio` (`id_negocio`),
  KEY `fk_solicitud_usuario` (`id_usuario`),
  KEY `fk_solicitud_revisor` (`id_administrador_revisor`),
  CONSTRAINT `fk_solicitud_invitacion` FOREIGN KEY (`id_invitacion`) REFERENCES `invitaciones_registro` (`id_invitacion`),
  CONSTRAINT `fk_solicitud_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `fk_solicitud_revisor` FOREIGN KEY (`id_administrador_revisor`) REFERENCES `administradores_plataforma` (`id_administrador`),
  CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `ck_solicitud_estado` CHECK ((`estado` in (_utf8mb4'pendiente',_utf8mb4'aprobada',_utf8mb4'rechazada')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_negocio`
--

LOCK TABLES `solicitudes_negocio` WRITE;
/*!40000 ALTER TABLE `solicitudes_negocio` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_negocio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `email_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_verificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'María','Gómez','maria.emp@email.com','12345',NULL,'2026-11-22 22:21:24','activo',0,NULL),(15,'Juan','Pérez','juan.cliente@email.com','12345',NULL,'2026-11-22 22:21:24','activo',0,NULL),(16,'Ana','López','ana.prueba@gopuntos.example','CUENTA_PRUEBA_SIN_LOGIN',NULL,'2026-11-23 01:54:55','activo',0,NULL),(17,'Carlos','Ruiz','carlos.prueba@gopuntos.example','CUENTA_PRUEBA_SIN_LOGIN',NULL,'2026-11-23 01:54:55','activo',0,NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_negocios`
--

DROP TABLE IF EXISTS `usuarios_negocios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_negocios` (
  `id_usuario_negocio` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_negocio` int NOT NULL,
  `id_rol` int NOT NULL,
  `fecha_asociacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_usuario_negocio`),
  UNIQUE KEY `uq_un_usuario_negocio` (`id_usuario`,`id_negocio`),
  KEY `fk_un_rol` (`id_rol`),
  KEY `idx_un_negocio_rol` (`id_negocio`,`id_rol`),
  CONSTRAINT `fk_un_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`),
  CONSTRAINT `fk_un_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `fk_un_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_negocios`
--

LOCK TABLES `usuarios_negocios` WRITE;
/*!40000 ALTER TABLE `usuarios_negocios` DISABLE KEYS */;
INSERT INTO `usuarios_negocios` VALUES (2,2,1,2,'2026-11-22 22:21:24','activo'),(15,15,1,3,'2026-11-22 22:21:24','activo'),(16,16,1,3,'2026-11-23 01:59:45','activo'),(17,17,1,3,'2026-11-23 01:59:45','activo');
/*!40000 ALTER TABLE `usuarios_negocios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_segmentos`
--

DROP TABLE IF EXISTS `usuarios_segmentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_segmentos` (
  `id_usuario_segmento` int NOT NULL AUTO_INCREMENT,
  `id_usuario_negocio` int NOT NULL,
  `id_segmento` int NOT NULL,
  `fecha_desde` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_hasta` datetime DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_usuario_segmento`),
  KEY `idx_us_un_activo` (`id_usuario_negocio`,`activo`),
  KEY `idx_us_segmento_activo` (`id_segmento`,`activo`),
  CONSTRAINT `fk_us_segmento` FOREIGN KEY (`id_segmento`) REFERENCES `segmentos` (`id_segmento`),
  CONSTRAINT `fk_us_un` FOREIGN KEY (`id_usuario_negocio`) REFERENCES `usuarios_negocios` (`id_usuario_negocio`),
  CONSTRAINT `ck_us_fechas` CHECK (((`fecha_hasta` is null) or (`fecha_hasta` >= `fecha_desde`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_segmentos`
--

LOCK TABLES `usuarios_segmentos` WRITE;
/*!40000 ALTER TABLE `usuarios_segmentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios_segmentos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23  2:03:29
