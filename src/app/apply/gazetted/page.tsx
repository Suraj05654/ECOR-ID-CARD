
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationFormClient } from "../(components)/application-form-client";
import { UserCheck } from "lucide-react"; 

export default function GazettedApplicationPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-xl">
         <CardHeader className="bg-card">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl md:text-3xl text-primary">Employee Registration Form (Gazetted)</CardTitle>
              <CardDescription className="text-md">
                Please fill out the form below accurately and completely. Fields marked with <span className="text-destructive">*</span> are mandatory.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <ApplicationFormClient applicantType="gazetted" />
        </CardContent>
      </Card>
    </div>
  );
}
