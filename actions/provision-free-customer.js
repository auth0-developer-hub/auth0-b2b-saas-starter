/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const apiKey = event.secrets.STIGG_API_KEY;
  const freePlanId = event.secrets.STIGG_FREE_PLAN_ID;
  const auth0Domain = event.secrets.DOMAIN;
  const auth0ClientId = event.secrets.CLIENT_ID;
  const auth0ClientSecret = event.secrets.CLIENT_SECRET;

  if (!event.organization || event.organization.metadata?.['customer_provisioned']) {
    return;
  }

  const Stigg = require("@stigg/node-server-sdk").Stigg;

  const stigg = Stigg.initialize({
    apiKey,
    realtimeUpdatesEnabled:false
  });

  const organizationId = event.organization.id;

  try {
    await stigg.provisionCustomer({
      customerId: organizationId,
      name: event.organization.name,
      subscriptionParams: {
        planId: freePlanId
      }
    });
  } catch(e){
    if (!e.message.includes('Duplicate')){
      console.error('Failed to provision customer', e);
      return;
    }
  }

  const ManagementClient = require("auth0").ManagementClient;

  const managementClient = new ManagementClient({
    domain: auth0Domain,
    clientId: auth0ClientId,
    clientSecret: auth0ClientSecret,
  });

  try {
    await managementClient.organizations.update({
      id: organizationId,
    }, {
      metadata: {
        customer_provisioned: 'true'
      }
    })
  } catch (e) {
    console.error('Failed to update organization', e);
  }
};
