// Ensures every query/mutation is scoped to the requesting user's mandal (no cross-tenant leakage)
const requireMandal = (req, res, next) => {
  if (!req.mandalId) {
    res.status(400);
    throw new Error('No mandal associated with this account');
  }
  next();
};

module.exports = { requireMandal };
