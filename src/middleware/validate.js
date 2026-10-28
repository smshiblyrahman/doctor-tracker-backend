module.exports = function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: 'Please check the submitted data.',
        code: 'VALIDATION_ERROR',
        errors: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
    req.validated = req.validated || {};
    req.validated[source] = result.data;
    return next();
  };
};
