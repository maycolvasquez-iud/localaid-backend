const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Crear nuevo servicio
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      categoria,
      ubicacion,
      precio,
      moneda,
      duracionEstimada,
      unidadDuracion
    } = req.body;

    // Validar datos obligatorios
    if (!titulo || !descripcion || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Título, descripción y categoría son obligatorios'
      });
    }

    // Validar coordenadas de ubicación si se proporcionan
    if (ubicacion && (!ubicacion.coordinates || ubicacion.coordinates.length !== 2)) {
      return res.status(400).json({
        success: false,
        message: 'Las coordenadas de ubicación deben ser [longitud, latitud]'
      });
    }

    // Crear nuevo servicio
    const serviceData = {
      titulo,
      descripcion,
      categoria,
      creadoPor: req.user._id, // Usuario autenticado
      precio: precio || 0,
      moneda: moneda || 'MXN',
      duracionEstimada: duracionEstimada || 1,
      unidadDuracion: unidadDuracion || 'horas'
    };

    // Solo agregar ubicación si se proporciona
    if (ubicacion && ubicacion.coordinates) {
      serviceData.ubicacion = {
        type: 'Point',
        coordinates: ubicacion.coordinates
      };
    }

    const newService = new Service(serviceData);

    await newService.save();

    // Populate con información del creador
    await newService.populate('creadoPor', 'nombre email telefono rol');

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: {
        service: newService
      }
    });

  } catch (error) {
    console.error('Error en createService:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de servicio inválidos',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Listar todos los servicios
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoria, 
      estado,
      ubicacion,
      radio = 10,
      ordenarPor = 'fechaPublicacion',
      orden = 'desc'
    } = req.query;

    const query = {};

    // Filtrar por categoría si se especifica
    if (categoria) {
      query.categoria = categoria;
    }

    // Filtrar por estado si se especifica
    if (estado && ['pendiente', 'en progreso', 'completado'].includes(estado)) {
      query.estado = estado;
    }

    // Construir consulta geográfica si se proporciona ubicación
    let geoQuery = {};
    if (ubicacion) {
      try {
        const [longitud, latitud] = ubicacion.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(longitud) && !isNaN(latitud)) {
          geoQuery = {
            ubicacion: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [longitud, latitud]
                },
                $maxDistance: radio * 1000 // Convertir km a metros
              }
            }
          };
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Formato de ubicación inválido. Use: longitud,latitud'
        });
      }
    }

    // Combinar consultas
    const finalQuery = { ...query, ...geoQuery };

    // Configurar ordenamiento
    const sortOrder = orden === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[ordenarPor] = sortOrder;

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const services = await Service.find(finalQuery)
      .populate('creadoPor', 'nombre email telefono rol ubicacion')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Service.countDocuments(finalQuery);

    res.status(200).json({
      success: true,
      message: 'Servicios obtenidos exitosamente',
      data: {
        services,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalServices: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          categoria,
          estado,
          ubicacion,
          radio: parseInt(radio)
        }
      }
    });

  } catch (error) {
    console.error('Error en getServices:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener servicio por ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate('creadoPor', 'nombre email telefono rol ubicacion');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Servicio obtenido exitosamente',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Error en getServiceById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar servicio
// @route   PUT /api/services/:id
// @access  Private (Solo el creador)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Buscar el servicio
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar que el usuario sea el creador del servicio
    if (service.creadoPor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este servicio'
      });
    }

    // Verificar que el servicio pueda ser editado
    if (!service.puedeSerEditado()) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden editar servicios en estado pendiente'
      });
    }

    // Validar y procesar ubicación si se proporciona en la actualización
    if (updates.ubicacion) {
      // Si se envía ubicación vacía o nula, eliminar la ubicación
      if (!updates.ubicacion.coordinates || 
          updates.ubicacion.coordinates.length === 0 ||
          (updates.ubicacion.coordinates[0] === null && updates.ubicacion.coordinates[1] === null)) {
        updates.ubicacion = undefined;
      } else if (updates.ubicacion.coordinates && updates.ubicacion.coordinates.length === 2) {
        // Validar coordenadas válidas
        const [longitud, latitud] = updates.ubicacion.coordinates;
        if (isNaN(longitud) || isNaN(latitud) || 
            longitud < -180 || longitud > 180 || 
            latitud < -90 || latitud > 90) {
          return res.status(400).json({
            success: false,
            message: 'Las coordenadas deben ser [longitud, latitud] válidas'
          });
        }
        // Formatear ubicación correctamente
        updates.ubicacion = {
          type: 'Point',
          coordinates: [parseFloat(longitud), parseFloat(latitud)]
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Las coordenadas deben ser [longitud, latitud]'
        });
      }
    }

    // Actualizar servicio
    const updatedService = await Service.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('creadoPor', 'nombre email telefono rol');

    res.status(200).json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: {
        service: updatedService
      }
    });

  } catch (error) {
    console.error('Error en updateService:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de servicio inválidos',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cambiar estado del servicio
// @route   PATCH /api/services/:id/estado
// @access  Private (Solo el creador)
const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    // Validar nuevo estado
    if (!['pendiente', 'en progreso', 'completado'].includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: pendiente, en progreso o completado'
      });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar que el usuario sea el creador del servicio
    if (service.creadoPor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este servicio'
      });
    }

    // Cambiar estado según la lógica de negocio
    if (nuevoEstado === 'en progreso' && service.estado === 'pendiente') {
      await service.marcarEnProgreso();
    } else if (nuevoEstado === 'completado' && service.estado === 'en progreso') {
      await service.marcarCompletado();
    } else if (nuevoEstado === 'pendiente' && service.estado === 'en progreso') {
      service.estado = 'pendiente';
      await service.save();
    } else {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de estado "${service.estado}" a "${nuevoEstado}"`
      });
    }

    await service.populate('creadoPor', 'nombre email telefono rol');

    res.status(200).json({
      success: true,
      message: `Estado del servicio cambiado a "${nuevoEstado}"`,
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Error en updateServiceStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  updateServiceStatus
};

