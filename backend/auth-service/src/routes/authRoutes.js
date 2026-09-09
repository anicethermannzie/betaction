const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
} = require('../validators/authValidator');

const router = Router();
router.use(require('../utils/sessionCookie').protect);
router.get('/session', authController.session);
router.post('/logout', authController.logout);

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
