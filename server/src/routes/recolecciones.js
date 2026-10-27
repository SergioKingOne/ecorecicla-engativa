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
  solicitud_id: z.coerce
    .number(requerido('La solicitud es obligatoria.'))
    .int()
    .positive('La solicitud no es válida.'),
  peso_kg: z.coerce
    .number(requerido('El peso es obligatorio.'))
    .positive('El peso debe ser mayor que 0.')
    .max(1000, 'El peso máximo es 1000 kg.'),
  tipo_material: z
    .string(requerido('El tipo de material es obligatorio.'))
    .trim()
    .min(3, 'Describe el tipo de material recolectado.')
    .max(160),
});

// RF-14: confirm a completed pickup with the real weight.
router.post(
  '/',
  authenticate,
  requireRole('reciclador'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const recoleccion = await collectionService.createRecoleccion(req.user.id, req.body);
    res.status(201).json(recoleccion);
  }),
);

/**
 * RF-14: RECOLECCION is an immutable record (it backs remuneration under
 * Decreto 596 de 2016). Any mutating verb is explicitly rejected with 405.
 */
function rejectMutation(_req, res) {
  res
    .set('Allow', 'POST')
    .status(405)
    .json({
      error:
        'La recolección es un registro inmutable: no puede modificarse ni eliminarse (Decreto 596 de 2016).',
    });
}

router.put(['/', '/:id'], rejectMutation);
router.patch(['/', '/:id'], rejectMutation);
router.delete(['/', '/:id'], rejectMutation);

module.exports = router;
