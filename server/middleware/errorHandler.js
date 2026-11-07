import { ZodError } from 'zod';

/** Consistent 404 for unknown API routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Consistent JSON errors — never leaks stack traces to clients. */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  // Zod errors that slipped past route validation
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ error: 'Validation failed', fields });
  }

  const status = err?.status || err?.statusCode || 500;
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`, err.stack || err);
  }

  res.status(status).json({
    error:
      status === 500
        ? 'Something went wrong on our side. Please try again.'
        : err.message || 'Request failed.',
    ...(err.fields ? { fields: err.fields } : {}),
  });
}
