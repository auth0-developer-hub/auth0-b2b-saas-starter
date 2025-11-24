import { $ } from "execa"

/**
 * Make a generic API call using auth0 CLI
 */
export async function auth0ApiCall(method, endpoint, data = null) {
  const args = ["api", method, endpoint]

  if (data) {
    args.push("--data", JSON.stringify(data))
  }

  try {
    const { stdout } = await $`auth0 ${args}`
    return stdout ? JSON.parse(stdout) : null
  } catch (e) {
    // Return null on error instead of throwing
    return null
  }
}
