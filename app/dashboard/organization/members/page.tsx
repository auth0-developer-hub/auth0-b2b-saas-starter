import { appClient, managementClient } from "@/lib/auth0"
import { Role } from "@/lib/roles"
import { PageHeader } from "@/components/page-header"

import { CreateInvitationForm } from "./create-invitation-form"
import { InvitationsList } from "./invitations-list"
import { MembersList } from "./members-list"

export default async function Members() {
  const session = await appClient.getSession()
  const { data: members } = await managementClient.organizations.getMembers({
    id: session!.user.org_id,
    fields: ["user_id", "name", "email", "picture", "roles"].join(","),
    include_fields: true,
  })
  const { data: invitations } =
    await managementClient.organizations.getInvitations({
      id: session!.user.org_id,
    })

  return (
    <div className="space-y-2">
      <PageHeader
        title="Members"
        description="Manage the members of the organization."
      />

      <MembersList
        members={members.map((m) => ({
          id: m.user_id,
          name: m.name,
          email: m.email,
          picture: m.picture,
          role: ((m.roles && m.roles[0]?.name) || "member") as Role,
        }))}
      />

      <InvitationsList
        invitations={invitations.map((i) => ({
          id: i.id,
          inviter: {
            name: i.inviter.name,
          },
          invitee: {
            email: i.invitee.email,
          },
          role:
            i.roles &&
            i.roles[0] &&
            i.roles[0] === process.env.AUTH0_ADMIN_ROLE_ID
              ? "admin"
              : "member",
          url: i.invitation_url,
        }))}
      />

      <CreateInvitationForm />
    </div>
  )
}
