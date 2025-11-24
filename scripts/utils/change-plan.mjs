/**
 * Change Plan Structure
 *
 * This module defines the structure for tracking what changes need to be made
 * during the bootstrap process. Each resource module will check for changes
 * and return a plan object that can be cached and used during execution.
 */

/**
 * Create a new change plan
 */
export function createChangePlan() {
  return {
    clients: {
      management: null,
      dashboard: null,
    },
    clientGrants: {
      management: null,
      myOrg: null,
    },
    connection: null,
    connectionProfile: null,
    userAttributeProfile: null,
    resourceServer: null,
    roles: {
      admin: null,
      member: null,
    },
    actions: {
      securityPolicies: null,
      addDefaultRole: null,
      addRoleToTokens: null,
      bindings: null,
    },
    tenantConfig: {
      settings: null,
      prompts: null,
      emailTemplates: null,
      mfaFactors: null,
    },
    branding: null,
  }
}

/**
 * Action types for change plans
 */
export const ChangeAction = {
  CREATE: "create",
  UPDATE: "update",
  SKIP: "skip",
}

/**
 * Create a change plan item
 */
export function createChangeItem(action, details = {}) {
  return {
    action, // 'create', 'update', or 'skip'
    ...details,
  }
}
