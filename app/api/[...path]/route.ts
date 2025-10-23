import { NextResponse, type NextRequest } from "next/server"
import { MyOrgClient } from "auth0-my-org"

import { appClient } from "../../../lib/auth0"

let myOrgClient: MyOrgClient | null = null

interface SdkAction {
  sdkMethod: string;
  hasBody?: boolean;
  isVoid?: boolean;
}

type RestAction = Partial<SdkAction> & { withId?: string; withoutId?: string }

interface SdkRoute {
  basePath: string;
  sdkPath: string[];
  actions: {
    [method in 'GET' | 'POST' | 'PATCH' | 'DELETE']?: RestAction;
  };
  specialActions?: Record<string, SdkAction & { method: string }>;
}


function getClient(): MyOrgClient {
  if (myOrgClient == null) {
    myOrgClient = new MyOrgClient({
      domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      tokenProvider: {
        async getToken() {
          const token = (await appClient.getAccessToken())?.token
          if (token == null) throw new Error("Missing access token")

          return token
        },
      },
    })
  }

  return myOrgClient
}

const createErrorResponse = (
  message: string,
  status: number,
  details?: string
) => {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status }
  )
}

const sdkRoutes: SdkRoute[] = [
  {
    basePath: "/my-org/details",
    sdkPath: ["organizationDetails"],
    actions: {
      GET: { withoutId: "get" },
      PATCH: { withoutId: "update", hasBody: true },
    },
  },
  {
    basePath: "/my-org/identity-providers",
    sdkPath: ["organization", "identityProviders"],
    actions: {
      GET: { withId: "get", withoutId: "list" },
      POST: { withId: "create", withoutId: "create", hasBody: true },
      PATCH: { withId: "update", hasBody: true },
      DELETE: { withId: "delete", isVoid: true },
    },
    specialActions: {
      detach: { method: "POST", sdkMethod: "detach", isVoid: true },
    },
  },
]

const proxyHandler = async (req: NextRequest) => {
  try {
    const session = await appClient.getSession()
    if (!session) {
      return createErrorResponse(
        "Not authenticated",
        401,
        "No user session found."
      )
    }

    const path = req.nextUrl.pathname.substring("/api".length)
    const method = (req.method ?? "GET") as keyof SdkRoute["actions"]

    const route = sdkRoutes.find((r) => path.startsWith(r.basePath))
    if (!route) {
      return createErrorResponse(
        "Route not found",
        404,
        `No handler for ${method} ${path}`
      )
    }

    const remainingPath = path.substring(route.basePath.length)
    const pathSegments = remainingPath.split("/").filter(Boolean)
    const actionSegment = pathSegments.length > 1 ? pathSegments[1] : undefined
    const specialAction = actionSegment
      ? route.specialActions?.[actionSegment]
      : undefined
    let sdkAction: SdkAction | undefined
    const id = specialAction ? pathSegments[0] : pathSegments[0] || undefined
    if (specialAction && method === specialAction.method) {
      sdkAction = specialAction
    } else {
      const actionMap = route.actions[method]
      if (actionMap) {
        const sdkMethod = id ? actionMap.withId : actionMap.withoutId
        if (sdkMethod) sdkAction = { ...actionMap, sdkMethod }
      }
    }
    if (!sdkAction?.sdkMethod) {
      return createErrorResponse("Method not supported for this route", 405)
    }

    const myOrgClient = await getClient()

    const targetObject = route.sdkPath.reduce(
      (
        obj: Record<string, unknown> | null,
        key: string
      ): Record<string, unknown> | null => {
        if (!obj) {
          return null
        }
        const nextObj = obj[key]
        return nextObj && typeof nextObj === "object"
          ? (nextObj as Record<string, unknown>)
          : null
      },
      myOrgClient as unknown as Record<string, unknown>
    )

    if (!targetObject) {
      return createErrorResponse(
        "Invalid SDK path",
        500,
        `Could not resolve path: ${route.sdkPath.join(".")}`
      )
    }

    const sdkMethod = targetObject[sdkAction.sdkMethod]
    if (typeof sdkMethod !== "function") {
      return createErrorResponse(
        "Method not found on SDK object",
        404,
        `Action "${sdkAction.sdkMethod}" is not a function.`
      )
    }

    const args: (string | object)[] = id ? [id] : []
    if (sdkAction.hasBody) {
      const text = await req.text()
      if (text) args.push(JSON.parse(text))
    }

    const result = await sdkMethod.apply(targetObject, args)

    if (sdkAction.isVoid) {
      return new NextResponse(null, { status: 204 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.log('error?', error)
    if (error instanceof Error) {
      if (error.message.includes("No access token")) {
        return createErrorResponse(
          "Unauthorized",
          401,
          "Failed to obtain access token."
        )
      }
      return createErrorResponse("Internal proxy error", 500, error.message)
    }
    return createErrorResponse(
      "Internal proxy error",
      500,
      "An unknown error occurred."
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
