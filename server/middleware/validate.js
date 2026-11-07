import { ZodError } from 'zod';

/**
 * Zod validation middleware. Parses body/query/params once and stores the
 * results on req.validated so controllers always work with clean, coerced data.
 *
 * Usage: router.post('/', validate({ body: mySchema }), handler)
 *        → inside handler: req.validated.body
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    const out = {};
    try {
      if (schemas.body) out.body = schemas.body.parse(req.body ?? {});
      if (schemas.query) out.query = schemas.query.parse(req.query ?? {});
      if (schemas.params) out.params = schemas.params.parse(req.params ?? {});
      req.validated = out;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.') || '_';
          if (!fields[key]) fields[key] = issue.message;
        }
        return res.status(400).json({ error: 'Validation failed', fields });
      }
      next(err);
    }
  };
}
