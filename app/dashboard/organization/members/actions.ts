"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { Role, roles } from "@/lib/roles"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const createInvitation = withServerActionAuth(
  async function createInvitation(formData: FormData, session: Session) {
    const email = formData.get("email")

    if (!email || typeof email !== "string") {
      return {
        error: "Email address is required.",
      }
    }

    const role = formData.get("role") as Role

    if (
      !role ||
      typeof role !== "string" ||
      !["member", "admin"].includes(role)
    ) {
      return {
        error: "Role is required and must be either 'member' or 'admin'.",
      }
    }

    try {
      const roleId = roles[role]

      await managementClient.organizations.createInvitation(
        {
          id: session.user.org_id,
        },
        {
          invitee: {
            email,
          },
          inviter: {
            name: session.user.name,
          },
          client_id: process.env.AUTH0_CLIENT_ID,
          // if the roleId exists, then assign it. Regular members do not have a role assigned,
          // only admins are assigned a specific role.
          roles: roleId ? [roleId] : undefined,
        }
      )

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to create invitation", error)
      return {
        error: "Failed to create invitation.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const revokeInvitation = withServerActionAuth(
  async function revokeInvitation(invitationId: string, session: Session) {
    try {
      await managementClient.organizations.deleteInvitation({
        id: session.user.org_id,
        invitation_id: invitationId,
      })

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to revoke invitation", error)
      return {
        error: "Failed to revoke invitation.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const removeMember = withServerActionAuth(
  async function removeMember(userId: string, session: Session) {
    if (userId === session.user.sub) {
      return {
        error: "You cannot remove yourself from an organization.",
      }
    }

    try {
      await managementClient.organizations.deleteMembers(
        {
          id: session.user.org_id,
        },
        {
          members: [userId],
        }
      )

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to remove member", error)
      return {
        error: "Failed to remove member.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const updateRole = withServerActionAuth(
  async function updateRole(userId: string, role: Role, session: Session) {
    if (userId === session.user.sub) {
      return {
        error: "You cannot update your own role.",
      }
    }

    if (
      !role ||
      typeof role !== "string" ||
      !["member", "admin"].includes(role)
    ) {
      return {
        error: "Role is required and must be either 'member' or 'admin'.",
      }
    }

    const roleId = roles[role]

    try {
      const { data: currentRoles } =
        await managementClient.organizations.getMemberRoles({
          id: session.user.org_id,
          user_id: userId,
        })

      // if the user has any existing roles, remove them
      if (currentRoles.length) {
        await managementClient.organizations.deleteMemberRoles(
          {
            id: session.user.org_id,
            user_id: userId,
          },
          {
            roles: currentRoles.map((r) => r.id),
          }
        )
      }

      // if the user is being assigned a non-member role (non-null), set the new role
      if (roleId) {
        await managementClient.organizations.addMemberRoles(
          {
            id: session.user.org_id,
            user_id: userId,
          },
          {
            roles: [roleId],
          }
        )
      }

      revalidatePath("/dashboard/organization/members")
    } catch (error) {
      console.error("failed to update member's role", error)
      return {
        error: "Failed to update member's role.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
