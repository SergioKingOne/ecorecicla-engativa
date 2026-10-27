const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const wasteService = require('../services/wasteService');
const pointService = require('../services/pointService');
const routeService = require('../services/routeService');
const adminService = require('../services/adminService');
const requerido = require('../utils/requerido');

// RF-17: admin panel — catalog, points and routes CRUD + org verification.
const router = Router();
router.use(authenticate, requireRole('admin'));

function parseId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El identificador no es válido.' });
  }
  req.resourceId = id;
  return next();
}

// ---- Residuos ----

const residuoSchema = z.object({
  nombre: z.string(requerido('El nombre es obligatorio.')).trim().min(2).max(120),
  categoria_id: z.coerce.number(requerido('La categoría es obligatoria.')).int().positive(),
  preparacion_previa: z
    .string(requerido('La preparación previa es obligatoria.'))
    .trim()
    .min(3, 'Describe la preparación previa.'),
  error_frecuente: z
    .string(requerido('El error frecuente es obligatorio.'))
    .trim()
    .min(3, 'Describe el error frecuente.'),
  sinonimos: z.array(z.string().trim().min(1)).optional(),
});

router.post(
  '/residuos',
  validate(residuoSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await wasteService.createResiduo(req.body));
  }),
);

router.put(
  '/residuos/:id',
  parseId,
  validate(residuoSchema),
  asyncHandler(async (req, res) => {
    res.json(await wasteService.updateResiduo(req.resourceId, req.body));
  }),
);

router.delete(
  '/residuos/:id',
  parseId,
  asyncHandler(async (req, res) => {
    await wasteService.deleteResiduo(req.resourceId);
    res.status(204).end();
  }),
);

// ---- Puntos de reciclaje ----

const puntoSchema = z.object({
  nombre: z.string(requerido('El nombre es obligatorio.')).trim().min(2).max(160),
  tipo: z.enum(['punto', 'estacion', 'chatarreria'], {
    error: 'El tipo debe ser punto, estacion o chatarreria.',
  }),
  lat: z.coerce.number(requerido('La latitud es obligatoria.')).min(-90).max(90),
  lng: z.coerce.number(requerido('La longitud es obligatoria.')).min(-180).max(180),
  direccion: z.string().trim().max(200).optional().nullable(),
  materiales_aceptados: z.array(z.string().trim().min(1)).optional(),
  horario: z.string().trim().max(160).optional().nullable(),
});

router.post(
  '/puntos',
  validate(puntoSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await pointService.createPunto(req.body));
  }),
);

router.put(
  '/puntos/:id',
  parseId,
  validate(puntoSchema),
  asyncHandler(async (req, res) => {
    res.json(await pointService.updatePunto(req.resourceId, req.body));
  }),
);

router.delete(
  '/puntos/:id',
  parseId,
  asyncHandler(async (req, res) => {
    await pointService.deletePunto(req.resourceId);
    res.status(204).end();
  }),
);

// ---- Rutas de recolección ----

const rutaSchema = z.object({
  upz_id: z.coerce.number(requerido('La UPZ es obligatoria.')).int().positive(),
  dia_semana: z.string(requerido('El día es obligatorio.')).trim().min(3).max(15),
  franja_horaria: z.string(requerido('La franja horaria es obligatoria.')).trim().min(3).max(60),
  operador: z.string().trim().max(120).optional().nullable(),
});

router.post(
  '/rutas',
  validate(rutaSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await routeService.createRuta(req.body));
  }),
);

router.put(
  '/rutas/:id',
  parseId,
  validate(rutaSchema),
  asyncHandler(async (req, res) => {
    res.json(await routeService.updateRuta(req.resourceId, req.body));
  }),
);

router.delete(
  '/rutas/:id',
  parseId,
  asyncHandler(async (req, res) => {
    await routeService.deleteRuta(req.resourceId);
    res.status(204).end();
  }),
);

// ---- Organizaciones y recicladores (RF-11) ----

router.get(
  '/organizaciones',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.listOrganizaciones());
  }),
);

router.patch(
  '/organizaciones/:id/verificar',
  parseId,
  asyncHandler(async (req, res) => {
    res.json(await adminService.verifyOrganizacion(req.resourceId));
  }),
);

const recicladorSchema = z.object({
  nombre: z.string(requerido('El nombre es obligatorio.')).trim().min(3).max(120),
  email: z.string(requerido('El correo es obligatorio.')).trim().email('El correo no es válido.'),
  password: z
    .string(requerido('La contraseña es obligatoria.'))
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  organizacion_id: z.coerce.number(requerido('La organización es obligatoria.')).int().positive(),
  upz_cobertura: z
    .array(z.coerce.number().int().positive(), requerido('Indica las UPZ de cobertura.'))
    .min(1, 'Indica al menos una UPZ de cobertura.'),
});

router.post(
  '/recicladores',
  validate(recicladorSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.createReciclador(req.body));
  }),
);

module.exports = router;
