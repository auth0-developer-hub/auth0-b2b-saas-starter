import { readFile } from "node:fs/promises"
import { $ } from "execa"
import ora from "ora"

import { ChangeAction, createChangeItem } from "./change-plan.mjs"
import { waitUntilActionIsBuilt } from "./helpers.mjs"

// Constants
export const CUSTOM_CLAIMS_NAMESPACE = "https://example.com"

// ============================================================================
// CHECK FUNCTIONS - Determine what changes are needed
// ============================================================================

/**
 * Check if Security Policies Action needs changes
 * Compares code with existing action
 */
export async function checkSecurityPoliciesActionChanges(existingActions) {
  const existingAction = existingActions.find(
    (a) => a.name === "Security Policies"
  )

  if (!existingAction) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Security Policies Action",
      name: "Security Policies",
    })
  }

  // Read the desired code
  const desiredCode = await readFile("./actions/security-policies.js", "utf8")

  // Get the current action code
  const { stdout } = await $`auth0 api get actions/actions/${existingAction.id}`
  const currentAction = JSON.parse(stdout)

  // Compare code (ignoring whitespace differences)
  const currentCodeNormalized = currentAction.code?.trim()
  const desiredCodeNormalized = desiredCode.trim()

  if (currentCodeNormalized !== desiredCodeNormalized) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Security Policies Action",
      name: "Security Policies",
      existing: existingAction,
      summary: "Update code",
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Security Policies Action",
    name: "Security Policies",
    existing: existingAction,
  })
}

/**
 * Check if Add Default Role Action needs changes
 * Compares code with existing action
 */
export async function checkAddDefaultRoleActionChanges(existingActions) {
  const existingAction = existingActions.find(
    (a) => a.name === "Add Default Role"
  )

  if (!existingAction) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Add Default Role Action",
      name: "Add Default Role",
    })
  }

  // Read the desired code
  const desiredCode = await readFile("./actions/add-default-role.js", "utf8")

  // Get the current action code
  const { stdout } = await $`auth0 api get actions/actions/${existingAction.id}`
  const currentAction = JSON.parse(stdout)

  // Compare code (ignoring whitespace differences)
  const currentCodeNormalized = currentAction.code?.trim()
  const desiredCodeNormalized = desiredCode.trim()

  if (currentCodeNormalized !== desiredCodeNormalized) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Add Default Role Action",
      name: "Add Default Role",
      existing: existingAction,
      summary: "Update code",
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Add Default Role Action",
    name: "Add Default Role",
    existing: existingAction,
  })
}

/**
 * Check if Add Role to Tokens Action needs changes
 * Compares code with existing action
 */
export async function checkAddRoleToTokensActionChanges(existingActions) {
  const existingAction = existingActions.find(
    (a) => a.name === "Add Role to Tokens"
  )

  if (!existingAction) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Add Role to Tokens Action",
      name: "Add Role to Tokens",
    })
  }

  // Read the desired code
  const desiredCode = await readFile("./actions/add-role-to-tokens.js", "utf8")

  // Get the current action code
  const { stdout } = await $`auth0 api get actions/actions/${existingAction.id}`
  const currentAction = JSON.parse(stdout)

  // Compare code (ignoring whitespace differences)
  const currentCodeNormalized = currentAction.code?.trim()
  const desiredCodeNormalized = desiredCode.trim()

  if (currentCodeNormalized !== desiredCodeNormalized) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Add Role to Tokens Action",
      name: "Add Role to Tokens",
      existing: existingAction,
      summary: "Update code",
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Add Role to Tokens Action",
    name: "Add Role to Tokens",
    existing: existingAction,
  })
}

/**
 * Check if Action Trigger Bindings need changes
 * Compares current bindings with desired bindings
 */
