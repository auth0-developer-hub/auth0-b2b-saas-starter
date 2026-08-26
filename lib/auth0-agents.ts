import { cache } from "react"

/**
 * Auth0 "Agents as Principal" — registration, listing and deletion of agent identities.
 *
 * The `auth0` SDK does not expose an agents manager, so this is the only module in the app that
 * talks to the Management API over raw `fetch`. Everything else goes through `managementClient`
 * in `lib/auth0.ts`.
 *
 * Agents cannot be members of an Auth0 Organization — they are tenant-level objects, and
 * `GET /api/v2/agents` has no org dimension at all. Organization assignment is therefore carried in
 * `metadata.org_id` and enforced here, in application code. Every export takes an `orgId` as its
 * first argument so that it is impossible to call one without having decided which organization you
 * are acting in.
 */

const managementApiBaseUrl = `https://${process.env.AUTH0_MANAGEMENT_API_DOMAIN}`
const agentsPath = "/api/v2/agents"

export interface Agent {
  /** Auth0 `agent_id` (`agt_…`). Always what the Management API is addressed with. */
  id: string
  name: string
  /** Set once at creation and immutable afterwards. */
  externalAgentId?: string
  /**
   * The value that will appear as `sub` (and `act.sub`) in tokens issued for this agent, and in
   * tenant logs. When `external_agent_id` is set it *replaces* `agent_id` in those places while
   * `agent_id` remains the Management API key, so the two can differ. Anything that has to
   * recognise this agent from a token — FGA tuples, checks, the permissions index — must key off
   * this and not off `id`.
   */
  tokenSubject: string
  /** From `metadata.org_id`. An agent without one belongs to no organization. */
  orgId?: string
  createdAt: string
  updatedAt: string
}

interface RawAgent {
  agent_id: string
  name: string
  external_agent_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

/** The agent exists in the tenant but not in the organization the caller is acting in. */
export class AgentNotFoundError extends Error {
  constructor(agentId: string) {
    super(`Agent ${agentId} was not found in this organization.`)
    this.name = "AgentNotFoundError"
  }
}

export class AgentsApiError extends Error {
  readonly status: number

  constructor(operation: string, response: ManagementResponse) {
    super(
      `Failed to ${operation}: Auth0 responded ${response.status}${
        response.text ? ` — ${response.text}` : ""
      }`
    )
    this.name = "AgentsApiError"
    this.status = response.status
  }
}

// --- Management API access token -------------------------------------------------------------

let cachedToken: { accessToken: string; expiresAt: number } | null = null
let pendingToken: Promise<string> | null = null

/**
 * Client-credentials token for the Management API, cached in module scope until shortly before it
 * expires. Concurrent callers share one in-flight request.
 */
export function getManagementToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return Promise.resolve(cachedToken.accessToken)
  }

  if (pendingToken) {
    return pendingToken
  }

  const request = requestManagementToken()
  pendingToken = request

  const clear = () => {
    if (pendingToken === request) {
      pendingToken = null
    }
  }
  request.then(clear, clear)

  return request
}

async function requestManagementToken(): Promise<string> {
  const response = await fetch(`${managementApiBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: `${managementApiBaseUrl}/api/v2/`,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(
      `Failed to obtain a Management API token: ${response.status} — ${await response.text()}`
    )
  }

  const body = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  // renew a minute early, so a token handed out here can't expire mid-request
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Math.max(body.expires_in - 60, 30) * 1000,
  }

  return body.access_token
}

interface ManagementResponse {
  ok: boolean
  status: number
  body: unknown
  text: string
}

async function managementFetch(
  path: string,
  init: RequestInit = {}
): Promise<ManagementResponse> {
  const token = await getManagementToken()

  const response = await fetch(`${managementApiBaseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  })

  const text = await response.text()
  let body: unknown

  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
  }

  return { ok: response.ok, status: response.status, body, text }
}

// --- Normalization ---------------------------------------------------------------------------

function toAgent(raw: RawAgent): Agent {
  const externalAgentId = raw.external_agent_id || undefined
  const orgId =
    typeof raw.metadata?.org_id === "string" ? raw.metadata.org_id : undefined

  return {
    id: raw.agent_id,
    name: raw.name,
    externalAgentId,
    tokenSubject: externalAgentId ?? raw.agent_id,
    orgId,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
  }
}

/**
 * The Agents documentation doesn't say whether the collection paginates, so both shapes are
 * accepted: a bare array (no pagination) or the usual `include_totals` envelope.
 */
function toAgentPage(body: unknown): { agents: RawAgent[]; total?: number } {
  if (Array.isArray(body)) {
    return { agents: body as RawAgent[] }
  }

  if (body && typeof body === "object") {
    const envelope = body as { agents?: unknown; total?: unknown }

    if (Array.isArray(envelope.agents)) {
      return {
        agents: envelope.agents as RawAgent[],
        total: typeof envelope.total === "number" ? envelope.total : undefined,
      }
    }
  }

  return { agents: [] }
}

// --- Agents ----------------------------------------------------------------------------------

const perPage = 100
// Backstop so a misread pagination shape can't spin forever against the Management API.
const maxPages = 50

/**
 * Every agent belonging to `orgId`. Finding them means walking the whole tenant list, because the
 * API offers no server-side filter — which is exactly why the filter lives here and never at a
 * call site.
 */
