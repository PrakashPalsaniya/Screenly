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

  // Log the full error internally for debugging
  if (statusCode >= 500) {
    console.error("[Server Error]", error);
  }

  // Never expose internal stack traces or raw error details to the client
  const isProduction = process.env.NODE_ENV === "production";
  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode >= 500 ? "Something went wrong!" : message,
    errors,
  });
}

module.exports = { globalErrorHandler };
