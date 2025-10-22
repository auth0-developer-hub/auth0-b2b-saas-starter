import { NextResponse, type NextRequest } from "next/server"
import { MyOrgClient, type Auth0MyOrg } from "auth0-my-org"

import { appClient } from "../../../lib/auth0"

let myOrgClient: MyOrgClient | null = null

function getClient(): MyOrgClient {
  if (myOrgClient == null) {
    myOrgClient = new MyOrgClient({
      domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      tokenProvider: {
        async getToken() {
          const token = (await appClient.getAccessToken({
            scope: 'read:my_org:details update:my_org:details',
            refresh: true
            // audience: 'https://metcodermyorg.test-iamda-myorgapipocweek1.auth0c.com/my-org'
          }))?.token
          // const token = (await appClient.getAccessToken())?.token
          console.log('token', token)
          if (token == null) throw new Error("Missing access token")

          return token
        },
      },
    })
  }

  return myOrgClient
}

const routeHandlers = {
  "GET /my-org/details": async (myOrgClient: MyOrgClient) => {
    return await myOrgClient.organizationDetails.get()
  },
  "PATCH /my-org/details": async (
    myOrgClient: MyOrgClient,
    body: Auth0MyOrg.UpdateOrganizationDetailsRequestContent
  ) => {
    return await myOrgClient.organizationDetails.update(body)
  },
}

const proxyHandler = async (req: NextRequest) => {
  console.log('called?')
  try {
    const path = req.nextUrl.pathname.substring("/api".length)

    // Check authentication
    const session = await appClient.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated", details: "No user session found." },
        { status: 401 }
      )
    }

    // Find route handler
    const routeKey = `${req.method} ${path}` as keyof typeof routeHandlers
    const handler = routeHandlers[routeKey]

    if (!handler) {
      return NextResponse.json(
        {
          error: "Route not found",
          details: `No handler for ${req.method} ${path}`,
        },
        { status: 404 }
      )
    }

    // Create MyOrgClient and handle SDK route
    const myOrgClient = getClient()

    let body
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      body = await req.json()
    }

    const result = await handler(myOrgClient, body)
    return NextResponse.json(result)
  } catch (error) {
    console.log('error?', error)
    if (error instanceof Error) {
      if (error.message.includes("No access token")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            details: "Failed to obtain access token.",
          },
          { status: 401 }
        )
      }
      if (error.message.includes("No current session")) {
        return NextResponse.json(
          {
            error: "Authentication required",
            details: "Please log in again.",
          },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal proxy error",
        details: (error as Error).message ?? "An unknown error occurred.",
      },
      { status: 401 }
    )
  }
}

export {
  proxyHandler as GET,
  proxyHandler as POST,
  proxyHandler as PUT,
  proxyHandler as PATCH,
  proxyHandler as DELETE,
  proxyHandler as OPTIONS,
}