export async function listAgents(orgId: string): Promise<Agent[]> {
  let response = await managementFetch(
    `${agentsPath}?include_totals=true&page=0&per_page=${perPage}`
  )

  // Pagination params aren't documented for this Early Access endpoint, and at least some tenants
  // reject them outright with a 400. Fall back to one bare, unpaginated request rather than fail —
  // the alternative is an agents page that simply never loads on those tenants.
  if (response.status === 400) {
    response = await managementFetch(agentsPath)

    if (!response.ok) {
      throw new AgentsApiError("list agents", response)
    }

    return toAgentPage(response.body)
      .agents.map(toAgent)
      .filter((agent) => agent.orgId === orgId)
  }

  const collected: RawAgent[] = []

  for (let page = 0; page < maxPages; page++) {
    if (!response.ok) {
      throw new AgentsApiError("list agents", response)
    }

    const paginates = !Array.isArray(response.body)
    const { agents, total } = toAgentPage(response.body)

    collected.push(...agents)

    if (!paginates || agents.length < perPage) {
      break
    }

    if (typeof total === "number" && collected.length >= total) {
      break
    }

    response = await managementFetch(
      `${agentsPath}?include_totals=true&page=${page + 1}&per_page=${perPage}`
    )
  }

  return collected.map(toAgent).filter((agent) => agent.orgId === orgId)
}

export async function createAgent(
  orgId: string,
  { name, externalAgentId }: { name: string; externalAgentId?: string }
): Promise<Agent> {
  const response = await managementFetch(agentsPath, {
    method: "POST",
    body: JSON.stringify({
      name,
      // `external_agent_id` can only be set at creation, so it is omitted rather than sent empty.
      ...(externalAgentId ? { external_agent_id: externalAgentId } : {}),
      // System-managed, never exposed by the form: this is what scopes the agent to an organization.
      metadata: { org_id: orgId },
    }),
  })

  if (!response.ok) {
    throw new AgentsApiError("register agent", response)
  }

  return toAgent(response.body as RawAgent)
}

export async function deleteAgent(
  orgId: string,
  agentId: string
): Promise<void> {
  // Filtering the list is not enough on its own: the agent id is visible in the UI and arrives here
  // as caller input, so ownership is re-verified against the live object before anything is
  // destroyed.
  const read = await managementFetch(
    `${agentsPath}/${encodeURIComponent(agentId)}`
  )

  if (read.status === 404) {
    throw new AgentNotFoundError(agentId)
  }

  if (!read.ok) {
    throw new AgentsApiError("read agent", read)
  }

  const agent = toAgent(read.body as RawAgent)

  // Shaped as not-found rather than forbidden — another organization's agent shouldn't be
  // confirmed to exist.
  if (agent.orgId !== orgId) {
    throw new AgentNotFoundError(agentId)
  }

  const response = await managementFetch(
    `${agentsPath}/${encodeURIComponent(agent.id)}`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    throw new AgentsApiError("delete agent", response)
  }
}

// --- Capability detection --------------------------------------------------------------------

export type AgentsCapability =
  | { status: "enabled" }
  | { status: "missing_scope"; detail: string }
  | { status: "not_enabled" }
  | { status: "error"; detail: string }

const capabilityTtlMs = 5 * 60 * 1000
const capabilityErrorTtlMs = 15 * 1000

let cachedCapability: { value: AgentsCapability; expiresAt: number } | null =
  null

/**
 * Whether this tenant can actually be asked about agents.
 *
 * Deliberately tri-state rather than a boolean. A grant missing `read:agents` and a tenant without
 * the Early Access feature both answer 403, but they need opposite remediation — add scopes vs.
 * contact Auth0 Support — so collapsing them would send someone off to enable a feature that is
 * already enabled.
 *
 * Cached per request via `React.cache` (the organization layout and the agents page both ask) and
 * in module scope for a few minutes, so navigating the settings area doesn't re-probe the
 * Management API on every render.
 */
export const getAgentsCapability = cache(
  async function getAgentsCapability(): Promise<AgentsCapability> {
    if (cachedCapability && cachedCapability.expiresAt > Date.now()) {
      return cachedCapability.value
    }

    const value = await probeAgentsCapability()

    cachedCapability = {
      value,
      expiresAt:
        Date.now() +
        (value.status === "error" ? capabilityErrorTtlMs : capabilityTtlMs),
    }

    return value
  }
)

async function probeAgentsCapability(): Promise<AgentsCapability> {
  switch (process.env.AUTH0_AGENTS_ENABLED ?? "auto") {
    case "true":
      return { status: "enabled" }
    case "false":
      return { status: "not_enabled" }
  }

  try {
    // No query params here: this Early Access endpoint's pagination contract isn't documented, and
    // a probe should only ever depend on the status code, not on which query params it accepts.
    const response = await managementFetch(agentsPath)

    if (response.ok) {
      return { status: "enabled" }
    }

    if (response.status === 401 || response.status === 403) {
      return isInsufficientScope(response)
        ? {
            status: "missing_scope",
            // Auth0's own message, e.g. "Insufficient scope, expected any of: read:agents" — shown
            // verbatim rather than guessed, since the exact scope name isn't otherwise confirmed.
            detail: errorMessage(response),
          }
        : { status: "not_enabled" }
    }

    if (response.status === 404) {
      return { status: "not_enabled" }
    }

    return {
      status: "error",
      detail: errorMessage(response),
    }
  } catch (error) {
    return {
      status: "error",
      detail:
        error instanceof Error
          ? error.message
          : "The Auth0 Management API could not be reached.",
    }
  }
}

function isInsufficientScope({ body, text }: ManagementResponse): boolean {
  const errorCode =
    body && typeof body === "object"
      ? (body as { errorCode?: unknown }).errorCode
      : undefined

  if (errorCode === "insufficient_scope") {
    return true
  }

  return /insufficient[_ ]scope/i.test(text)
}

function errorMessage({ body, text, status }: ManagementResponse): string {
  const message =
    body && typeof body === "object"
      ? (body as { message?: unknown }).message
      : undefined

  if (typeof message === "string" && message) {
    return message
  }

  return text || `Auth0 responded ${status} with no message.`
}
