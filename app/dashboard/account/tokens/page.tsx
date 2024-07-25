import { appClient } from "@/lib/auth0";
import { PageHeader } from "@/components/page-header";

import { DisplayAccessToken } from "./display-access-token"
import { DisplayIdToken } from "./display-id-token"

export default appClient.withPageAuthRequired(
  async function TokenPage() {
    const session = await appClient.getSession();

    if (!session) {
      return <p>You need to be logged in to view your tokens.</p>;
    }

    const idToken = session?.idToken;
    const accessToken = session?.accessToken;
    const accessTokenScope = session?.accessTokenScope;
    const accessTokenExpiresAt = session?.accessTokenExpiresAt;

    return (
      <div className="space-y-2">
        <PageHeader
          title="Tokens"
          description="View your ID and Access Tokens."
        />

        {idToken ? (
          <DisplayIdToken idToken={idToken} />
        ) : (
          <p>ID Token is not available.</p>
        )}
        
        {accessToken ? (
          <DisplayAccessToken 
            accessToken={accessToken}
            accessTokenScope={accessTokenScope}
            accessTokenExpiresAt={accessTokenExpiresAt}
          />
        ) : (
          <p>Access Token is not available.</p>
        )}

      </div>
    );
  },
  { returnTo: "/dashboard/account/tokens" }
);
