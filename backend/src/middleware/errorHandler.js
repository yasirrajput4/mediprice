const logger = require("../utils/logger");

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(`${status} ${req.method} ${req.originalUrl}`, {
      error: err.message,
      stack: err.stack,
    });
  }

  // Postgres unique violation
  if (err.code === "23505") {
    return res
      .status(409)
      .json({ error: "A record with this value already exists." });
  }

  // Postgres foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record does not exist." });
  }

  res.status(status).json({
    error: status < 500 ? err.message : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
