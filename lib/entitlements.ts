import { Claims } from "@auth0/nextjs-auth0"

import { stiggClient } from "@/lib/stigg"

export const features = {
  sso: "feature-sso",
  mau: "feature-mau",
}

export type Feature = keyof typeof features

function getCustomerId(user: Claims) {
  return user.org_id
}

export async function checkAccess(user: Claims, feature: Feature) {
  const customerId = getCustomerId(user)
  const featureId = features[feature]
  const { hasAccess } = await stiggClient.getBooleanEntitlement({
    customerId,
    featureId,
  })
  return hasAccess
}
