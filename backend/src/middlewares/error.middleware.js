const { ZodError } = require("zod");

function globalErrorHandler(error, _req, res, _next) {
  let statusCode = error.status || error.statusCode || 500;
  let message = error.message || "Something went wrong!";
  let errors = [];

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = error.errors.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = { globalErrorHandler };
