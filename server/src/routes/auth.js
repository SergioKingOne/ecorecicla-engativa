const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authService = require('../services/authService');
const requerido = require('../utils/requerido');

const router = Router();

const registerSchema = z.object({
  nombre: z
    .string(requerido('El nombre es obligatorio.'))
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(120, 'El nombre es demasiado largo.'),
  email: z
    .string(requerido('El correo es obligatorio.'))
    .trim()
    .email('El correo no es válido.')
    .max(160, 'El correo es demasiado largo.'),
  password: z
    .string(requerido('La contraseña es obligatoria.'))
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña es demasiado larga.'),
  barrio_aproximado: z.string().trim().max(120).optional().nullable(),
  upz_id: z.coerce.number().int().positive().optional().nullable(),
  autorizacion_datos: z.literal(true, {
    error:
      'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012) para crear tu cuenta.',
  }),
});

const loginSchema = z.object({
  email: z
    .string(requerido('El correo es obligatorio.'))
    .trim()
    .email('El correo no es válido.'),
  password: z.string(requerido('La contraseña es obligatoria.')).min(1, 'La contraseña es obligatoria.'),
});

router.post(
  '/registro',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.registerHousehold(req.body);
    res.status(201).json(result);
  }),
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
);

// RF-18: Ley 1581 — revoking the authorization deactivates the account.
router.delete(
  '/autorizacion',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.revokeAuthorization(req.user.id);
    res.json({
      mensaje:
        'Autorización revocada. Tu cuenta fue desactivada y tus datos dejarán de ser tratados.',
    });
  }),
);

module.exports = router;
