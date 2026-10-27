const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const requestService = require('../services/requestService');
const requerido = require('../utils/requerido');

const router = Router();
router.use(authenticate);

const detalleSchema = z.object({
  categoria_id: z.coerce
    .number(requerido('La categoría es obligatoria.'))
    .int()
    .positive('La categoría no es válida.'),
  tamano_bolsa: z.enum(['pequena', 'mediana', 'grande'], {
    error: 'El tamaño de bolsa debe ser pequeña (~2 kg), mediana (~5 kg) o grande (~10 kg).',
  }),
  cantidad: z.coerce
    .number(requerido('La cantidad es obligatoria.'))
    .int('La cantidad debe ser un número entero.')
    .min(1, 'La cantidad mínima es 1.')
    .max(50, 'La cantidad máxima es 50.'),
});

const createSchema = z.object({
  fecha_solicitada: z
    .string(requerido('La fecha es obligatoria.'))
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.'),
  franja_disponibilidad: z
    .string(requerido('La franja de disponibilidad es obligatoria.'))
    .trim()
    .min(3, 'Indica una franja de disponibilidad.')
    .max(60),
  nota_acceso: z.string().trim().max(300, 'La nota es demasiado larga.').optional().nullable(),
  detalles: z
    .array(detalleSchema, requerido('Debes indicar al menos un material.'))
    .min(1, 'Debes indicar al menos un material.'),
});

const estadoSchema = z.object({
  estado: z.enum(['aceptada', 'reprogramada', 'rechazada'], {
    error: 'El estado debe ser aceptada, reprogramada o rechazada.',
  }),
  fecha_solicitada: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.')
    .optional()
    .nullable(),
});

// RF-12: create a pickup request (household).
router.post(
  '/',
  requireRole('hogar'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const solicitud = await requestService.createSolicitud(req.user.id, req.body);
    res.status(201).json(solicitud);
  }),
);

router.get(
  '/mias',
  requireRole('hogar'),
  asyncHandler(async (req, res) => {
    res.json(await requestService.listMine(req.user.id));
  }),
);

// RF-13: zone requests (reciclador).
router.get(
  '/zona',
  requireRole('reciclador'),
  asyncHandler(async (req, res) => {
    res.json(await requestService.listZone(req.user.id));
  }),
);

// RF-13: accept / reschedule / reject.
router.patch(
  '/:id/estado',
  requireRole('reciclador'),
  validate(estadoSchema),
  asyncHandler(async (req, res) => {
    const solicitud = await requestService.updateEstado(req.user.id, Number(req.params.id), req.body);
    res.json(solicitud);
  }),
);

router.patch(
  '/:id/cancelar',
  requireRole('hogar'),
  asyncHandler(async (req, res) => {
    const solicitud = await requestService.cancel(req.user.id, Number(req.params.id));
    res.json(solicitud);
  }),
);

module.exports = router;
