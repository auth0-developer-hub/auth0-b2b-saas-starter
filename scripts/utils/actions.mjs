import { readFile } from "node:fs/promises"
import { $ } from "execa"
import ora from "ora"

import { confirmWithUser, waitUntilActionIsBuilt } from "./helpers.mjs"

// Constants
export const CUSTOM_CLAIMS_NAMESPACE = "https://example.com"

/**
 * Update an existing action with new code and secrets
 */
async function updateAction(actionId, code, secrets, dependencies = []) {
  const spinner = ora({
    text: `Updating action code and secrets`,
  }).start()

  try {
    // Update the action with new code
    const updateData = {
      code,
    }

    await $`auth0 api patch actions/${actionId} --data ${JSON.stringify(updateData)}`

    // Update secrets if provided
    if (secrets && secrets.length > 0) {
      for (const secret of secrets) {
        const [key, value] = secret.split("=")
        await $`auth0 api patch actions/${actionId}/secrets --data ${JSON.stringify({ secrets: [{ name: key, value }] })}`
      }
    }

    // Update dependencies if provided
    if (dependencies && dependencies.length > 0) {
      const depsData = {
        dependencies: dependencies.map((dep) => {
          const [name, version] = dep.split("=")
          return { name, version }
        }),
      }
      await $`auth0 api patch actions/${actionId} --data ${JSON.stringify(depsData)}`
    }

    await waitUntilActionIsBuilt(actionId)

    // Deploy the updated action
    await $`auth0 actions deploy ${actionId} --json --no-input`

    spinner.succeed("Action updated and deployed")
  } catch (e) {
    spinner.fail("Failed to update action")
    throw e
  }
}

/**
 * Ensure Security Policies Action exists
 */
export async function ensureSecurityPoliciesAction(
  existing,
  dashboardClientId
) {
  const existingAction = existing.actions.find(
    (a) => a.name === "Security Policies"
  )

  if (existingAction) {
    console.log("\n⚠️  Security Policies Action already exists")
    const shouldUpdate = await confirmWithUser(
      "Do you want to update it with the latest code? (yes/no): "
    )

    if (shouldUpdate) {
      const code = await readFile("./actions/security-policies.js", {
        encoding: "utf-8",
      })
      await updateAction(existingAction.id, code, [
        `DASHBOARD_CLIENT_ID=${dashboardClientId}`,
      ])
      return existingAction
    } else {
      const spinner = ora({
        text: `Using existing Security Policies Action without changes`,
      }).start()
      spinner.succeed()
      return existingAction
    }
  }

  const spinner = ora({
    text: `Creating Security Policies Action`,
  }).start()

  try {
    const code = await readFile("./actions/security-policies.js", {
      encoding: "utf-8",
    })

    // prettier-ignore
    const createActionArgs = [
      "actions", "create",
      "--name", "Security Policies",
      "--code", code,
      "--trigger", "post-login",
      "--secret", `DASHBOARD_CLIENT_ID=${dashboardClientId}`,
      "--json", "--no-input"
    ];

    const { stdout } = await $`auth0 ${createActionArgs}`
    const action = JSON.parse(stdout)

    await waitUntilActionIsBuilt(action.id)

    // prettier-ignore
    const deployActionArgs = [
      "actions", "deploy", action.id,
      "--json", "--no-input"
    ];
    await $`auth0 ${deployActionArgs}`

    spinner.succeed("Created Security Policies Action")
    return action
  } catch (e) {
    spinner.fail(`Failed to create the Security Policies Action`)
    throw e
  }
}

/**
 * Ensure Add Default Role Action exists
 */
