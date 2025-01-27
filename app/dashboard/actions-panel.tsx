import { appClient } from "@/lib/auth0"

export type endpoint = "public" | "private"

const fetchData = async (endpoint: endpoint) => {
  const { accessToken } = await appClient.getAccessToken()

  try {
    const res = await fetch(`http://localhost:8080/api/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      return "failed to fetch data"
    }

    return await res.json()
  } catch (error) {
    return "failed to fetch data"
  }
}

export async function ActionsPanel({ endpoint }: { endpoint?: endpoint }) {
  if (!endpoint) return null

  const data = await fetchData(endpoint)

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <pre className="mt-5 w-full max-w-md rounded-md bg-gray-800 p-4 text-left text-sm text-white">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
