/**
 * The Management API scopes the SaaStart Management client needs.
 *
 * Shared by `bootstrap.mjs` (which creates the client grant on a fresh tenant) and
 * `update-client-grant.mjs` (which tops up an already-bootstrapped tenant), so the two can never
 * disagree about what the app requires.
 */
export const managementApiScopes = [
  // Users
  "read:users",
  "update:users",
  "delete:users",
  "create:users",
  // Connections
  "read:connections",
  "update:connections",
  "delete:connections",
  "create:connections",
  // Organizations
  "read:organizations_summary",
  "read:organizations",
  "update:organizations",
  "create:organizations",
  "delete:organizations",
  "create:organization_members",
  "read:organization_members",
  "delete:organization_members",
  "create:organization_connections",
  "read:organization_connections",
  "update:organization_connections",
  "delete:organization_connections",
  "create:organization_member_roles",
  "read:organization_member_roles",
  "delete:organization_member_roles",
  "create:organization_invitations",
  "read:organization_invitations",
  "delete:organization_invitations",
  // MFA Enrollment
  "read:guardian_factors",
  "read:authentication_methods",
  "delete:authentication_methods",
  "create:guardian_enrollment_tickets",
  // SCIM
  "create:scim_token",
  "read:scim_token",
  "delete:scim_token",
  "read:scim_config",
  "create:scim_config",
  "update:scim_config",
  "delete:scim_config",
  // Agents (Auth0 "Agents as Principal", Early Access)
  // Deliberately no `update:agents` — nothing in the app mutates an existing agent, and
  // `external_agent_id` is immutable after creation anyway.
  "read:agents",
  "create:agents",
  "delete:agents",
]
