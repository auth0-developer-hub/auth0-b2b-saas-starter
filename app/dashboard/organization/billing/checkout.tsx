import * as React from "react"
import { Plan, Checkout as StiggCheckout } from "@stigg/react-sdk"
import { CheckoutTheme } from "@stigg/react-sdk/src/components/checkout/configurations/theme"
import { DeepPartial } from "@stigg/react-sdk/src/types"

const checkoutTheme: DeepPartial<CheckoutTheme> = {
  backgroundColor: "#0E0E10",
  borderColor: "#303036",
  paymentInputBackgroundColor: "#000",
  paymentInputBorderRadius: "4px",
  textColor: "#FAFAFA",
  primary: "#FAFAFA",
  summaryBackgroundColor: "#303036",
  paymentInputBorderColor: "#303036",
}

type CheckoutProps = {
  plan: Plan
  onCheckout: () => Promise<void>
}

export function Checkout({ plan, onCheckout }: CheckoutProps) {
  return (
    <StiggCheckout
      planId={plan.id}
      theme={checkoutTheme}
      textOverrides={{
        summary: {
          checkoutSuccessText: "Checkout complete!",
        },
        checkoutButton: {
          nextText: "Continue",
          noChangesText: "No changes",
          updateText: "Update subscription",
          downgradeToFreeText: "Downgrade",
          upgradeText: "Pay",
        },
      }}
      onCheckoutCompleted={async ({ success, error }) => {
        if (success) {
          await onCheckout()
        } else {
          console.error(error)
        }
      }}
    />
  )
}
