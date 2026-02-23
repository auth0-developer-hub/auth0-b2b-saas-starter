import { appClient, managementClient } from "@/lib/auth0"
import { PageHeader } from "@/components/page-header"

import { ApiClientsList } from "./clients-list"
import { CreateApiClientForm } from "./create-client-form"

export default async function ApiClients() {
  const session = await appClient.getSession()
  const { data: apiClients } = await managementClient.clients.getAll({
    is_global: false,
  })

  return (
    <div className="space-y-2">
      <PageHeader
        title="API Clients"
        description="Manage the clients (often Applications) that are allowed to access your organization's APIs."
      />

      <ApiClientsList
        clients={apiClients.map((client) => ({
          id: client.client_id,
          name: client.name,
          type: client.app_type,
        }))}
      />

      <CreateApiClientForm />
    </div>
  )
}
