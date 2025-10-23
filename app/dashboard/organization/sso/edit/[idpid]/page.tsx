'use client';

import { SsoProviderEdit } from '@auth0-web-ui-components/react';
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export default function SsoProviderEditPage() {
  const router = useRouter();
  const params = useParams();
  const idpId = params.idpId as string;

  const handleUpdate = useCallback((): void => {
    router.push('/dashboard/organization/sso');
  }, [router]);

  const handleBack = useCallback((): void => {
    router.push('/dashboard/organization/sso');
  }, [router]);

  const updateAction = useMemo(
    () => ({
      onAfter: handleUpdate,
    }),
    [handleUpdate],
  );

  return (
    <div className="p-6 pt-8 space-y-6">
      <SsoProviderEdit
        idpId={idpId!}
        update={updateAction}
        backButton={{ onClick: handleBack }}
        delete={{
          onAfter: () => {
            router.push('/dashboard/organization/sso');
          },
        }}
        removeFromOrg={{
          onAfter: () => {
            router.push('/dashboard/organization/sso');
          },
        }}
      />
    </div>
  );
}