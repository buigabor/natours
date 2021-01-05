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
} = require('../controllers/tourController');

const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/top-5-tours').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(protectRoute, getAllTours).post(createTour);
router
  .route('/:id')
  .patch(updateTour)
  .delete(protectRoute, restrictTo('admin', 'lead-guide'), deleteTour)
  .get(getTour);

module.exports = router;
