"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import {
  CopyIcon,
  InfoCircledIcon,
  TrashIcon,
  UpdateIcon,
} from "@radix-ui/react-icons"
import { format, formatDistance } from "date-fns"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SubmitButton } from "@/components/submit-button"

import {
  createScimConfig,
  createScimToken,
  deleteScimConfig,
  deleteScimToken,
  updateScimConfig,
} from "./actions"

interface Props {
  scimConfig: {
    userIdAttribute: string
  } | null
  scimTokens: Array<{
    id: string
    lastUsedAt?: string
    createdAt: string
  }>
}

export function ScimForm({ scimConfig, scimTokens }: Props) {
  const [generatingToken, setGeneratingToken] = useState(false)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [token, setToken] = useState("")
  const { connectionId } = useParams<{ connectionId: string }>()
  const SCIM_ENDPOINT_URL = `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/scim/v2/connections/${connectionId}/`

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div className="space-y-2">
              <CardTitle>Sync user profiles using SCIM</CardTitle>
              <CardDescription>
                Allow an identity provider or other SCIM client to sync user
                profiles to your organization using the SCIM 2.0 protocol.
              </CardDescription>
            </div>
            <div>
              <Switch
                id="enable-scim"
                defaultChecked={!!scimConfig}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    const { error } = await createScimConfig(connectionId)
                    if (error) {
                      return toast.error(error)
                    }

                    toast.success("SCIM has been enabled.")
                  } else {
                    const { error } = await deleteScimConfig(connectionId)
                    if (error) {
                      return toast.error(error)
                    }

                    toast.success("SCIM has been disabled.")
                  }
                }}
              />
              <Label className="sr-only" htmlFor="enable-scim">
                Enable SCIM
              </Label>
            </div>
          </div>
        </CardHeader>
        {scimConfig && (
          <form
            action={async (formData: FormData) => {
              const { error } = await updateScimConfig(connectionId, formData)

              if (error) {
                toast.error(error)
                return
              }

              toast.success("SCIM configuration updated successfully.")
            }}
          >
            <CardContent className="grid gap-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="user_id_attribute">User ID Attribute</Label>
                <Input
                  id="user_id_attribute"
                  name="user_id_attribute"
                  type="text"
                  placeholder="externalId"
                  defaultValue={scimConfig?.userIdAttribute || "externalId"}
                />
                <p className="text-sm text-muted-foreground">
                  The attribute that uniquely identifies a user
                </p>
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="generate_tokens">Tokens</Label>
                {scimTokens.length > 0 ? (
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
                        {scimTokens.map((token) => (
                          <TableRow key={token.id}>
                            <TableCell className="font-medium">
                              {token.id}
                            </TableCell>
                            <TableCell>
                              {token.lastUsedAt
                                ? formatDistance(token.lastUsedAt, new Date())
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              {format(token.createdAt, "MMM d, yyyy")}
                            </TableCell>
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
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        const { error } = await deleteScimToken(
                                          connectionId,
                                          token.id
                                        )
                                        if (error) {
                                          return toast.error(error)
                                        }
                                        toast.success(
                                          "The token has been deleted."
                                        )
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
                        onClick={async () => {
                          setGeneratingToken(true)

                          const res = await createScimToken(connectionId)
                          if (res.error) {
                            setGeneratingToken(false)
                            return toast.error(res.error)
                          }

                          setGeneratingToken(false)
                          toast.success(
                            "The token has been created successfully."
                          )

                          // @ts-ignore
                          setToken(res.token)
                          setShowTokenDialog(true)
                        }}
                      >
                        <UpdateIcon
                          className={cn(
                            "mr-1 size-3",
                            generatingToken && "animate-spin"
                          )}
                        />{" "}
                        Generate Token
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Alert>
                <InfoCircledIcon className="size-4" />
                <AlertTitle>SCIM Endpoint URL</AlertTitle>
                <AlertDescription>
                  Copy this URL and provide it to your identity provider or
                  other SCIM client
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
                          toast.success(
                            "SCIM endpoint URL copied to clipboard."
                          )
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
        )}
      </Card>

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>SCIM Bearer Token</DialogTitle>
            <DialogDescription>
              Copy the token and save it in a secure location. This token will
              not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="token" className="sr-only">
                Token
              </Label>
              <Input id="token" defaultValue={token} readOnly />
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(token)
                toast.success("SCIM token copied to clipboard.")
              }}
            >
              <span className="sr-only">Copy</span>
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
