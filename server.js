const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpecs = require('./config/swagger');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://localaid.com', 'https://www.localaid.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LOCALAID API Documentation'
}));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '¡Bienvenido a LOCALAID API!',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      users: '/api/users',
      auth: '/api/auth',
      services: '/api/services'
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /',
      'GET /api-docs',
      'POST /api/users',
      'GET /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/services',
      'GET /api/services',
      'GET /api/services/:id',
      'PUT /api/services/:id',
      'PATCH /api/services/:id/estado'
    ]
  });
});

// Middleware para manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`
🚀 LOCALAID API Server iniciado
📍 Puerto: ${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
📚 Documentación: http://localhost:${PORT}/api-docs
🔗 API Base: http://localhost:${PORT}/api
📊 Estado: Conectado a MongoDB Atlas
⏰ Iniciado: ${new Date().toLocaleString('es-ES')}
  `);
});

module.exports = app;

