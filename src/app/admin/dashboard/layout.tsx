
'use client';

import { useAuth } from '@/components/auth/use-auth';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('[AdminDashboardLayout] No user found, redirecting to login.');
      router.replace('/admin/login');
    }
    if (!loading && user) {
      console.log('[AdminDashboardLayout] Authenticated User ID:', user.$id); // Updated for Appwrite
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <div className="py-6">{children}</div>;
}
