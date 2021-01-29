/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51IDBdiK5GenrVqij8MiyRhpWUyZFHBnOMBkDjOIQ3byLGLmar9es5TnxjravGB74CGN9edULkLytKt2WpI0FAGu4002kBrtQma'
    );
    // 1) Get checkout session from API

    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
    // 2) Create checkout form with Stripe + charge credit card
  } catch (error) {
    showAlert('Error', error);
  }
};
