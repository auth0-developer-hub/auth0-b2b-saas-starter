import * as readline from "node:readline/promises"
import { $ } from "execa"

/**
 * Wait for user confirmation before proceeding
 */
export async function confirmWithUser(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await rl.question(`${message} (y/N): `)
  rl.close()

  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
}

/**
 * Wait until an Action is built
 */
export async function waitUntilActionIsBuilt(actionId) {
  while (true) {
    const { stdout } = await $`auth0 actions show ${actionId} --json`
    const action = JSON.parse(stdout)
    if (action.status === "built") {
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}
