// LMS/backend/middlewares/errorMiddleware.js

// Middleware to handle 404 (Not Found) errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the next error-handling middleware
};

// Middleware to handle general errors
const errorHandler = (err, req, res, next) => {
  // Determine the status code based on what's already set or default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Send a JSON response with the error message and stack trace (in development)
  res.json({
    message: err.message, // This is the specific message from throw new Error()
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Stack trace for debugging in development
  });
};

export { notFound, errorHandler };