import { appClient } from "@/lib/auth0"

export async function ActionsPanel() {
  const token = await appClient.getAccessToken()

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <pre className="mt-5 w-full max-w-md rounded-md bg-gray-800 p-4 text-left text-sm text-white">
        {JSON.stringify(token, null, 2)}
      </pre>
    </div>
  )
}
