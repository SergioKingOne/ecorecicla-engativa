const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const collectionService = require('../services/collectionService');

const router = Router();

// RF-15: history of pickups with accumulated recovered kilograms.
router.get(
  '/historial',
  authenticate,
  requireRole('hogar'),
  asyncHandler(async (req, res) => {
    res.json(await collectionService.getHistorial(req.user.id));
  }),
);

module.exports = router;
