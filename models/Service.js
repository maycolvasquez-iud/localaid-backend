const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true,
    enum: {
      values: [
        'hogar', 
        'jardineria', 
        'limpieza', 
        'reparaciones', 
        'transporte', 
        'tecnologia', 
        'educacion', 
        'salud', 
        'deportes', 
        'eventos', 
        'otro'
      ],
      message: 'Categoría no válida'
    }
  },
  estado: {
    type: String,
    required: [true, 'El estado es obligatorio'],
    enum: {
      values: ['pendiente', 'en progreso', 'completado'],
      message: 'El estado debe ser "pendiente", "en progreso" o "completado"'
    },
    default: 'pendiente'
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador es obligatorio']
  },
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false,
      validate: {
        validator: function(coords) {
          if (!coords || coords.length === 0) return true; // Permitir coordenadas vacías
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Las coordenadas deben ser [longitud, latitud] válidas'
      }
    }
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now
  },
  precio: {
    type: Number,
    min: [0, 'El precio no puede ser negativo'],
    default: 0
  },
  moneda: {
    type: String,
    default: 'MXN',
    enum: ['MXN', 'USD', 'EUR']
  },
  duracionEstimada: {
    type: Number,
    min: [1, 'La duración debe ser al menos 1 hora'],
    default: 1
  },
  unidadDuracion: {
    type: String,
    default: 'horas',
    enum: ['horas', 'dias', 'semanas']
  }
}, {
  timestamps: true
});

// Índice 2dsphere para búsquedas geográficas
serviceSchema.index({ ubicacion: '2dsphere' });

// Índices para mejorar consultas
serviceSchema.index({ categoria: 1 });
serviceSchema.index({ estado: 1 });
serviceSchema.index({ creadoPor: 1 });
serviceSchema.index({ fechaPublicacion: -1 });

// Virtual para obtener la fecha de publicación formateada
serviceSchema.virtual('fechaPublicacionFormateada').get(function() {
  return this.fechaPublicacion.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Método para verificar si el servicio puede ser editado
serviceSchema.methods.puedeSerEditado = function() {
  return this.estado === 'pendiente';
};

// Método para marcar como en progreso
serviceSchema.methods.marcarEnProgreso = function() {
  if (this.estado === 'pendiente') {
    this.estado = 'en progreso';
    return this.save();
  }
  throw new Error('Solo se pueden marcar servicios pendientes como en progreso');
};

// Método para marcar como completado
serviceSchema.methods.marcarCompletado = function() {
  if (this.estado === 'en progreso') {
    this.estado = 'completado';
    return this.save();
  }
  throw new Error('Solo se pueden marcar servicios en progreso como completados');
};

module.exports = mongoose.model('Service', serviceSchema);

