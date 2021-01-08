const Tour = require('../models/tourModel');
const catchAsyncErrors = require('../utils/catchAsync');

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

const renderLogin = catchAsyncErrors(async (req, res, next) => {
  res.status(200).render('login', { title: 'Log into your account' });
});

module.exports = { renderOverview, renderTour, renderBase, renderLogin };
