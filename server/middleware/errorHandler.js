import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'تنسيق JSON غير صحيح' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'هذا السجل موجود بالفعل' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'مرجع غير صالح - السجل المرتبط غير موجود' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'حدث خطأ في الخادم' : err.message;

  res.status(status).json({ error: message });
}

export default errorHandler;
