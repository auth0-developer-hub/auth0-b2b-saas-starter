"use client"

import { CopyIcon, DotsVerticalIcon, TrashIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { Role } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { revokeInvitation } from "./actions"

interface Props {
  invitations: {
    id: string
    inviter: {
      name: string
    }
    invitee: {
      email: string
    }
    role: Role
    url: string
  }[]
}

export function InvitationsList({ invitations }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Invitations that have been sent out but have not yet been redeemed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  {invitation.invitee.email}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{invitation.role}</Badge>
                </TableCell>
                <TableCell>{invitation.inviter.name}</TableCell>
                <TableCell className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline">
                        <DotsVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={async () => {
                          await navigator.clipboard.writeText(invitation.url)
                          toast.success("Invitation link copied to clipboard.")
                        }}
                      >
                        <CopyIcon className="mr-1 size-4" />
                        Copy invitation link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={async () => {
                          const { error } = await revokeInvitation(
                            invitation.id
                          )
                          if (error) {
                            return toast.error(error)
                          }

                          toast.success(
                            `Invitation has been revoked for: ${invitation.invitee.email}`
                          )
                        }}
                      >
                        <TrashIcon className="mr-1 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
