import * as React from "react"
import { useState } from "react"
import {
  Plan,
  Paywall as StiggPaywall,
  useStiggContext,
} from "@stigg/react-sdk"

import { Checkout } from "@/app/dashboard/organization/billing/checkout"

export function Paywall() {
  const { refreshData } = useStiggContext()
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>()
  return (
    <>
      {selectedPlan ? (
        <Checkout
          plan={selectedPlan}
          onCheckout={async () => {
            await refreshData()
            setSelectedPlan(undefined)
          }}
        />
      ) : (
        <StiggPaywall
          textOverrides={{
            price: {
              free: {
                price: "",
              },
            },
          }}
          onPlanSelected={({ plan }) => setSelectedPlan(plan)}
        />
      )}
    </>
  )
}
