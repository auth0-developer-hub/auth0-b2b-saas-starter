"use client"

import { useParams } from "next/navigation"
import {
  CopyIcon,
  InfoCircledIcon,
  TrashIcon,
  UpdateIcon,
} from "@radix-ui/react-icons"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SubmitButton } from "@/components/submit-button"

export interface ScimConfig {
  externalId: string
  scimEndpointUrl: string
}

interface Props {
  scimConfig: ScimConfig
}

export function ScimForm({ scimConfig }: Props) {
  const { connectionId } = useParams<{ connectionId: string }>()
  const SCIM_ENDPOINT_URL = `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/scim/v2/connections/${connectionId}/`

  const tokens = [
    {
      token_id: "tok_z8lyPmRJYYfdJGWl",
      last_used_at: "2024-07-02T08:18:40.741Z",
      created_at: "2024-07-02T08:18:40.741Z",
    },
  ]

  return (
    <Card>
      <form
        action={async (formData: FormData) => {
          // const { error } = await updateConnection(connection.id, formData)
          // if (error) {
          //   toast.error(error)
          // } else {
          //   toast.success("The connection has been updated.")
          // }
        }}
      >
        <CardHeader>
          <CardTitle>Sync user profiles using SCIM</CardTitle>
          <CardDescription>
            Allow an identity provider or other SCIM client to sync user
            profiles to your organization using the SCIM 2.0 protocol.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="external_id">User ID Attribute</Label>
            <Input
              id="external_id"
              name="external_id"
              type="text"
              placeholder="externalId"
              defaultValue={scimConfig.externalId || "externalId"}
            />
            <p className="text-sm text-muted-foreground">
              The attribute that uniquely identifies a user
            </p>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="generate_tokens">Tokens</Label>
            {tokens.length > 0 ? (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Last Used At</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.token_id}>
                        <TableCell className="font-medium">
                          {token.token_id}
                        </TableCell>
                        <TableCell>{token.last_used_at}</TableCell>
                        <TableCell>{token.created_at}</TableCell>
                        <TableCell className="flex justify-end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete token?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you would like to delete this
                                  token? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    // const { error } = await deleteConnection(
                                    //   c.id
                                    // )
                                    // if (error) {
                                    //   return toast.error(error)
                                    // }
                                    // toast.success(
                                    //   "The connection has been deleted."
                                    // )
                                  }}
                                >
                                  Delete token
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  <p>No tokens have been generated yet.</p>
                </div>
                <div>
                  <Button
                    id="generate_tokens"
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <UpdateIcon className="mr-1 size-3" /> Generate Token
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Alert>
            <InfoCircledIcon className="size-4" />
            <AlertTitle>SCIM Endpoint URL</AlertTitle>
            <AlertDescription>
              Copy this URL and provide it to your identity provider or other
              SCIM client
              <div className="mt-2 flex space-x-2">
                <Input
                  className="font-mono"
                  value={SCIM_ENDPOINT_URL}
                  readOnly
                />
                <Button size="icon" variant="outline" type="button">
                  <CopyIcon
                    className="size-4"
                    onClick={async () => {
                      await navigator.clipboard.writeText(SCIM_ENDPOINT_URL)
                      toast.success("SCIM endpoint URL copied to clipboard.")
                    }}
                  />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Update Configuration</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
