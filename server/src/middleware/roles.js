/** Role-based access guard. Use after `authenticate`. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta operación.' });
    }
    return next();
  };
}

module.exports = requireRole;
