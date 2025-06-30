'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import clsx from 'clsx';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Home', href: '/admin' },
  { label: 'Pending Applications (NG)', href: '/admin/applications?type=ng' },
  { label: 'Pending Applications (GAZ)', href: '/admin/applications?type=gaz' },
  { label: 'Print Applications', href: '/admin/print-applications' },
  { label: 'Logout', href: '/logout' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
