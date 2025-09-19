const role = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: no user found" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: role '${
          req.user.role
        }' cannot perform this action. Allowed roles: ${allowedRoles.join(
          ", "
        )}`,
      });
    }
    next();
  };
};

module.exports = role;
