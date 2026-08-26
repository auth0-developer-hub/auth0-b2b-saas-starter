import { appClient } from "@/lib/auth0"
import {
  Agent,
  AgentsCapability,
  getAgentsCapability,
  listAgents,
} from "@/lib/auth0-agents"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

import { AgentsList } from "./agents-list"
import { CreateAgentForm } from "./create-agent-form"

export default async function Agents() {
  return (
    <div className="space-y-2">
      <PageHeader
        title="AI Agents"
        description="Give the AI agents acting in your organization an identity of their own, separate from the people who operate them."
      />
      <Content />
    </div>
  )
}

async function Content() {
  const session = await appClient.getSession()

  // The sidebar hides this section when agents aren't available, but the route stays reachable, so
  // the reason is explained here rather than left to fail.
  const capability = await getAgentsCapability()

  if (capability.status !== "enabled") {
    return <Unavailable capability={capability} />
  }

  let agents: Agent[]

  try {
    agents = await listAgents(session!.user.org_id!)
  } catch (error) {
    console.error("failed to list agents", error)

    return (
      <Unavailable
        capability={{
          status: "error",
          detail: "The list of agents could not be read from Auth0.",
        }}
      />
    )
  }

  return (
    <>
      <AgentsList agents={agents} />
      <CreateAgentForm />
    </>
  )
}

function Unavailable({ capability }: { capability: AgentsCapability }) {
  if (capability.status === "missing_scope") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agents are not available yet</CardTitle>
          <CardDescription>
            The Management API client grant for this application is missing a
            scope it needs to manage agents. Auth0 said:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
            {capability.detail}
          </p>
          <p className="text-sm text-muted-foreground">
            Grant that scope (expected to be one of{" "}
            <span className="font-mono">read:agents</span>,{" "}
            <span className="font-mono">create:agents</span>,{" "}
            <span className="font-mono">delete:agents</span>) to the application
            whose credentials are in{" "}
            <span className="font-mono">AUTH0_MANAGEMENT_CLIENT_ID</span>, then
            restart the dev server — the Management API token cache only
            refreshes on restart. Running{" "}
            <span className="font-mono">npm run auth0:update-grant</span> does
            this for you and is safe to re-run.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (capability.status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agents are temporarily unavailable</CardTitle>
          <CardDescription>{capability.detail}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reload the page to try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agents are not enabled on this tenant</CardTitle>
        <CardDescription>
          Registering AI agents as principals requires the Auth0 Agents as
          Principal feature, which is in Early Access. Contact Auth0 Support to
          have it enabled for this tenant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <p>
          Once it is enabled, this section appears in the settings navigation
          automatically.
        </p>
        <p>
          Set <span className="font-mono">AUTH0_AGENTS_ENABLED</span> to{" "}
          <span className="font-mono">true</span> or{" "}
          <span className="font-mono">false</span> to override this detection.
        </p>
      </CardContent>
    </Card>
  )
}
