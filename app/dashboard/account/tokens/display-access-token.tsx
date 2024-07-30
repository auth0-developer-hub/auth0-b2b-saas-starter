"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import styles from './page.module.css';
import { decodeToken, renderTokenDetails } from './functions-token';

interface Props {
    accessToken: string;
    accessTokenScope?: string;
    accessTokenExpiresAt?: number;
}

export function DisplayAccessToken({ accessToken, accessTokenScope, accessTokenExpiresAt }: Props) {
  const decodedToken = decodeToken(accessToken);
  const validToken = decodedToken !== null;

  const renderToken = validToken ? decodedToken : {
    "scope": accessTokenScope || "N/A",
    "exp": accessTokenExpiresAt || "N/A"
};

  return (
    <Card className={styles['token-container']}>
      <CardHeader>
        <CardTitle>Your Access Token</CardTitle>
        <CardDescription>This is the access this application has to resources on your behalf.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderTokenDetails(renderToken)}

        <p className={styles['jwtio']}>
          <a href={`https://jwt.io/?token=${accessToken}`} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://jwt.io/img/badge.svg"
              alt="View on JWT.io"
              width="138"
              height="35"
            />
          </a>
        </p>

        {!validToken && (
            <div className={styles['notes']}>
            <p>
            ⚠️ Note: The access token is obfuscated due to the absence of an explicitly defined audience. When no audience is specified, Auth0 limits the information included in the token to protect sensitive data. This means the token not contain detailed claims and could appear incomplete. 
            </p>
            <p>
            Although obfuscated, these tokens can still be used to access user information via the Auth0 API. You can exchange the token for detailed user profile data by calling the appropriate endpoints, such as the `/userinfo` endpoint, provided by Auth0. This ensures that sensitive information is not exposed in the token itself but can still be retrieved securely.
            </p>
            <p>
            Please check the additional information on the documentation page:&nbsp;
            <a href="https://auth0.com/docs/secure/tokens/access-tokens/get-access-tokens">Get Access Tokens</a>
            </p>
            <p>In order to show a full Access Token, please set the <strong>AUTH0_AUDIENCE</strong> environment variable.</p>
            </div>
        )}
      </CardContent>
    </Card>          

  );
}
