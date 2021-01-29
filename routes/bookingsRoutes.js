const express = require('express');
const { checkoutSession } = require('../controllers/bookingController');
const { protectRoute, restrictTo } = require('../controllers/authController');
const {
  deleteBooking,
  updateBooking,
  createBooking,
  getBooking,
  getAllBookings,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(protectRoute);

router.get('/checkout-session/:tourId', checkoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').post(createBooking).get(getAllBookings);
router.route('/:id').delete(deleteBooking).patch(updateBooking).get(getBooking);

module.exports = router;
