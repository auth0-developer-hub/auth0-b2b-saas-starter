/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const apiKey = event.secrets.STIGG_API_KEY;
  const mauFeatureId = event.secrets.STIGG_MAU_FEATURE_ID;

  if (!event.organization) {
    return;
  }

  const Stigg = require("@stigg/node-server-sdk").Stigg;

  const stigg = Stigg.initialize({
    apiKey,
    realtimeUpdatesEnabled:false,
  });

  const organizationId = event.organization.id;

  // check if the organization has access to one more MAU
  const mauEntitlement = await stigg.getMeteredEntitlement({
    customerId: organizationId,
    featureId: mauFeatureId,
    options: {
      requestedUsage: 1
    }
  });

  // store last login for organization in a separate key
  const lastLoginMetadataKey = `${organizationId}:last_login`;

  // block access to new MAU if the organization has exceeded the limit
  if (!mauEntitlement.hasAccess){
    const moment = require('moment');

    const lastLogin = moment.utc(event.user.app_metadata[lastLoginMetadataKey] || 0);
    const nextResetDate = moment.utc(mauEntitlement.nextResetDate?.getTime() || 0);
    const previousResetDate = moment(nextResetDate).subtract(1, 'month');

    const isNewMau = lastLogin.isBefore(previousResetDate);
    if (isNewMau){
      api.access.deny("Organization has exceeded the MAU limit, please contact your administrator.");
      return;
    }
  }

  api.user.setAppMetadata(lastLoginMetadataKey, Date.now());

  const crypto = require('crypto');

  const userId = event.user.user_id;
  const eventName = `user-login`;

  // generate a unique idempotency key for the event
  const idempotencyKey = crypto.createHash('md5')
    .update(`${userId}:${organizationId}:${eventName}:${Date.now()}`)
    .digest("hex");

  try {
    await stigg.reportEvent({
      customerId: organizationId,
      eventName,
      idempotencyKey,
      dimensions: {
        user_id: userId,
      }
    });
  } catch (e) {
    console.error('Failed to report user login event', e);
  }
};