export async function checkActionTriggerBindingsChanges(existingActions) {
  try {
    // Get current bindings for post-login trigger
    const { stdout } =
      await $`auth0 api get actions/triggers/post-login/bindings`
    const currentBindings = JSON.parse(stdout)

    // Build desired binding order based on existing actions
    const securityPoliciesAction = existingActions.find(
      (a) => a.name === "Security Policies"
    )
    const addDefaultRoleAction = existingActions.find(
      (a) => a.name === "Add Default Role"
    )
    const addRoleToTokensAction = existingActions.find(
      (a) => a.name === "Add Role to Tokens"
    )

    // If any action doesn't exist yet, we'll need to update bindings later
    if (
      !securityPoliciesAction ||
      !addDefaultRoleAction ||
      !addRoleToTokensAction
    ) {
      return createChangeItem(ChangeAction.UPDATE, {
        resource: "Action Trigger Bindings",
        summary: "Update post-login trigger bindings (actions not yet created)",
      })
    }

    // Check if current bindings match desired order
    // Correct order: Add Default Role -> Add Role to Tokens -> Security Policies
    const desiredOrder = [
      addDefaultRoleAction.id,
      addRoleToTokensAction.id,
      securityPoliciesAction.id,
    ]

    const currentOrder = currentBindings.bindings?.map((b) => b.action.id) || []

    // Compare arrays
    const bindingsMatch =
      desiredOrder.length === currentOrder.length &&
      desiredOrder.every((id, index) => id === currentOrder[index])

    if (bindingsMatch) {
      return createChangeItem(ChangeAction.SKIP, {
        resource: "Action Trigger Bindings",
        summary: "Post-login trigger bindings already up-to-date",
      })
    }

    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Action Trigger Bindings",
      summary: "Update post-login trigger bindings",
    })
  } catch (e) {
    // If we can't fetch current bindings, assume we need to update
    console.warn(
      `⚠️  Warning: Could not check current action bindings: ${e.message}`
    )
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Action Trigger Bindings",
      summary: "Update post-login trigger bindings (couldn't verify current)",
    })
  }
}

// ============================================================================
// APPLY FUNCTIONS - Execute changes based on cached plan
// ============================================================================

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
 * Apply Security Policies Action changes
 */
export async function applySecurityPoliciesActionChanges(
  changePlan,
  dashboardClientId
) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Using existing Security Policies Action without changes`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
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

  if (changePlan.action === ChangeAction.UPDATE) {
    const code = await readFile("./actions/security-policies.js", {
      encoding: "utf-8",
    })
    await updateAction(changePlan.existing.id, code, [
      `DASHBOARD_CLIENT_ID=${dashboardClientId}`,
    ])
    return changePlan.existing
  }
}

/**
 * Apply Add Default Role Action changes
 */
export async function applyAddDefaultRoleActionChanges(
  changePlan,
  domain,
  managementClientId,
  managementClientSecret,
  memberRoleId
) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Using existing Add Default Role Action without changes`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
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

  if (changePlan.action === ChangeAction.UPDATE) {
    const code = await readFile("./actions/add-default-role.js", {
      encoding: "utf-8",
    })
    await updateAction(
      changePlan.existing.id,
      code,
      [
        `DOMAIN=${domain}`,
        `CLIENT_ID=${managementClientId}`,
        `CLIENT_SECRET=${managementClientSecret}`,
        `MEMBER_ROLE_ID=${memberRoleId}`,
      ],
      ["auth0=4.4.0"]
    )
    return changePlan.existing
  }
}

/**
 * Apply Add Role to Tokens Action changes
 */
export async function applyAddRoleToTokensActionChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Using existing Add Role to Tokens Action without changes`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
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

  if (changePlan.action === ChangeAction.UPDATE) {
    const code = await readFile("./actions/add-role-to-tokens.js", {
      encoding: "utf-8",
    })
    await updateAction(changePlan.existing.id, code, [
      `CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}`,
    ])
    return changePlan.existing
  }
}

/**
 * Apply Action Trigger Bindings changes
 */
export async function applyActionTriggerBindingsChanges(
  changePlan,
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
    spinner.succeed("Updated trigger bindings")
  } catch (e) {
    spinner.fail(`Failed to update trigger bindings for Actions`)
    throw e
  }
}
