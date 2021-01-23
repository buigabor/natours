const express = require('express');
const {
  protectRoute,
  restrictTo,
  checkIfCurrentUser,
} = require('../controllers/authController');

const {
  getReview,
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourAndUserIds,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(protectRoute);

router
  .route('/')
  .post(restrictTo('user'), setTourAndUserIds, createReview)
  .get(getAllReviews);

router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), checkIfCurrentUser, deleteReview)
  .patch(restrictTo('user', 'admin'), checkIfCurrentUser, updateReview)
  .get(getReview);

module.exports = router;
