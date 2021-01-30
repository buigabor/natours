const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const catchAsyncErrors = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Email } = require('../utils/email');

const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() -
        timezoneOffset +
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };

  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

const signUp = catchAsyncErrors(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and pw exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. Check if user exists and pw correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3. If everything ok, send token to client

  createSendToken(user, 200, req, res);
});

const protectRoute = catchAsyncErrors(async (req, res, next) => {
  // 1. Get token and check if exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access'),
      401
    );
  }
  // 2. Verificate jwt
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if user still exists
  const user = await User.findById(decodedToken.id);
  if (!user) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    );
  }

  // 4. Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError('User recently changed password. Please login again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = user;
  res.locals.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }

  next();
};

const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

const resetPassword = catchAsyncErrors(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() - timezoneOffset },
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

const updatePassword = catchAsyncErrors(async (req, res, next) => {
  //1. Get user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('No user found with the provided email', 404));
  }
  //2. Check if posted password correct
  const match = await user.comparePasswords(
    req.body.passwordCurrent,
    user.password
  );
  if (!match) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //3. Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4. Log user in
  createSendToken(user, 200, req, res);
});

const checkIfCurrentUser = async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }
  if (req.user.role !== 'admin' && review.user.id !== req.user.id)
    return next(new AppError("You cannot update some else's review.", 403));
  next();
};

const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. Verificate jwt
      const decodedToken = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. Check if user still exists
      const user = await User.findById(decodedToken.id);
      if (!user) {
        return next();
      }

      // 3. Check if user changed password after the token was issued
      if (user.changedPasswordAfter(decodedToken.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = user;
      return next();
    } catch (error) {
      return next();
    }
  }

  next();
};

const logout = (req, res) => {
  res.clearCookie('jwt');

  res.status(200).json({ status: 'success' });
};

module.exports = {
  signUp,
  login,
  logout,
  protectRoute,
  restrictTo,
  checkIfCurrentUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
};
