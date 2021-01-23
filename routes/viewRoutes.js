const express = require('express');
const {
  renderOverview,
  renderTour,
  renderLogin,
  renderAccount,
  updateUserData,
} = require('../controllers/viewController');

const { isLoggedIn, protectRoute } = require('../controllers/authController');

const router = express.Router();

router.get('/', isLoggedIn, renderOverview);
router.get('/tour/:tourSlug', isLoggedIn, renderTour);
router.get('/login', isLoggedIn, renderLogin);
router.get('/me', protectRoute, renderAccount);
router.post('/submit-user-data', protectRoute, updateUserData);

module.exports = router;
