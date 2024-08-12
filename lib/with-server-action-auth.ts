import { Session } from "@auth0/nextjs-auth0"

import { checkAccess, Feature } from "@/lib/entitlements"

import { appClient } from "./auth0"
import { getRole, Role } from "./roles"

interface Options {
  role?: Role
  entitlement?: Feature
}

/**
 * withServerActionAuth wraps a Server Action to ensure a user is authenticated.
 * Optionally, if a role is supplied, then the user must have that role to invoke the Server Action.
 */
export function withServerActionAuth<T extends any[], U extends any>(
  serverActionWithSession: (...args: [...T, session: Session]) => U,
  options: Options
) {
  return async function (...args: T) {
    const session = await appClient.getSession()

    if (!session) {
      return {
        error: "You must be authenticated to perform this action.",
      }
    }

    if (options.entitlement) {
      const hasAccess = await checkAccess(session.user, options.entitlement)
      if (!hasAccess) {
        return {
          error: `Your organization must have a(n) ${options.entitlement} entitlement to perform this action.`,
        }
      }
    }

    if (options.role && getRole(session.user) !== options.role) {
      return {
        error: `You must be a(n) ${options.role} to perform this action.`,
      }
    }

    return serverActionWithSession(...args, session)
  }
}
