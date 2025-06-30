'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    async function doLogout() {
      await signOut?.();
      router.replace('/');
    }
    doLogout();
  }, [signOut, router]);

  return null;
}
