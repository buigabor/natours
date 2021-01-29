const multer = require('multer');
const sharp = require('sharp');
const catchAsyncErrors = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./handleFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },

//   filename: (req, file, callback) => {
//     //user-userid-timestamp.jpg
//     const extension = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();

// Test if uploaded image is an image
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image, please upload only images', 404),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadUserPhoto = upload.single('photo');

const resizePhoto = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

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
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

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
  uploadUserPhoto,
  resizePhoto,
};
