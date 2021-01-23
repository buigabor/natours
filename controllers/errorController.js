/* eslint-disable no-lonely-if */
const AppError = require('../utils/appError');

const handleJWTExpirationError = () =>
  new AppError('Your token has expired. Please login again', 401);

const handleJWTError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleValidationErrorDB = (err) => {
  const values = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${values.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  //Find string between quotes -> extracting the value from errmsg property
  // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const duplicateError = err.keyValue;
  const key = Object.keys(duplicateError);
  const value = Object.values(duplicateError);
  const message = `Duplicate ${key}: ${value}, please use another value`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const sendErrorForDev = (err, req, res) => {
  // API Errror
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website Error
  console.error(err);
  res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong!', msg: err.message });
};

const sendErrorForProd = (err, req, res) => {
  // API Errror
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational error
    if (err.isOperationalError) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming error or other unknown error: don't leak error details
    console.error(err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Something went wrong :(' });
  }

  // Rendered Website Error
  // A) Operational error
  if (err.isOperationalError) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', msg: err.message });
  }
  // B) Programming error or other unknown error: don't leak error details
  console.error(err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    console.log(error);
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (err.name === 'TokenExpiredError') {
      error = handleJWTExpirationError();
    }
    sendErrorForProd(error, req, res);
  }
};

module.exports = globalErrorHandler;
