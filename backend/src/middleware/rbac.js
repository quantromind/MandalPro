// Default permissions preset by role
const getDefaultPermissions = (role) => {
  switch (role) {
    case 'president':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: true,
        canChat: true,
        canViewReports: true
      };
    case 'secretary':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: true,
        canChat: true,
        canViewReports: true
      };
    case 'treasurer':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: false,
        canChat: true,
        canViewReports: true
      };
    case 'volunteer':
    default:
      return {
        canCollect: true,
        canManageExpenses: false,
        canAddMembers: false,
        canChat: true,
        canViewReports: false
      };
  }
};

// Restrict a route to specific roles. Usage: allowRoles('president', 'treasurer')
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

// Restrict a route based on granular permission key or president/superadmin bypass
const checkPermission = (permKey) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Superadmin and President always have full access across all operations
  if (req.user.role === 'superadmin' || req.user.role === 'president') {
    return next();
  }

  // Check custom user permissions
  if (req.user.permissions && req.user.permissions[permKey] !== undefined) {
    if (req.user.permissions[permKey] === true) {
      return next();
    }
  } else {
    // Fall back to default permissions for the role
    const defaults = getDefaultPermissions(req.user.role);
    if (defaults && defaults[permKey] === true) {
      return next();
    }
  }

  res.status(403);
  throw new Error(`You do not have permission to perform this action (${permKey})`);
};

module.exports = { allowRoles, checkPermission, getDefaultPermissions };

