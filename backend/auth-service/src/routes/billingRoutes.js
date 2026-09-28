'use strict';

const { Router } = require('express');
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/authMiddleware');

const router = Router();

// NOTE: POST /webhook is NOT mounted here — it needs the raw request body for
// Stripe signature verification, which must be parsed before the global
// express.json() body parser runs. It is registered directly in app.js,
// ahead of that parser. See the comment there.

// All routes below require a valid access token — the same Bearer-token
// authentication every other client-facing endpoint in this service uses.
// Nothing billing-specific here: a future mobile client authenticates and
// calls GET /status exactly the same way the web frontend does.
router.use(authenticate);

router.post('/create-checkout-session', billingController.createCheckoutSession);
router.post('/create-portal-session', billingController.createPortalSession);
router.get('/status', billingController.getStatus);

module.exports = router;
