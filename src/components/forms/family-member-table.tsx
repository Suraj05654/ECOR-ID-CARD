'use client';

import type { Control, FieldErrors } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
// Import the specific form data type
import type { ClientApplicationFormData } from '@/app/apply/(components)/application-form-client'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'; // Removed FormLabel as it's not directly used for table inputs
import React from 'react';

// Define the family member type
type FamilyMember = {
  name: string;
  bloodGroup: string;
  relationship: string;
  dob?: Date;
  identificationMarks: string;
};

interface FamilyMemberTableProps {
  control: Control<ClientApplicationFormData>;
  errors: FieldErrors<ClientApplicationFormData>;
}

const FamilyMemberTable = ({ control, errors }: FamilyMemberTableProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const addNewMember = () => {
    const newMember: FamilyMember = {
      name: '',
      bloodGroup: '',
      relationship: '',
      dob: undefined,
      identificationMarks: '',
    };
    append(newMember);
  };

  const requiredAsterisk = <span className="text-destructive">*</span>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary">Details of family members (As per pass rule):</h3>
        <Button type="button" variant="outline" size="sm" onClick={addNewMember} className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-md border mt-4">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sl. No</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name {requiredAsterisk}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Blood Group</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Relationship {requiredAsterisk}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">DOB {requiredAsterisk}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Identification mark(s)</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {fields.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{index + 1}</td>
                  <td className="px-4 py-3 min-w-[150px]">
                    <FormField
                      control={control}
                      name={`familyMembers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter name" {...field} className="text-sm"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <FormField
                      control={control}
                      name={`familyMembers.${index}.bloodGroup`}
                      render={({ field }) => (
                        <FormItem>
                           <FormControl>
                            <Input placeholder="Enter blood group" {...field} className="text-sm"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[150px]">
                    <FormField
                      control={control}
                      name={`familyMembers.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                           <FormControl>
                            <Input placeholder="Enter relationship" {...field} className="text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                     <FormField
                        control={control}
                        name={`familyMembers.${index}.dob`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal text-sm",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Enter DOB</span>}
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
                  </td>
                   <td className="px-4 py-3 min-w-[200px]">
                    <FormField
                      control={control}
                      name={`familyMembers.${index}.identificationMarks`}
                      render={({ field }) => (
                        <FormItem>
                           <FormControl>
                            <Input placeholder="Enter identification marks" {...field} className="text-sm"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label="Remove member" className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No entries added yet. Click "Add" to include family details.</p>
      )}
      {/* Accessing errors for field array message */}
      {errors.familyMembers && !Array.isArray(errors.familyMembers) && errors.familyMembers.message && (
        <p className="text-sm font-medium text-destructive">{(errors.familyMembers as any).message}</p>
      )}
    </div>
  );
};

export default FamilyMemberTable;
