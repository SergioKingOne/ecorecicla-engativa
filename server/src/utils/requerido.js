/**
 * zod 4 dropped `required_error`: returns the `error` param that shows `message`
 * only when the field is missing and keeps zod's default message otherwise.
 */
function requerido(message) {
  return { error: (issue) => (issue.input === undefined ? message : undefined) };
}

module.exports = requerido;
