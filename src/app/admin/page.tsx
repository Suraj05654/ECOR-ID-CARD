'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.replace('/admin/dashboard');
      } else {
        // If not authenticated, redirect to login
        router.replace('/admin/login');
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth status
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}