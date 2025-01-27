"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getAccessToken } from '@auth0/nextjs-auth0';

export function ActionsPanel() {
  const [responseData, setResponseData] = useState<string | null>(null)

  async function callApi(endpoint: string) {
    try {
      // 1) Fetch the access token
      const { accessToken } = await getAccessToken();

      // 2) Call your Spring Boot backend
      const res = await fetch(`http://localhost:8080/api/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Spring Boot API returned status ${res.status}`)
      }
      const data = await res.json()
      setResponseData(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setResponseData(`Error: ${err.message}`)
    }
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => callApi("public")}>
          Call /api/public
        </Button>
        <Button variant="outline" onClick={() => callApi("private")}>
          Call /api/private
        </Button>
      </div>

      {responseData && (
        <pre className="mt-5 w-full max-w-md rounded-md bg-gray-800 p-4 text-left text-sm text-white">
          {responseData}
        </pre>
      )}
    </div>
  )
}