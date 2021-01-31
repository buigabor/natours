const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsyncErrors = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handleFactory');

const checkoutSession = catchAsyncErrors(async (req, res, next) => {
  // Get currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: ['https://www.natours.dev/img/tours/tour-1-cover.jpg'],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  // Send it to client
  res.status(200).json({ status: 'success', session });
});

const deleteBooking = deleteOne(Booking);
const updateBooking = updateOne(Booking);
const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBookings = getAll(Booking);

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

const webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send('Webhook error: ', error.message);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

module.exports = {
  checkoutSession,
  createBookingCheckout,
  deleteBooking,
  updateBooking,
  createBooking,
  getBooking,
  getAllBookings,
  webhookCheckout,
};
