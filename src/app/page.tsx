import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Briefcase, UserCheck, FileText, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Employee Identity Card Portal
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Online portal for Employee Identity Card applications at East Coast Railway.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Choose your application type to get started</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Button asChild variant="outline" size="lg" className="h-auto py-4">
              <Link href="/apply/non-gazetted" className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Non-Gazetted</div>
                  <div className="text-sm text-muted-foreground">Apply for new I-card</div>
                </div>
                <ArrowRight className="ml-auto h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-4">
              <Link href="/apply/gazetted" className="flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Gazetted</div>
                  <div className="text-sm text-muted-foreground">Apply for new I-card</div>
                </div>
                <ArrowRight className="ml-auto h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/status" className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Track Application Status
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
                Before you apply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prepare scanned copies of your photo and signature (.jpg, .jpeg, .png, max 2MB each)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Gazetted officers: Have scanned copies of your name and designation in Hindi ready</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep family member details and emergency contact information handy</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review the application guidelines for a smooth process</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
