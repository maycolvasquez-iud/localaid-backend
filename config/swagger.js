const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LOCALAID API',
      version: '1.0.0',
      description: 'API para la plataforma LOCALAID - Conectando servicios locales',
      contact: {
        name: 'LOCALAID Team',
        email: 'contacto@localaid.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.localaid.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint de login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d0fe4f5311236168a109ca'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@ejemplo.com'
            },
            telefono: {
              type: 'string',
              example: '+52 55 1234 5678'
            },
            rol: {
              type: 'string',
              enum: ['oferente', 'solicitante'],
              example: 'oferente'
            },
            skills: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['plomería', 'electricidad']
            },
            ubicacion: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'Point'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number'
                  },
                  example: [-99.1332, 19.4326]
                }
              }
            },
            fechaRegistro: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d0fe4f5311236168a109cb'
            },
            titulo: {
              type: 'string',
              example: 'Reparación de grifo'
            },
            descripcion: {
              type: 'string',
              example: 'Necesito reparar un grifo que gotea en mi cocina'
            },
            categoria: {
              type: 'string',
              enum: ['hogar', 'jardineria', 'limpieza', 'reparaciones', 'transporte', 'tecnologia', 'educacion', 'salud', 'deportes', 'eventos', 'otro'],
              example: 'reparaciones'
            },
            estado: {
              type: 'string',
              enum: ['pendiente', 'en progreso', 'completado'],
              example: 'pendiente'
            },
            creadoPor: {
              $ref: '#/components/schemas/User'
            },
            ubicacion: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'Point'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number'
                  },
                  example: [-99.1332, 19.4326]
                }
              }
            },
            fechaPublicacion: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z'
            },
            precio: {
              type: 'number',
              example: 150
            },
            moneda: {
              type: 'string',
              enum: ['MXN', 'USD', 'EUR'],
              example: 'MXN'
            },
            duracionEstimada: {
              type: 'number',
              example: 2
            },
            unidadDuracion: {
              type: 'string',
              enum: ['horas', 'dias', 'semanas'],
              example: 'horas'
            }
          }
        }
      }
    },
    tags: [
      {
        name: "Usuarios",
        description: "Endpoints para gestión de usuarios"
      },
      {
        name: "Autenticación",
        description: "Endpoints para autenticación y autorización"
      },
      {
        name: "Servicios",
        description: "Endpoints para gestión de servicios"
      }
    ]
  },
  apis: [
    './routes/*.js', // Rutas donde están definidos los endpoints
    './controllers/*.js' // Controladores con comentarios JSDoc
  ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
