'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, CheckCircle, Info, Loader2, Search, XCircle, AlertTriangle, CopyIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplicationStatus } from '@/lib/actions/application';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const StatusCheckSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

type StatusCheckFormValues = z.infer<typeof StatusCheckSchema>;

type SuccessStatusResult = {
  success: true;
  message: string;
  status: string;
  applicantName: string;
  submissionDate: string | null;
  remark?: string;
  photoUrl?: string;
  signatureUrl?: string;
};

type ErrorStatusResult = {
  success: false;
  message: string;
};

type StatusResult = SuccessStatusResult | ErrorStatusResult;

function getStatusBadge(status: string | undefined) {
  if (!status) return null;
  
  const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
    pending: { label: "Pending", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    closed: { label: "Closed", variant: "outline" },
  };

  const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: "default" };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
}

export default function StatusPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<StatusResult>();
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();

  const form = useForm<StatusCheckFormValues>({
    resolver: zodResolver(StatusCheckSchema),
    defaultValues: {
      applicationId: searchParams.get("applicationId") || "",
      dateOfBirth: "",
    },
  });

  const onSubmit = async (values: StatusCheckFormValues) => {
    if (!values.dateOfBirth) {
      setStatusResult({
        success: false,
        message: "Please select a date of birth",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Submitting with values:", values);
      const result = await getApplicationStatus(values.applicationId, values.dateOfBirth);
      console.log("Got result:", result);
      setStatusResult(result as StatusResult);
    } catch (error) {
      console.error("Error fetching status:", error);
      setStatusResult({
        success: false,
        message: "Failed to check status. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-custom">
      <div className="container mx-auto py-8 px-4 md:px-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <Card className="bg-white dark:bg-gray-950 shadow-custom">
            <CardHeader>
              <CardTitle className="text-xl">Check Application Status</CardTitle>
              <CardDescription>Enter your application details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="applicationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application ID</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="e.g., 65f1a2b3c4d5e6f7g8h9i0" {...field} />
                          </FormControl>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(field.value);
                                toast({
                                  title: 'Copied!',
                                  description: 'Application ID copied to clipboard'
                                });
                              }}
                            >
                              <CopyIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormDescription>
                          This is the ID you received when submitting your application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(parseISO(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(date) => {
                                setDate(date);
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                              }}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check Status
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {statusResult && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2">
                    {statusResult.success ? (
                      statusResult.status === "approved" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : statusResult.status === "rejected" ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Info className="h-5 w-5 text-yellow-500" />
                      )
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <p
                      className={cn(
                        "text-sm font-medium",
                        statusResult.success ? "text-foreground" : "text-destructive"
                      )}
                    >
                      {statusResult.message}
                    </p>
                  </div>

                  {statusResult.success && (
                    <div className="rounded-lg border bg-white dark:bg-gray-950 text-card-foreground shadow-sm p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Applicant</span>
                        <span className="text-sm font-medium">{statusResult.applicantName}</span>
                      </div>
                      {statusResult.submissionDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Submitted On</span>
                          <span className="text-sm font-medium">{statusResult.submissionDate}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <div>{getStatusBadge(statusResult.status)}</div>
                      </div>
                      {statusResult.remark && (
                        <div className="flex flex-col gap-1 border-t pt-3 mt-3">
                          <span className="text-sm text-muted-foreground">Remarks</span>
                          <p className="text-sm">{statusResult.remark}</p>
                        </div>
                      )}
                      {(statusResult.photoUrl || statusResult.signatureUrl) && (
                        <div className="flex flex-col gap-1 border-t pt-3 mt-3">
                          <div className="grid grid-cols-2 gap-4">
                            {statusResult.photoUrl && (
                              <div>
                                <span className="text-sm text-muted-foreground">Photo</span>
                                <img src={statusResult.photoUrl} alt="Applicant Photo" className="mt-2 w-32 h-32 object-cover rounded-md" />
                              </div>
                            )}
                            {statusResult.signatureUrl && (
                              <div>
                                <span className="text-sm text-muted-foreground">Signature</span>
                                <img src={statusResult.signatureUrl} alt="Applicant Signature" className="mt-2 w-32 h-16 object-contain" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
