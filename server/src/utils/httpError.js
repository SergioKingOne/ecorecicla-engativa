/** Error with an HTTP status code, handled by the centralized error handler. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
