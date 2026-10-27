const { z, ZodError } = require('zod');

// Default zod messages (those without a custom one) in Spanish, like the rest of the API.
z.config(z.locales.es());

/** Validates req[source] against a zod schema and replaces it with the parsed value. */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Datos inválidos.',
          detalles: error.issues.map((issue) => ({
            campo: issue.path.join('.') || source,
            mensaje: issue.message,
          })),
        });
      }
      return next(error);
    }
  };
}

module.exports = validate;
