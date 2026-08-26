"use server"

import { revalidatePath } from "next/cache"
import { SessionData } from "@auth0/nextjs-auth0/types"

import {
  AgentNotFoundError,
  createAgent as registerAgent,
  deleteAgent as unregisterAgent,
} from "@/lib/auth0-agents"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

const maxFieldLength = 255

export const createAgent = withServerActionAuth(
  async function createAgent(formData: FormData, session: SessionData) {
    const name = formData.get("name")

    if (!name || typeof name !== "string" || !name.trim()) {
      return {
        error: "Name is required.",
      }
    }

    if (name.trim().length > maxFieldLength) {
      return {
        error: `Name must be ${maxFieldLength} characters or fewer.`,
      }
    }

    const externalAgentIdInput = formData.get("external_agent_id")
    let externalAgentId: string | undefined

    if (
      typeof externalAgentIdInput === "string" &&
      externalAgentIdInput.trim()
    ) {
      externalAgentId = externalAgentIdInput.trim()

      if (externalAgentId.length > maxFieldLength) {
        return {
          error: `External agent ID must be ${maxFieldLength} characters or fewer.`,
        }
      }

      // This value becomes the token subject, so whitespace in it would be pathological.
      if (/\s/.test(externalAgentId)) {
        return {
          error: "External agent ID cannot contain spaces.",
        }
      }
    }

    try {
      await registerAgent(session.user.org_id!, {
        name: name.trim(),
        externalAgentId,
      })

      revalidatePath("/dashboard/organization/agents")
    } catch (error) {
      console.error("failed to register agent", error)
      return {
        error: "Failed to register agent.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const deleteAgent = withServerActionAuth(
  async function deleteAgent(agentId: string, session: SessionData) {
    if (!agentId || typeof agentId !== "string") {
      return {
        error: "Agent ID is required.",
      }
    }

    try {
      await unregisterAgent(session.user.org_id!, agentId)

      revalidatePath("/dashboard/organization/agents")
    } catch (error) {
      // Agents are tenant-level objects, so an id from another organization is a reachable input
      // here even though the UI never offers one. Worth a log line rather than a silent refusal.
      if (error instanceof AgentNotFoundError) {
        console.warn(
          `refused to delete agent ${agentId}: not a member of organization ${session.user.org_id}`
        )
        return {
          error: "This agent does not belong to your organization.",
        }
      }

      console.error("failed to delete agent", error)
      return {
        error: "Failed to delete agent.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
