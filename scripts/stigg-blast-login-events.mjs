import crypto from "crypto"
import { Stigg } from "@stigg/node-server-sdk"

const apiKey = process.env.STIGG_SERVER_API_KEY
const [organizationId, numOfEvents = 1] = process.argv.slice(2)

if (!organizationId) {
  throw new Error("Organization ID is required")
}

const stigg = Stigg.initialize({
  apiKey,
  realtimeUpdatesEnabled: false,
})

await stigg.waitForInitialization()

const events = [];
for (let i = 0; i < numOfEvents; i++) {
  const userId = `fake-user-${Math.random().toString(36).substring(3)}`
  const eventName = `user-login`

  // generate a unique idempotency key for the event
  const idempotencyKey = crypto
    .createHash("md5")
    .update(`${userId}:${organizationId}:${eventName}:${Date.now()}`)
    .digest("hex")

  const anEvent = {
    customerId: organizationId,
    eventName,
    idempotencyKey,
    dimensions: {
      user_id: userId,
    },
  }

  console.log(`Created event: `, anEvent)
  events.push(anEvent);
}

try {
  await stigg.reportEvent(events)
} catch (error) {
  console.error("Failed to report events", error)
}

console.log(`Finished, sent total of ${numOfEvents} events.`)
