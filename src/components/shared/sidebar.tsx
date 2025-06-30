'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Home, Edit3, UserCheck, FileText, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  basePath?: string;
  queryParam?: string;
}

// Sidebar navigation items for normal users
const userNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/apply/non-gazetted', label: 'Apply for I-card (NG)', icon: Briefcase },
  { href: '/apply/gazetted', label: 'Apply for I-card (GAZ)', icon: UserCheck },
  { href: '/status', label: 'Application Status', icon: FileText },
];

// Sidebar navigation items for admin dashboard
const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Home', icon: Home },
  { 
    href: '/admin/applications?type=ng', 
    label: 'Pending Applications(NG)', 
    icon: Edit3, 
    basePath: '/admin/applications',
    queryParam: 'type=ng'
  },
  { 
    href: '/admin/applications?type=gaz', 
    label: 'Pending Applications(G)', 
    icon: Edit3, 
    basePath: '/admin/applications',
    queryParam: 'type=gaz'
  },
  { href: '/admin/print-applications', label: 'Print Applications', icon: FileText },
  { href: '/logout', label: 'Logout', icon: UserCheck },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdminView = pathname.startsWith('/admin') && !!user;
  const navItems = isAdminView ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 shrink-0">
      <div className="fixed w-64 h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-md border-r">
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.queryParam
                ? pathname.startsWith(item.basePath || '') && searchParams.get('type') === item.queryParam.split('=')[1]
                : pathname === item.href || 
                  (pathname.startsWith(item.href + '/') && item.href !== '/');

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start text-sm font-medium h-10 rounded-lg px-3",
                  isActive
                    ? 'bg-primary/15 text-primary hover:bg-primary/20'
                    : 'hover:bg-primary/5 hover:text-primary'
                )}
              >
                <Link href={item.href} className="flex items-center truncate">
                  <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
