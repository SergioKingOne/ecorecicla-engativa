const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const collectionService = require('../services/collectionService');
const requerido = require('../utils/requerido');

const router = Router();

const createSchema = z.object({
  recoleccion_id: z.coerce
    .number(requerido('La recolección es obligatoria.'))
    .int()
    .positive('La recolección no es válida.'),
  estrellas: z.coerce
    .number(requerido('La calificación es obligatoria.'))
    .int('La calificación debe ser un número entero.')
    .min(1, 'La calificación mínima es 1 estrella.')
    .max(5, 'La calificación máxima es 5 estrellas.'),
  comentario: z.string().trim().max(500, 'El comentario es demasiado largo.').optional().nullable(),
});

// RF-16: rate the service (1–5 stars + optional comment).
router.post(
  '/',
  authenticate,
  requireRole('hogar'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const calificacion = await collectionService.createCalificacion(req.user.id, req.body);
    res.status(201).json(calificacion);
  }),
);

module.exports = router;
