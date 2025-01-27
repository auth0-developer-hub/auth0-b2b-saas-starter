import {NextRequest, NextResponse} from "next/server";
import {getSession} from "@auth0/nextjs-auth0/edge";

export async function GET(request: NextRequest) {
    // Grab the user session using the request context (cookies, headers, etc.)
    // @ts-ignore
    const session = await getSession(request);

    // Log the access token to your server logs
    console.log("Access Token:", session?.accessToken);

    // Return a simple response so you know it's done
    return NextResponse.json({token: session?.accessToken});
}