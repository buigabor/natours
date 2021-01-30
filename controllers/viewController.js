const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsyncErrors = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const renderOverview = catchAsyncErrors(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();
  // 2. Build template
  // 3. Render template, using tour data
  res.status(200).render('overview', { title: 'All Tours', tours });
});

const renderTour = catchAsyncErrors(async (req, res, next) => {
  // 1. Get data for requested tour(including guides and review)
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  // 2. Build template
  // 3. Render template

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', { title: `${tour.name} Tour`, tour });
});

const renderBase = (req, res) => {
  res
    .status(200)
    .render('base', { title: 'Exciting tours for adventorous people' });
};

const renderHome = (req, res) => {
  res.status(200).render('home', { title: 'Home' });
};

const renderLogin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', { title: 'Log into your account' });
});
const renderAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your account' });
};
const updateUserData = catchAsyncErrors(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res
    .status(200)
    .render('account', { title: 'Your account', user: updatedUser });
});

// Only for rendered pages, no errors!

const renderMyTours = catchAsyncErrors(async (req, res, next) => {
  // Find all booking
  const bookings = await Booking.find({ user: req.user.id });

  // Find tours with the returned IDss
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', { title: 'My Tours', tours });
});

module.exports = {
  renderOverview,
  renderTour,
  renderBase,
  renderLogin,
  renderAccount,
  updateUserData,
  renderMyTours,
  renderHome,
};
