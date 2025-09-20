const User = require('../models/User');

// @desc    Crear nuevo usuario
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      telefono,
      rol,
      skills,
      ubicacion
    } = req.body;

    // Validar datos obligatorios
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email, contraseña y rol son obligatorios'
      });
    }

    // Validar coordenadas de ubicación si se proporcionan
    if (ubicacion && (!ubicacion.coordinates || ubicacion.coordinates.length !== 2)) {
      return res.status(400).json({
        success: false,
        message: 'Las coordenadas de ubicación deben ser [longitud, latitud]'
      });
    }

    // Crear nuevo usuario
    const userData = {
      nombre,
      email: email.toLowerCase(),
      password,
      telefono,
      rol,
      skills: skills || []
    };

    // Solo agregar ubicación si se proporciona
    if (ubicacion && ubicacion.coordinates) {
      userData.ubicacion = {
        type: 'Point',
        coordinates: ubicacion.coordinates
      };
    }

    const newUser = new User(userData);

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: newUser.toJSON()
      }
    });

  } catch (error) {
    console.error('Error en createUser:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario inválidos',
        errors
      });
    }

    // Manejar error de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Listar todos los usuarios
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      rol, 
      ubicacion,
      radio = 10 
    } = req.query;

    const query = {};

    // Filtrar por rol si se especifica
    if (rol && ['oferente', 'solicitante'].includes(rol)) {
      query.rol = rol;
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

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(finalQuery)
      .select('-password') // Excluir contraseñas
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ fechaRegistro: -1 });

    const total = await User.countDocuments(finalQuery);

    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar información del usuario
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir actualizar contraseña desde esta ruta
    if (updates.password) {
      delete updates.password;
    }

    // Limpiar y validar datos de entrada
    if (updates.nombre !== undefined) {
      updates.nombre = updates.nombre ? updates.nombre.trim() : '';
      if (!updates.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede estar vacío',
          field: 'nombre'
        });
      }
    }

    if (updates.telefono !== undefined && updates.telefono) {
      updates.telefono = updates.telefono.trim();
      if (updates.telefono === '') {
        updates.telefono = undefined; // Eliminar si está vacío
      }
    }

    if (updates.skills !== undefined) {
      if (Array.isArray(updates.skills)) {
        updates.skills = updates.skills
          .map(skill => skill ? skill.trim() : '')
          .filter(skill => skill !== ''); // Eliminar skills vacías
      }
    }

    // Validar que el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar y procesar ubicación si se proporciona
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

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: updatedUser.toJSON()
      }
    });

  } catch (error) {
    console.error('Error en updateUser:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario inválidos',
        errors
      });
    }

    // Manejar error de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cambiar contraseña del usuario
// @route   PUT /api/users/:id/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validar datos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    // Validar longitud de nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en changePassword:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
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

module.exports = {
  createUser,
  getUsers,
  updateUser,
  getUserById,
  changePassword
};

