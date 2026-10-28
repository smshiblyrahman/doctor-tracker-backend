function httpError(message, status = 400, code = 'INVALID_QUERY') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function parsePagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw httpError('page must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw httpError('limit must be an integer between 1 and 50.');
  return { page, limit, skip: (page - 1) * limit };
}

function buildCreatedAtFilter(from, to) {
  if (!from && !to) return null;
  const range = {};
  const parseDate = (value, label) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw httpError(`${label} must use YYYY-MM-DD format.`);
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw httpError(`${label} is not a valid date.`);
    return date;
  };
  if (from) range.$gte = parseDate(from, 'from');
  if (to) {
    const end = parseDate(to, 'to');
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) throw httpError('from must be on or before to.');
  return range;
}

module.exports = { parsePagination, buildCreatedAtFilter, httpError };
