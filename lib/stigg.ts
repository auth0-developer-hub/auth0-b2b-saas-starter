import { Stigg } from "@stigg/node-server-sdk"

export const stiggClient = Stigg.initialize({
  apiKey: process.env.STIGG_SERVER_API_KEY,
})

export async function waitForStiggInit() {
  try {
    await stiggClient.waitForInitialization()
  } catch (error) {
    console.error("Stigg failed to initialize", error)
  }
}
