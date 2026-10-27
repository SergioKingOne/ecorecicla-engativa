const { Router } = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const wasteService = require('../services/wasteService');
const requerido = require('../utils/requerido');

const router = Router();

const searchSchema = z.object({
  buscar: z.string().trim().max(120).optional(),
  categoria: z.coerce.number().int().positive().optional(),
});

const suggestionSchema = z.object({
  nombre: z
    .string(requerido('El nombre del residuo es obligatorio.'))
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre es demasiado largo.'),
  descripcion: z.string().trim().max(300, 'La descripción es demasiado larga.').optional().nullable(),
});

// RF-01/RF-02: public search by name or synonym, optional category filter.
router.get(
  '/',
  validate(searchSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { buscar, categoria } = req.query;
    const result = await wasteService.searchResiduos({ buscar, categoriaId: categoria });
    res.json(result);
  }),
);

// RF-01: "sugerir residuo" form when the search finds nothing.
router.post(
  '/sugerencias',
  validate(suggestionSchema),
  asyncHandler(async (req, res) => {
    const suggestion = await wasteService.createSuggestion(req.body);
    res.status(201).json({
      mensaje: '¡Gracias! Revisaremos tu sugerencia para incluirla en la guía.',
      sugerencia: suggestion,
    });
  }),
);

// RF-03: public waste detail (ficha).
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'El identificador del residuo no es válido.' });
    }
    const residuo = await wasteService.getResiduo(id);
    res.json(residuo);
  }),
);

module.exports = router;
