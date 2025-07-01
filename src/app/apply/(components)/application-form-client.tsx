'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  BaseApplicationSchema, 
  DepartmentEnum, 
  BillUnitEnum,
  MAX_FILE_SIZE_PROFILE_DOCS,
  ACCEPTED_IMAGE_TYPES_PROFILE,
  type NewFamilyMember // Import for defaultValues type
} from '@/lib/types';
import { submitApplication } from '@/lib/actions/application';
import { uploadFile as uploadToStorage } from '@/lib/appwriteService';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ApplicationFormFields } from './application-form-fields';
import { useState } from 'react';
import { Loader2, Trash2, Check, CopyIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getImageDataUrl = (src: string, type: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      // Resize to max 400x400 for much smaller PDF
      const maxDim = 400;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(type, quality));
    };
    img.onerror = reject;
    img.src = src;
  });
};

const downloadApplicationAsPdf = (data: ClientApplicationFormData, applicationId: string) => {
  const doc = new jsPDF();
  const photoFile = data.uploadPhoto?.[0];
  const signatureFile = data.uploadSignature?.[0];

  const readerToDataUrl = (file: File, type: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize and compress
        const img = new window.Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          // Resize to max 400x400
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(type, quality));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addContentToPdf = async () => {
    // 1. Add ECOR Logo and Title
    try {
      const logoUrl = await getImageDataUrl('/ecor.png', 'image/png', 0.92);
      // Maintain aspect ratio: set width to 40mm, calculate height
      const img = new window.Image();
      img.src = '/ecor.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const logoWidth = 20; // mm
      const aspectRatio = img.width / img.height;
      const logoHeight = logoWidth / aspectRatio;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - logoWidth) / 2;
      doc.addImage(logoUrl, 'PNG', x, 8, logoWidth, logoHeight);
    } catch (e) {
      doc.setFontSize(18);
      doc.text('EAST COAST RAILWAY', 105, 20, { align: 'center' });
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('E-COR ID Card Application', 105, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Application ID: ${applicationId}`, 15, 50);
    doc.text(`Submission Date: ${format(new Date(), 'PPP p')}`, 15, 57);

    // 2. Add Images (Photo & Signature)
    let yImg = 65;
    if (photoFile) {
      try {
        const photoUrl = await readerToDataUrl(photoFile, 'image/png', 0.92);
        doc.addImage(photoUrl, 'PNG', 15, yImg, 40, 50);
        doc.rect(15, yImg, 40, 50);
        doc.text('Photo', 15, yImg + 55);
      } catch (error) {
        doc.text('Could not load photo.', 15, yImg + 10);
      }
    }
    if (signatureFile) {
      try {
        const signatureUrl = await readerToDataUrl(signatureFile, 'image/png', 0.92);
        doc.addImage(signatureUrl, 'PNG', 65, yImg + 30, 50, 20);
        doc.rect(65, yImg + 30, 50, 20);
        doc.text('Signature', 65, yImg + 53);
      } catch (error) {
        doc.text('Could not load signature.', 65, yImg + 40);
      }
    }

    // 3. Applicant Details Table
    let yTable = 125;
    autoTable(doc, {
      startY: yTable,
      head: [[
        'Field', 'Value'
      ]],
      body: [
        ['Name', data.employeeName || ''],
        ['Designation', data.designation || ''],
        ['Applicant Type', data.applicantType || ''],
        [data.applicantType === 'gazetted' ? 'RUID No' : 'Employee No', (data.applicantType === 'gazetted' ? data.ruidNo : data.employeeNo) || ''],
        ['Date of Birth', format(data.dateOfBirth, 'PPP')],
        ['Department', data.department || ''],
        ['Station', data.station || ''],
        ['Bill Unit', data.billUnit || ''],
        ['Residential Address', data.residentialAddress || ''],
        ['Mobile Number', data.mobileNumber || ''],
        ['Railway Contact', data.rlyContactNumber || 'N/A'],
        ['Emergency Contact Name', data.emergencyContactName || ''],
        ['Emergency Contact Number', data.emergencyContactNumber || ''],
        ['Reason for Application', data.reasonForApplication || ''],
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
    });

    // 4. Family Members Table
    if (data.familyMembers && data.familyMembers.length > 0) {
      autoTable(doc, {
        startY: ((doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 135) + 10,
        head: [[
          'Name', 'Relationship', 'Date of Birth', 'Blood Group', 'Identification Marks'
        ]],
        body: data.familyMembers.map(member => [
          member.name || '',
          member.relationship || '',
          member.dob ? format(member.dob, 'PPP') : 'N/A',
          member.bloodGroup || 'N/A',
          member.identificationMarks || 'N/A',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { font: 'helvetica', fontSize: 10 },
      });
    }

    // 5. Save the PDF
    doc.save(`application_${applicationId}.pdf`);
  };

  addContentToPdf();
};

interface ApplicationFormClientProps {
  applicantType: 'gazetted' | 'non-gazetted';
}

// Define client-specific file schema locally
const clientFileSchema = (isRequired = true) => {
  const base = z.instanceof(FileList)
    .refine((files) => files?.length > 0, "File is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE_PROFILE_DOCS, `Max file size is 2MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES_PROFILE.includes(files?.[0]?.type),
      `Unsupported file type. Accepted: JPG, JPEG, PNG.`
    );
  return isRequired ? base : base.optional().or(z.literal(null)).or(z.literal(undefined));
};

// Define the family member type
type FamilyMember = {
  name: string;
  bloodGroup: string;
  relationship: string;
  dob?: Date;
  identificationMarks: string;
};

// Define the family member schema
const FamilyMemberSchema = z.object({
  name: z.string(),
  bloodGroup: z.string(),
  relationship: z.string(),
  dob: z.date().optional(),
  identificationMarks: z.string()
});

// Define the schema shape first
const formSchema = {
  // Required System Fields
  status: z.string().default('Pending'),
  applicationDate: z.union([z.date(), z.string()]).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),

  // Core Fields
  familyMembers: z.array(FamilyMemberSchema).default([]),
  applicantType: z.enum(['gazetted', 'non-gazetted']),
  employeeName: z.string().min(1, "Employee name is required"),
  designation: z.string().min(1, "Designation is required"),
  employeeNo: z.string().optional(),
  ruidNo: z.string().optional(),
  dateOfBirth: z.date({ required_error: "Date of Birth is required" }),
  department: z.string().min(1, "Department is required"),
  station: z.string().min(1, "Station is required"),
  billUnit: z.string().min(1, "Bill unit is required"),
  residentialAddress: z.string().min(1, "Residential address is required"),
  rlyContactNumber: z.string().optional(),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  reasonForApplication: z.string().min(1, "Reason for application is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit emergency contact number required"),

  // File Fields
  uploadPhoto: clientFileSchema(true),
  uploadSignature: clientFileSchema(true),
  uploadHindiName: clientFileSchema(false),
  uploadHindiDesignation: clientFileSchema(false)
} as const;

