import type { Metadata } from 'next';
import './globals.css';
import { Toaster as SonnerToaster } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/shared/header';
import AppSidebar from '@/components/shared/sidebar';
import { AuthProvider } from '@/components/auth/auth-provider';

export const metadata: Metadata = {
  title: 'Online Form for I-cards - East Coast Railway',
  description: 'Employee ID Card Application Portal for East Coast Railway',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/ecor.png" type="image/png" />
      </head>
      <body className="font-sans antialiased bg-background min-h-screen">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <div className="flex-1 flex">
              <AppSidebar />
              <main className="flex-1 p-6">
                <div className="container mx-auto max-w-7xl">
                  <div className="bg-background/60 backdrop-blur-md rounded-lg border shadow-sm animate-fadeIn">
                    <div className="p-6">
                      {children}
                    </div>
                  </div>
                </div>
                <Toaster />
                <SonnerToaster 
                  position="top-right" 
                  richColors 
                  closeButton
                  expand={false}
                  style={{ zIndex: 1000 }}
                />
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
