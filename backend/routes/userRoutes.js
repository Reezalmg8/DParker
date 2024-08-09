const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define user-related routes
router.get('/profile', userController.getUserProfile);
// Add more routes as needed

module.exports = router;
