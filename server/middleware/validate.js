export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const errors = err.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [{ field: 'unknown', message: 'بيانات غير صالحة' }];
      return res.status(400).json({ error: 'بيانات غير صالحة', details: errors });
    }
  };
}

export default { validate };
