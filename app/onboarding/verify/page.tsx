import { EnvelopeClosedIcon } from "@radix-ui/react-icons"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Create() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="grid gap-2">
          <EnvelopeClosedIcon className="size-5" />
          <span>Verify your e-mail</span>
        </CardTitle>
        <CardDescription>
          Please check your inbox for a verification link to continue creating
          your account.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
