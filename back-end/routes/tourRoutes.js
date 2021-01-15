const express = require('express');
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tourController');

const reviewRouter = require('./reviewRoutes');

const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    protectRoute,
    restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protectRoute, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .patch(protectRoute, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protectRoute, restrictTo('admin', 'lead-guide'), deleteTour)
  .get(getTour);

module.exports = router;