export async function ensureAddDefaultRoleAction(
  existing,
  domain,
  managementClientId,
  managementClientSecret,
  memberRoleId
) {
  const existingAction = existing.actions.find(
    (a) => a.name === "Add Default Role"
  )

  if (existingAction) {
    console.log("\n⚠️  Add Default Role Action already exists")
    const shouldUpdate = await confirmWithUser(
      "Do you want to update it with the latest code? (yes/no): "
    )

    if (shouldUpdate) {
      const code = await readFile("./actions/add-default-role.js", {
        encoding: "utf-8",
      })
      await updateAction(
        existingAction.id,
        code,
        [
          `DOMAIN=${domain}`,
          `CLIENT_ID=${managementClientId}`,
          `CLIENT_SECRET=${managementClientSecret}`,
          `MEMBER_ROLE_ID=${memberRoleId}`,
        ],
        ["auth0=4.4.0"]
      )
      return existingAction
    } else {
      const spinner = ora({
        text: `Using existing Add Default Role Action without changes`,
      }).start()
      spinner.succeed()
      return existingAction
    }
  }

  const spinner = ora({
    text: `Creating Add Default Role Action`,
  }).start()

  try {
    const code = await readFile("./actions/add-default-role.js", {
      encoding: "utf-8",
    })

    // prettier-ignore
    const createActionArgs = [
      "actions", "create",
      "--name", "Add Default Role",
      "--code", code,
      "--trigger", "post-login",
      "--secret", `DOMAIN=${domain}`,
      "--secret", `CLIENT_ID=${managementClientId}`,
      "--secret", `CLIENT_SECRET=${managementClientSecret}`,
      "--secret", `MEMBER_ROLE_ID=${memberRoleId}`,
      "--dependency", "auth0=4.4.0",
      "--json", "--no-input"
    ];

    const { stdout } = await $`auth0 ${createActionArgs}`
    const action = JSON.parse(stdout)

    await waitUntilActionIsBuilt(action.id)

    // prettier-ignore
    const deployActionArgs = [
      "actions", "deploy", action.id,
      "--json", "--no-input"
    ];
    await $`auth0 ${deployActionArgs}`

    spinner.succeed("Created Add Default Role Action")
    return action
  } catch (e) {
    spinner.fail(`Failed to create the Add Default Role Action`)
    throw e
  }
}

/**
 * Ensure Add Role to Tokens Action exists
 */
export async function ensureAddRoleToTokensAction(existing) {
  const existingAction = existing.actions.find(
    (a) => a.name === "Add Role to Tokens"
  )

  if (existingAction) {
    console.log("\n⚠️  Add Role to Tokens Action already exists")
    const shouldUpdate = await confirmWithUser(
      "Do you want to update it with the latest code? (yes/no): "
    )

    if (shouldUpdate) {
      const code = await readFile("./actions/add-role-to-tokens.js", {
        encoding: "utf-8",
      })
      await updateAction(existingAction.id, code, [
        `CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}`,
      ])
      return existingAction
    } else {
      const spinner = ora({
        text: `Using existing Add Role to Tokens Action without changes`,
      }).start()
      spinner.succeed()
      return existingAction
    }
  }

  const spinner = ora({
    text: `Creating Add Role to Tokens Action`,
  }).start()

  try {
    const code = await readFile("./actions/add-role-to-tokens.js", {
      encoding: "utf-8",
    })

    // prettier-ignore
    const createActionArgs = [
      "actions", "create",
      "--name", "Add Role to Tokens",
      "--code", code,
      "--trigger", "post-login",
      "--secret", `CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}`,
      "--json", "--no-input"
    ];

    const { stdout } = await $`auth0 ${createActionArgs}`
    const action = JSON.parse(stdout)

    await waitUntilActionIsBuilt(action.id)

    // prettier-ignore
    const deployActionArgs = [
      "actions", "deploy", action.id,
      "--json", "--no-input"
    ];
    await $`auth0 ${deployActionArgs}`

    spinner.succeed("Created Add Role to Tokens Action")
    return action
  } catch (e) {
    spinner.fail(`Failed to create the Add Role to Tokens Action`)
    throw e
  }
}

/**
 * Update trigger bindings for Actions
 */
export async function updateActionTriggerBindings(
  addDefaultRoleAction,
  addRoleToTokensAction,
  securityPoliciesAction
) {
  const spinner = ora({
    text: `Updating trigger bindings for Actions`,
  }).start()

  try {
    // prettier-ignore
    const updateTriggerBindingsArgs = [
      "api", "patch", "actions/triggers/post-login/bindings",
      "--data", JSON.stringify({
        "bindings": [
          {
            "ref": {
              "type": "action_name",
              "value": addDefaultRoleAction.name
            },
            display_name: addDefaultRoleAction.name
          },
          {
            "ref": {
              "type": "action_name",
              "value": addRoleToTokensAction.name
            },
            display_name: addRoleToTokensAction.name
          },
          {
            "ref": {
              "type": "action_name",
              "value": securityPoliciesAction.name
            },
            display_name: securityPoliciesAction.name
          }
        ]
      }),
    ];

    await $`auth0 ${updateTriggerBindingsArgs}`
    spinner.succeed()
  } catch (e) {
    spinner.fail(`Failed to update trigger bindings for Actions`)
    throw e
  }
}