// Create the schema with refinements
export const ClientApplicationFormSchema = z.object(formSchema).superRefine((data, ctx) => {
  if (data.applicantType === 'non-gazetted') {
    if (!data.employeeNo || data.employeeNo.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employeeNo'],
        message: 'Employee No is required for Non-Gazetted applicants.',
      });
    }
  } else if (data.applicantType === 'gazetted') {
    if (!data.ruidNo || data.ruidNo.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ruidNo'],
        message: 'RUID No is required for Gazetted applicants.',
      });
    }
    // Conditionally require Hindi uploads for Gazetted
    if (!(data.uploadHindiName instanceof FileList && data.uploadHindiName.length > 0)) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uploadHindiName'],
        message: 'Upload Hindi Name is required for Gazetted applicants.',
      });
    }
    if (!(data.uploadHindiDesignation instanceof FileList && data.uploadHindiDesignation.length > 0)) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uploadHindiDesignation'],
        message: 'Upload Hindi Designation is required for Gazetted applicants.',
      });
    }
  }
});

export type ClientApplicationFormData = z.infer<typeof ClientApplicationFormSchema>;

export function ApplicationFormClient({ applicantType }: ApplicationFormClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ClientApplicationFormSchema>>({
    resolver: zodResolver(ClientApplicationFormSchema),
    defaultValues: {
      applicantType: applicantType,
      // Employee Details
      employeeName: '',
      designation: '',
      employeeNo: applicantType === 'non-gazetted' ? '' : undefined,
      ruidNo: applicantType === 'gazetted' ? '' : undefined,
      dateOfBirth: undefined, // User will pick
      department: undefined, // Will be set by Select
      station: 'BHUBANESWAR',
      billUnit: undefined, // Will be set by Select
      residentialAddress: '',
      rlyContactNumber: '',
      mobileNumber: '',
      reasonForApplication: '',
      
      // Family Members - Initialize with SELF member
      familyMembers: [{
        name: '',
        bloodGroup: '',
        relationship: 'SELF',
        dob: undefined,
        identificationMarks: '',
      }],
      
      // Additional Details
      emergencyContactName: '',
      emergencyContactNumber: '',
      
      // File Uploads - react-hook-form will handle FileList
      uploadPhoto: undefined,
      uploadSignature: undefined,
      uploadHindiName: applicantType === 'gazetted' ? undefined : null, 
      uploadHindiDesignation: applicantType === 'gazetted' ? undefined : null,
    },
  });

  async function safeUpload(fileList?: FileList | null): Promise<string | undefined> {
    if (!fileList?.length) return undefined;
    try {
      const res = await uploadToStorage(fileList[0]);
      return (res as any)?.$id;
    } catch (err) {
      console.error('[UPLOAD] failed, proceeding without file', err);
      return undefined;
    }
  }

  async function onSubmit(data: z.infer<typeof ClientApplicationFormSchema>) {
    setIsSubmitting(true);
    try {
      // Create FormData object
      const formData = new FormData();

      // Handle file uploads first
      const photoFile = data.uploadPhoto instanceof FileList ? data.uploadPhoto[0] : null;
      const signatureFile = data.uploadSignature instanceof FileList ? data.uploadSignature[0] : null;
      const hindiNameFile = data.uploadHindiName instanceof FileList ? data.uploadHindiName[0] : null;
      const hindiDesignationFile = data.uploadHindiDesignation instanceof FileList ? data.uploadHindiDesignation[0] : null;

      if (!photoFile || !signatureFile) {
        throw new Error('Photo and signature are required');
      }

      // Add files to FormData
      formData.append('uploadPhoto', photoFile);
      formData.append('uploadSignature', signatureFile);
      if (hindiNameFile) formData.append('uploadHindiName', hindiNameFile);
      if (hindiDesignationFile) formData.append('uploadHindiDesignation', hindiDesignationFile);

      // Add other form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        // Skip file fields as we've already handled them
        if (['uploadPhoto', 'uploadSignature', 'uploadHindiName', 'uploadHindiDesignation'].includes(key)) {
          return;
        }
        
        if (key === 'familyMembers') {
          formData.append('familyMembersJson', JSON.stringify(value));
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const result = await submitApplication(formData);

      if (!result || !result.success) {
        throw new Error('Failed to submit application');
      }

      const applicationId = result.data?.$id;
      if (!applicationId) {
        throw new Error('No application ID received');
      }

      // Trigger download
      downloadApplicationAsPdf(data, applicationId);

      toast({
        title: "Success! Application PDF downloading.",
        description: (
          <div className="flex flex-col gap-2">
            <p>Your Application ID is:</p>
            <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
              <code className="text-sm font-mono">{applicationId}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => {
                  navigator.clipboard.writeText(applicationId);
                  toast({
                    title: 'Copied!',
                    description: 'Application ID copied to clipboard'
                  });
                }}
              >
                <CopyIcon className="mr-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A PDF copy of your application details has been downloaded. 
              Please keep it for your records.
            </p>
          </div>
        ),
        duration: 8000,
      });

      // reset form
      form.reset({
        applicantType: applicantType,
        employeeName: '',
        designation: '',
        employeeNo: applicantType === 'non-gazetted' ? '' : undefined,
        ruidNo: applicantType === 'gazetted' ? '' : undefined,
        dateOfBirth: undefined,
        department: undefined,
        station: 'BHUBANESWAR',
        billUnit: undefined,
        residentialAddress: '',
        rlyContactNumber: '',
        mobileNumber: '',
        reasonForApplication: '',
        familyMembers: [{
          name: '',
          bloodGroup: '',
          relationship: 'SELF',
          dob: undefined,
          identificationMarks: '',
        }],
        emergencyContactName: '',
        emergencyContactNumber: '',
        uploadPhoto: undefined,
        uploadSignature: undefined,
        uploadHindiName: applicantType === 'gazetted' ? undefined : null,
        uploadHindiDesignation: applicantType === 'gazetted' ? undefined : null,
      });

      router.push(`/status?id=${applicationId}&dob=${data.dateOfBirth.toISOString().split('T')[0]}`);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleClear = () => {
    form.reset({
      applicantType: applicantType,
      employeeName: '',
      designation: '',
      employeeNo: applicantType === 'non-gazetted' ? '' : undefined,
      ruidNo: applicantType === 'gazetted' ? '' : undefined,
      dateOfBirth: undefined,
      department: undefined,
      station: 'BHUBANESWAR',
      billUnit: undefined,
      residentialAddress: '',
      rlyContactNumber: '',
      mobileNumber: '',
      reasonForApplication: '',
      familyMembers: [{
        name: '',
        bloodGroup: '',
        relationship: 'SELF',
        dob: undefined,
        identificationMarks: '',
      }],
      emergencyContactName: '',
      emergencyContactNumber: '',
      uploadPhoto: undefined,
      uploadSignature: undefined,
      uploadHindiName: applicantType === 'gazetted' ? undefined : null,
      uploadHindiDesignation: applicantType === 'gazetted' ? undefined : null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ApplicationFormFields form={form} applicantType={applicantType} />
        <div className="flex justify-end pt-6 border-t space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            onClick={handleClear} 
            disabled={isSubmitting} 
            className="min-w-[150px] text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive/50 hover:border-destructive/90 transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                CLEAR FORM
              </>
            )}
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting} 
            className="min-w-[150px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                SUBMIT
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
