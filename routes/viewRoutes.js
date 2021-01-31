const express = require('express');
const {
  renderOverview,
  renderTour,
  renderLogin,
  renderAccount,
  updateUserData,
  renderMyTours,
  renderHome,
} = require('../controllers/viewController');
const { isLoggedIn, protectRoute } = require('../controllers/authController');

const router = express.Router();

router.get('/', renderHome);
router.get('/home', isLoggedIn, renderOverview);
router.get('/tour/:tourSlug', isLoggedIn, renderTour);
router.get('/login', isLoggedIn, renderLogin);
router.get('/me', protectRoute, renderAccount);
router.get('/my-tours', protectRoute, renderMyTours);
router.post('/submit-user-data', protectRoute, updateUserData);

module.exports = router;
