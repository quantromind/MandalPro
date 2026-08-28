const errorHandler = (err, req, res, next) => {
  console.error(err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'),
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
