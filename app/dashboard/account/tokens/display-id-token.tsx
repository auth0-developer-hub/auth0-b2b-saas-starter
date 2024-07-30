"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import styles from './page.module.css';
import { decodeToken, renderTokenDetails } from './functions-token';

interface Props {
    idToken: string;
}

export function DisplayIdToken({ idToken }: Props) {
  const decodedToken = decodeToken(idToken);

  return (
    <Card className={styles['token-container']}>
      <CardHeader>
        <CardTitle>Your ID Token</CardTitle>
        <CardDescription>This is the information the identity provider passed to the application about you.</CardDescription>
      </CardHeader>
      <CardContent>
        
        {renderTokenDetails(decodedToken)}

        {idToken && (
          <p className={styles['jwtio']}>
            <a href={`https://jwt.io/?token=${idToken}`} target="_blank" rel="noopener noreferrer">
              <Image
                src="https://jwt.io/img/badge.svg"
                alt="View on JWT.io"
                width="138" height="35"
              />
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
