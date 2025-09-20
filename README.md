# LOCALAID Backend API

Backend completo para la plataforma LOCALAID - Conectando servicios locales.

## 🚀 Características

- **Node.js + Express**: Framework web robusto y escalable
- **MongoDB Atlas**: Base de datos en la nube con Mongoose ODM
- **Autenticación JWT**: Sistema seguro de autenticación
- **Bcryptjs**: Encriptación segura de contraseñas
- **Swagger**: Documentación interactiva de la API
- **Búsqueda Geográfica**: Índices 2dsphere para ubicaciones
- **Validación de Datos**: Esquemas robustos con Mongoose
- **Manejo de Errores**: Respuestas consistentes y logging

## 📋 Requisitos

- Node.js (v14 o superior)
- npm o yarn
- MongoDB Atlas (conexión configurada)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd localaid-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar el archivo de ejemplo
   cp env.example .env
   
   # Editar el archivo .env con tus valores
   nano .env
   ```

4. **Variables de entorno requeridas**
   ```env
   MONGO_URI=mongodb+srv://localaid:12345@cluster0.zjtlmrs.mongodb.net/localaid
   PORT=3000
   JWT_SECRET=localaid_jwt_secret_key_2024
   NODE_ENV=development
   ```

5. **Iniciar el servidor**
   ```bash
   # Modo desarrollo (con nodemon)
   npm run dev
   
   # Modo producción
   npm start
   ```

## 📚 Documentación de la API

Una vez iniciado el servidor, la documentación interactiva estará disponible en:

**http://localhost:3000/api-docs**

## 🔗 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario

### Servicios
- `POST /api/services` - Crear servicio
- `GET /api/services` - Listar servicios
- `GET /api/services/:id` - Obtener servicio por ID
- `PUT /api/services/:id` - Actualizar servicio
- `PATCH /api/services/:id/estado` - Cambiar estado

## 🏗️ Arquitectura del Proyecto

```
localaid-backend/
├── server.js                 # Punto de entrada principal
├── package.json              # Dependencias y scripts
├── env.example               # Variables de entorno de ejemplo
├── config/
│   ├── db.js                 # Configuración de MongoDB
│   └── swagger.js            # Configuración de Swagger
├── models/
│   ├── User.js               # Modelo de Usuario
│   └── Service.js            # Modelo de Servicio
├── controllers/
│   ├── userController.js     # Lógica de usuarios
│   ├── authController.js     # Lógica de autenticación
│   └── serviceController.js  # Lógica de servicios
├── routes/
│   ├── userRoutes.js         # Rutas de usuarios
│   ├── authRoutes.js         # Rutas de autenticación
│   └── serviceRoutes.js      # Rutas de servicios
└── middleware/
    └── auth.js               # Middleware de autenticación
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Registro**: `POST /api/users`
2. **Login**: `POST /api/auth/login`
3. **Uso del token**: Incluir en header `Authorization: Bearer <token>`

## 🌍 Búsqueda Geográfica

Los endpoints soportan búsqueda geográfica usando parámetros de query:

```
GET /api/services?ubicacion=-99.1332,19.4326&radio=10
```

- `ubicacion`: Longitud,Latitud
- `radio`: Radio en kilómetros

## 📊 Modelos de Datos

### Usuario
- **Información personal**: nombre, email, teléfono
- **Rol**: oferente | solicitante
- **Skills**: array de habilidades
- **Ubicación**: coordenadas geográficas
- **Seguridad**: contraseña encriptada

### Servicio
- **Información básica**: título, descripción, categoría
- **Estado**: pendiente | en progreso | completado
- **Ubicación**: coordenadas geográficas
- **Creador**: referencia al usuario
- **Precio y duración**: información económica

## 🚦 Estados de Respuesta

Todas las respuestas siguen un formato consistente:

```json
{
  "success": true|false,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "error": "Detalle del error (solo en desarrollo)"
}
```

## 🧪 Testing

Para probar la API puedes usar:

1. **Swagger UI**: http://localhost:3000/api-docs
2. **Postman**: Importar desde Swagger
3. **curl**: Ejemplos en la documentación

### Ejemplo de creación de usuario:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "123456",
    "rol": "oferente",
    "ubicacion": {
      "coordinates": [-99.1332, 19.4326]
    }
  }'
```

## 🔧 Scripts Disponibles

```bash
npm run dev    # Iniciar en modo desarrollo (nodemon)
npm start      # Iniciar en modo producción
```

## 🌟 Características Avanzadas

- **Paginación**: Todos los endpoints de listado soportan paginación
- **Filtros**: Búsqueda por categoría, estado, rol, etc.
- **Ordenamiento**: Múltiples campos de ordenamiento
- **Validación**: Esquemas robustos con mensajes en español
- **Índices**: Optimización de consultas con índices de MongoDB
- **Logging**: Registro detallado de requests y errores
- **CORS**: Configuración para desarrollo y producción

## 🚨 Manejo de Errores

- Validación de datos con mensajes descriptivos
- Manejo de errores de base de datos
- Respuestas consistentes de error
- Logging detallado para debugging

## 📝 Notas de Desarrollo

- Las contraseñas se encriptan automáticamente antes de guardar
- Los tokens JWT expiran en 7 días
- Los índices 2dsphere permiten búsquedas geográficas eficientes
- La documentación Swagger se genera automáticamente

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: contacto@localaid.com
- Documentación: http://localhost:3000/api-docs

---

**¡Desarrollado con ❤️ para LOCALAID!**

