import type { Client as Auth0Client } from "auth0"

export interface Client extends Partial<Auth0Client> {
  app_type: "native" | "spa" | "regular_web" | "non_interactive"
}
