const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const wasteService = require('../services/wasteService');
const pointService = require('../services/pointService');
const routeService = require('../services/routeService');
const adminService = require('../services/adminService');
const requerido = require('../utils/requerido');

/**
 * Public read-only catalog endpoints: /categorias, /puntos, /rutas, /upz,
 * plus the public registration of organizations (RF-11).
 */
const categorias = Router();
const puntos = Router();
const rutas = Router();
const upz = Router();
const organizaciones = Router();

categorias.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await wasteService.listCategorias());
  }),
);

const puntosQuerySchema = z.object({
  material: z.string().trim().max(80).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

// RF-05/RF-06: points ordered by distance, optional material filter.
puntos.get(
  '/',
  validate(puntosQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { material, lat, lng } = req.query;
    res.json(await pointService.listPuntos({ material, lat, lng }));
  }),
);

const rutasQuerySchema = z.object({
  upz: z.coerce.number().int().positive().optional(),
});

// RF-08: collection route by UPZ.
rutas.get(
  '/',
  validate(rutasQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await routeService.listRutas(req.query.upz));
  }),
);

upz.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await routeService.listUpz());
  }),
);

const organizacionSchema = z.object({
  nombre: z
    .string(requerido('El nombre de la organización es obligatorio.'))
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(160),
  nit: z
    .string(requerido('El NIT es obligatorio.'))
    .trim()
    .min(5, 'El NIT no es válido.')
    .max(20),
  telefono: z.string().trim().max(20).optional().nullable(),
});

// RF-11: an organization applies for registration; the admin verifies it later.
organizaciones.post(
  '/',
  validate(organizacionSchema),
  asyncHandler(async (req, res) => {
    const organizacion = await adminService.createOrganizacion(req.body);
    res.status(201).json({
      mensaje: 'Solicitud registrada. Un administrador verificará la organización.',
      organizacion,
    });
  }),
);

module.exports = { categorias, puntos, rutas, upz, organizaciones };
