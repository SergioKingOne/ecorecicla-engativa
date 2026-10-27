const { Router } = require('express');
const auth = require('./auth');
const residuos = require('./residuos');
const { categorias, puntos, rutas, upz, organizaciones } = require('./catalog');
const solicitudes = require('./solicitudes');
const recolecciones = require('./recolecciones');
const hogares = require('./hogares');
const calificaciones = require('./calificaciones');
const admin = require('./admin');

const router = Router();

router.get('/salud', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'EcoRecicla Engativá API' });
});

router.use('/auth', auth);
router.use('/residuos', residuos);
router.use('/categorias', categorias);
router.use('/puntos', puntos);
router.use('/rutas', rutas);
router.use('/upz', upz);
router.use('/organizaciones', organizaciones);
router.use('/solicitudes', solicitudes);
router.use('/recolecciones', recolecciones);
router.use('/hogares', hogares);
router.use('/calificaciones', calificaciones);
router.use('/admin', admin);

module.exports = router;
