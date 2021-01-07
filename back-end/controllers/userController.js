const catchAsyncErrors = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./handleFactory');

const filterObj = (objOriginal, allowedFields) => {
  const filteredObj = Object.keys(objOriginal)
    .filter((key) => allowedFields.includes(key))
    .reduce((objNew, key) => {
      objNew[key] = objOriginal[key];
      return objNew;
    }, {});
  return filteredObj;
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const deleteMe = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({ status: 'success', data: null });
});

const updateMe = catchAsyncErrors(async (req, res, next) => {
  // 1. If user tries to update password, create error
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates, please use /updateMyPassword route',
        400
      )
    );
  }

  // 2. Filter out unwanted fields names that are not allowed to be updated(i.e role)
  const filteredBody = filterObj(req.body, ['name', 'email']);

  // 3. Update user document
  // We can use findByIdAndUpdate because we are not dealing with sensivite data now
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

const getAllUsers = getAll(User);
const getUser = getOne(User);
const deleteUser = deleteOne(User);
// DO NOT CHANGE PASSWORD WITH THIS
const updateUser = updateOne(User);

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Route is not defined! Please use post /signUp instead',
  });
};

module.exports = {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  createUser,
  getMe,
  updateMe,
  deleteMe,
};
