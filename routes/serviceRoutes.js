const express = require('express');
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  updateServiceStatus
} = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         titulo:
 *           type: string
 *           example: "Reparación de grifo"
 *         descripcion:
 *           type: string
 *           example: "Necesito reparar un grifo que gotea en mi cocina"
 *         categoria:
 *           type: string
 *           enum: [hogar, jardineria, limpieza, reparaciones, transporte, tecnologia, educacion, salud, deportes, eventos, otro]
 *           example: "reparaciones"
 *         estado:
 *           type: string
 *           enum: [pendiente, en progreso, completado]
 *           example: "pendiente"
 *         creadoPor:
 *           $ref: '#/components/schemas/User'
 *         ubicacion:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [-99.1332, 19.4326]
 *         fechaPublicacion:
 *           type: string
 *           format: date-time
 *         precio:
 *           type: number
 *           example: 150
 *         moneda:
 *           type: string
 *           enum: [MXN, USD, EUR]
 *           example: "MXN"
 *         duracionEstimada:
 *           type: number
 *           example: 2
 *         unidadDuracion:
 *           type: string
 *           enum: [horas, dias, semanas]
 *           example: "horas"
 *     CreateServiceRequest:
 *       type: object
 *       required:
 *         - titulo
 *         - descripcion
 *         - categoria
 *         - ubicacion
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Reparación de grifo"
 *         descripcion:
 *           type: string
 *           example: "Necesito reparar un grifo que gotea en mi cocina"
 *         categoria:
 *           type: string
 *           enum: [hogar, jardineria, limpieza, reparaciones, transporte, tecnologia, educacion, salud, deportes, eventos, otro]
 *           example: "reparaciones"
 *         ubicacion:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [-99.1332, 19.4326]
 *         precio:
 *           type: number
 *           example: 150
 *         moneda:
 *           type: string
 *           enum: [MXN, USD, EUR]
 *           example: "MXN"
 *         duracionEstimada:
 *           type: number
 *           example: 2
 *         unidadDuracion:
 *           type: string
 *           enum: [horas, dias, semanas]
 *           example: "horas"
 */

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Crear nuevo servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceRequest'
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       $ref: '#/components/schemas/Service'
 *       400:
 *         description: Datos faltantes o inválidos
 *       401:
 *         description: Token de autenticación requerido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authenticateToken, createService);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar servicios
 *     tags: [Servicios]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Servicios por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [hogar, jardineria, limpieza, reparaciones, transporte, tecnologia, educacion, salud, deportes, eventos, otro]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en progreso, completado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: string
 *           example: "-99.1332,19.4326"
 *         description: Ubicación para búsqueda geográfica (longitud,latitud)
 *       - in: query
 *         name: radio
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Radio de búsqueda en kilómetros
 *       - in: query
 *         name: ordenarPor
 *         schema:
 *           type: string
 *           default: fechaPublicacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de servicios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     services:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Service'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalServices:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *       400:
 *         description: Parámetros de consulta inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obtener servicio por ID
 *     tags: [Servicios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       $ref: '#/components/schemas/Service'
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', getServiceById);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Actualizar servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               precio:
 *                 type: number
 *               duracionEstimada:
 *                 type: number
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       $ref: '#/components/schemas/Service'
 *       400:
 *         description: Datos inválidos o servicio no editable
 *       401:
 *         description: Token de autenticación requerido
 *       403:
 *         description: Sin permisos para editar este servicio
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', authenticateToken, updateService);

/**
 * @swagger
 * /api/services/{id}/estado:
 *   patch:
 *     summary: Cambiar estado del servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nuevoEstado:
 *                 type: string
 *                 enum: [pendiente, en progreso, completado]
 *                 example: "en progreso"
 *     responses:
 *       200:
 *         description: Estado del servicio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       $ref: '#/components/schemas/Service'
 *       400:
 *         description: Estado inválido o transición no permitida
 *       401:
 *         description: Token de autenticación requerido
 *       403:
 *         description: Sin permisos para cambiar el estado
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/estado', authenticateToken, updateServiceStatus);

module.exports = router;

