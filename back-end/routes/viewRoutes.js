const express = require('express');
const {
  renderOverview,
  renderTour,
  renderLogin,
} = require('../controllers/viewController');

const router = express.Router();

router.get('/', renderOverview);
router.get('/tour/:tourSlug', renderTour);
router.get('/login', renderLogin);

module.exports = router;
