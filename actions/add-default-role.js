/**
* Handler that will be called during the execution of a PostLogin Flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  // Check if the user has a role assigned
  if (event.authorization && event.authorization.roles && event.authorization.roles.length > 0) {
    return;
  }

  // Ensure we only run this in the context of an organization
  if (!event.organization) {
    return;
  }

  // Create management API client instance
  const ManagementClient = require("auth0").ManagementClient;

  const managementClient = new ManagementClient({
    domain: event.secrets.DOMAIN,
    clientId: event.secrets.CLIENT_ID,
    clientSecret: event.secrets.CLIENT_SECRET,
  });

  try {
    await managementClient.organizations.addMemberRoles({
      id: event.organization.id,
      user_id: event.user.user_id
    }, {
      roles: [event.secrets.MEMBER_ROLE_ID]
    })
  } catch (e) {
    console.log(e);
  }
};
