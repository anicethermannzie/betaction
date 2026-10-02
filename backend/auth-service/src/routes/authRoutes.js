const { Router } = require('express');
const authController = require('../controllers/authController');
const passwordResetController = require('../controllers/passwordResetController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateDeleteAccount,
  validateForgotPassword,
  validateResetPassword,
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

// DELETE /api/auth/account  (protected)
router.delete('/account', authenticate, validateDeleteAccount, authController.deleteAccount);

// POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, passwordResetController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validateResetPassword, passwordResetController.resetPassword);

module.exports = router;
