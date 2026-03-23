export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول لهذا المورد' });
    }
    next();
  };
}

export default { requireRole };
