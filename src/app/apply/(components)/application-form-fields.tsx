
'use client';

import type { UseFormReturn } from 'react-hook-form';
// Import the specific form data type from application-form-client
import type { ClientApplicationFormData } from './application-form-client'; 
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FamilyMemberTable from '@/components/forms/family-member-table';
import FileUpload from '@/components/forms/file-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentEnum, BillUnitEnum, ACCEPTED_IMAGE_TYPES_PROFILE } from '@/lib/types';

interface ApplicationFormFieldsProps {
  form: UseFormReturn<ClientApplicationFormData>; // Use the imported client-specific type
  applicantType: 'gazetted' | 'non-gazetted';
}

export function ApplicationFormFields({ form, applicantType }: ApplicationFormFieldsProps) {
  const { control, register, formState: { errors }, watch } = form;

  const departmentOptions = Object.values(DepartmentEnum.Values);
  const billUnitOptions = Object.values(BillUnitEnum.Values);

  const requiredAsterisk = <span className="text-destructive ml-0.5">*</span>;

  return (
    <>
      {/* Employee Details Section */}
      <div className="space-y-6 p-6 border rounded-lg shadow-sm bg-form-section-employee-bg">
        <h2 className="text-xl font-semibold text-black border-b pb-2 mb-6">Employee Details:</h2>
        
        {/* Row 1 */}
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="employeeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Name: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Employee Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designation: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Designation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {applicantType === 'non-gazetted' ? (
            <FormField
              control={control}
              name="employeeNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee No: {requiredAsterisk}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Employee No." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : ( // Gazetted
            <FormField
              control={control}
              name="ruidNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUID No: {requiredAsterisk}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter RUID No." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Row 2 */}
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Of Birth: {requiredAsterisk}</FormLabel>
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
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Enter Date Of Birth</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department: {requiredAsterisk}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="[SELECT DEPARTMENT]" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="station"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Station: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3 */}
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="billUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill Unit: {requiredAsterisk}</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="[SELECT BILL UNIT]" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {billUnitOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={control}
            name="residentialAddress"
            render={({ field }) => (
              <FormItem className="md:col-span-2"> 
                <FormLabel>Residential Address: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter Residential Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Row 4 */}
        <div className="grid md:grid-cols-3 gap-6">
           <FormField
            control={control}
            name="rlyContactNumber" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rly Contact Number:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Rly Contact Number" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter Valid Mobile Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="reasonForApplication"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Application: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Reason" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Family Members Section */}
      <div className="p-6 border rounded-lg shadow-sm bg-form-section-family-bg">
        {/* Type assertion for errors if necessary, or ensure FamilyMemberTableProps handles it */}
        <FamilyMemberTable control={control} errors={errors as any} /> 
      </div>

      {/* Additional Details Section */}
      <div className="space-y-6 p-6 border rounded-lg shadow-sm bg-form-section-additional-bg">
        <h2 className="text-xl font-semibold text-black border-b pb-2 mb-4">Additional Details:</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>NOTE: File name should be Employee's FirstName_photo, FirstName_sign (jpg/jpeg/png)</p>
          <p>Upload well scanned Photo and Signature. For better visibility Avoid uploading Mobile scanned files and Selfie</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Name: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Emergency Contact Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="emergencyContactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Number: {requiredAsterisk}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter Emergency Contact Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <FileUpload
            id="uploadPhoto"
            label="Upload Photo:"
            registration={register("uploadPhoto")}
            error={errors.uploadPhoto?.message as string | undefined}
            accept={ACCEPTED_IMAGE_TYPES_PROFILE.join(',')}
            required
            watchField={watch("uploadPhoto")}
          />
          <FileUpload
            id="uploadSignature"
            label="Upload Signature:"
            registration={register("uploadSignature")}
            error={errors.uploadSignature?.message as string | undefined}
            accept={ACCEPTED_IMAGE_TYPES_PROFILE.join(',')}
            required
            watchField={watch("uploadSignature")}
          />
          {applicantType === 'gazetted' && (
            <>
              <FileUpload
                id="uploadHindiName"
                label="Upload Hindi Name:"
                registration={register("uploadHindiName")}
                error={errors.uploadHindiName?.message as string | undefined}
                accept={ACCEPTED_IMAGE_TYPES_PROFILE.join(',')}
                required
                watchField={watch("uploadHindiName")}
              />
              <FileUpload
                id="uploadHindiDesignation"
                label="Upload Hindi Designation:"
                registration={register("uploadHindiDesignation")}
                error={errors.uploadHindiDesignation?.message as string | undefined}
                accept={ACCEPTED_IMAGE_TYPES_PROFILE.join(',')}
                required
                watchField={watch("uploadHindiDesignation")}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
