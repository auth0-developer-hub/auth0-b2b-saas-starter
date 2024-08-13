import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_SERVER,
} from "next/constants"
import { Stigg } from "@stigg/node-server-sdk"

// Don't open websockets/send requests during build
const isServerPhase =
  process.env.NEXT_PHASE === PHASE_PRODUCTION_SERVER ||
  process.env.NEXT_PHASE === PHASE_DEVELOPMENT_SERVER

export const stiggClient = Stigg.initialize({
  apiKey: process.env.STIGG_SERVER_API_KEY,
  realtimeUpdatesEnabled: isServerPhase,
  enableRemoteConfig: isServerPhase,
})

export async function waitForStiggInit() {
  try {
    await stiggClient.waitForInitialization()
  } catch (error) {
    console.error("Stigg failed to initialize", error)
  }
}
