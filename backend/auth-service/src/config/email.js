'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const logger = require('../utils/logger');

/**
 * SES client, initialized lazily — same reasoning as config/stripe.js: a
 * missing/misconfigured mailer should only break forgot-password, not take
 * down login and session handling for everyone. Each caller handles a thrown
 * error itself rather than this module crashing the process.
 *
 * No explicit credentials are passed to the SESClient constructor — the AWS
 * SDK's default credential provider chain resolves them: an IAM task role in
 * ECS (the production target per the Terraform modules), or
 * AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY from the environment for local dev.
 * Hardcoding a credentials block here would be a second, easier-to-leak path
 * to the same secret.
 */

let client = null;

function getSesClient() {
  if (client) return client;

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error('AWS_REGION is not configured');
  }

  client = new SESClient({ region });
  return client;
}

/** The SES-verified "From" address. Must be a verified identity in the configured SES account/region. */
function getSenderEmail() {
  const sender = process.env.EMAIL_FROM;
  if (!sender) {
    throw new Error('EMAIL_FROM is not configured');
  }
  return sender;
}

/**
 * Send the password-reset email. Throws on any failure (unconfigured client,
 * SES rejection) — the caller (passwordResetController) decides how to
 * respond; this module only knows how to send, not what forgot-password's
 * contract with its caller should be.
 */
async function sendPasswordResetEmail(toEmail, resetUrl) {
  const ses = getSesClient();
  const from = getSenderEmail();

  const command = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'Reset your MatchWise password' },
      Body: {
        Text: {
          Data: `Someone requested a password reset for this MatchWise account.\n\n`
            + `Reset your password: ${resetUrl}\n\n`
            + `This link expires in 1 hour. If you did not request this, you can ignore this email — your password will not change.`,
        },
      },
    },
  });

  await ses.send(command);
}

/**
 * Log (not throw) at boot if email is unconfigured — same pattern as
 * stripe.warnIfUnconfigured, called alongside it in server.js.
 */
function warnIfUnconfigured() {
  const missing = ['AWS_REGION', 'EMAIL_FROM'].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    logger.warn('Email is not configured — /auth/forgot-password will silently fail to send', { missing });
  }
}

module.exports = { getSesClient, sendPasswordResetEmail, warnIfUnconfigured };
