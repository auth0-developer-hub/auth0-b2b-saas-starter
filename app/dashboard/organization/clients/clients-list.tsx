"use client"

import { DotsVerticalIcon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

import { deleteApiClient, rotateApiClientSecret } from "./actions"

interface Props {
  clients: {
    id: string
    name: string
    type: string
  }[]
}

export function ApiClientsList({ clients }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Clients</CardTitle>
        <CardDescription>
          The current API clients for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {client.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {client.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{client.type}</span>
                </TableCell>
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
                          const result = await rotateApiClientSecret(client.id)
                          if (result.error) {
                            return toast.error(result.error)
                          }
                          toast.success(
                            `Rotated secret for client: ${client.name}`
                          )
                          // You might want to display the new secret here, or copy it to clipboard
                        }}
                      >
                        <ReloadIcon className="mr-1 size-4" />
                        Rotate Secret
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={async () => {
                          const result = await deleteApiClient(client.id)
                          if (result?.error) {
                            return toast.error(result.error)
                          }
                          toast.success(`Deleted client: ${client.name}`)
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
