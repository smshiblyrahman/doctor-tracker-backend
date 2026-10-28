function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (process.env.NODE_ENV !== 'production') console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Please check the submitted fields.', code: 'VALIDATION_ERROR' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'The supplied identifier or value is invalid.', code: 'INVALID_VALUE' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with this unique value already exists.', code: 'DUPLICATE_RECORD' });
  }
  const status = Number.isInteger(err.status) ? err.status : 500;
  return res.status(status).json({
    message: status >= 500 ? 'An unexpected server error occurred.' : err.message,
    code: err.code || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR'),
  });
}

module.exports = errorHandler;
