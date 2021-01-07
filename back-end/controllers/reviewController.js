const Review = require('../models/reviewModel');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handleFactory');

const setTourAndUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  req.body.user = req.user.id;
  next();
};

const deleteReview = deleteOne(Review);
const updateReview = updateOne(Review, ['review', 'rating']);
const createReview = createOne(Review);
const getReview = getOne(Review);
const getAllReviews = getAll(Review);

module.exports = {
  getReview,
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourAndUserIds,
};
