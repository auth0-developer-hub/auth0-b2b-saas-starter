"use client"

import { CopyIcon, DotsVerticalIcon, TrashIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

import { deleteAgent } from "./actions"

interface Props {
  agents: {
    id: string
    name: string
    externalAgentId?: string
    tokenSubject: string
    createdAt: string
  }[]
}

export function AgentsList({ agents }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Agents</CardTitle>
        <CardDescription>
          The AI agents that can act in this organization with their own
          identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No agents are registered yet. Registering an agent gives it an
            identity of its own, so that its activity is attributable to the
            agent rather than to the person who set it up. It does not grant the
            agent access to anything.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Agent ID</TableHead>
                <TableHead>Token Subject</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <CopyableValue value={agent.id} label="Agent ID" />
                  </TableCell>
                  <TableCell>
                    {agent.externalAgentId ? (
                      <CopyableValue
                        value={agent.tokenSubject}
                        label="Token subject"
                      />
                    ) : (
                      // Without an external agent ID the token subject is just the agent ID, so it's
                      // stated rather than repeated as a second thing to copy.
                      <span className="text-sm text-muted-foreground">
                        Same as agent ID
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {agent.createdAt
                      ? format(agent.createdAt, "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="outline">
                            <DotsVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                              <TrashIcon className="mr-1 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete agent {agent.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes the agent identity. Tokens
                            already issued for it stay valid until they expire,
                            and the identifier cannot be reused.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              const { error } = await deleteAgent(agent.id)
                              if (error) {
                                return toast.error(error)
                              }

                              toast.success(`Deleted agent: ${agent.name}`)
                            }}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function CopyableValue({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      className="group flex items-center gap-1.5 font-mono text-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        toast.success(`${label} copied to clipboard.`)
      }}
    >
      {value}
      <CopyIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
