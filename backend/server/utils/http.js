function ok(res, data = []) {
  res.status(200).json(Array.isArray(data) ? data : { ...data });
}
function bad(res, message = 'Bad Request', code = 400) {
  res.status(code).json({ error: message });
}
function safe(asyncHandler) {
  return (req, res, next) => Promise.resolve(asyncHandler(req, res, next)).catch(next);
}
module.exports = { ok, bad, safe };
