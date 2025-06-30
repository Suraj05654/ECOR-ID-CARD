'use client';

import Link from 'next/link';
import Logo, { ITCentreLogoPlaceholder } from './logo';
import { Button } from '@/components/ui/button';
import { User, LogIn, LayoutDashboard, Printer } from 'lucide-react';
import { useAuth } from '@/components/auth/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const isAdmin = user && user.email && user.email.endsWith('@ecr.gov.in');

  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6]">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Left side: Logo and Organization Name */}
        <div className="flex items-center space-x-4 w-1/3">
          <Link href={isAdmin ? '/admin' : '/'} className="flex items-center space-x-4" aria-label="Home">
            <Logo isHeader={true} />
            <div className="flex flex-col">
              <span className="font-bold text-xl text-white">East Coast Railway</span>
              <span className="text-sm text-white/90">भारतीय रेल</span>
            </div>
          </Link>
        </div>
        
        {/* Center: Application Title */}
        <div className="hidden md:flex justify-center w-1/3">
          <h1 className="text-2xl font-bold text-white text-center">
            Online Form for I-cards
          </h1>
        </div>

        {/* Right side: Admin Login/User Menu */}
        <div className="flex items-center justify-end space-x-4 w-1/3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(user as any).photoURL || undefined} alt={user.email || 'User'} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-white/95 backdrop-blur-sm border border-white/20" 
                align="end"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/admin/dashboard" 
                    className="w-full cursor-pointer hover:bg-[#7c3aed]/10 focus:bg-[#7c3aed]/10"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/admin/print-applications" 
                    className="w-full cursor-pointer hover:bg-[#7c3aed]/10 focus:bg-[#7c3aed]/10"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Preview & Print
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => signOut()} 
                  className="text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              <Link href="/admin/login" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Admin Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
