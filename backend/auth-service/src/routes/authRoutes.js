const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require('../validators/authValidator');

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
