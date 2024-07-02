export interface MfaPolicy {
  enforce: boolean
  providers: string[]
  skipForDomains: string[]
}

export const DEFAULT_MFA_POLICY: MfaPolicy = {
  enforce: false,
  providers: [],
  skipForDomains: [],
}

export const SUPPORTED_PROVIDERS = ["otp", "webauthn-roaming"]
