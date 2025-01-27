"use client"

import { ReactNode, useState } from "react"

import { endpoint } from "./actions-panel"

export const ActionsPanelSwitch = ({
  publicSlot,
  privateSlot,
  privateScopedSlot
}: {
  publicSlot: ReactNode
  privateSlot: ReactNode
  privateScopedSlot: ReactNode
}) => {
  const [endpoint, setEndpoint] = useState<endpoint | null>(null)

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex gap-4">
            <button
                onClick={() => setEndpoint("public")}
                className="rounded-md bg-blue-500 px-4 py-2 text-white"
            >
                Fetch Public Data
            </button>
            <button
                onClick={() => setEndpoint("private")}
                className="rounded-md bg-blue-500 px-4 py-2 text-white"
            >
                Fetch Private Data
            </button>
            <button
                onClick={() => setEndpoint("private-scoped")}
                className="rounded-md bg-blue-500 px-4 py-2 text-white"
            >
                Fetch Private Scoped Data
            </button>
        </div>
        {endpoint === "public" ? publicSlot : null}
        {endpoint === "private" ? privateSlot : null}
        {endpoint === "private-scoped" ? privateScopedSlot : null}
    </div>
  )
}
