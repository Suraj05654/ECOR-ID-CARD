import { z } from 'zod';
import { isValid, parseISO } from 'date-fns';

// File Upload Constants - These are safe as they are just values
export const MAX_FILE_SIZE_PROFILE_DOCS = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_IMAGE_TYPES_PROFILE = ["image/jpeg", "image/jpg", "image/png"];

// Universal Schemas and Types
export const NewFamilyMemberSchema = z.object({
  id: z.string().optional(), // Used by useFieldArray, can be undefined initially
  name: z.string().min(1, "Name is required"),
  bloodGroup: z.string().optional().default(''),
  relationship: z.string().min(1, "Relationship is required"),
  // For client-side, react-hook-form manages this as a Date object.
  // For server-side, it will be transformed from a string.
  dob: z.date({ required_error: "Date of birth is required" }),
  identificationMarks: z.string().optional().default(''),
});
export type NewFamilyMember = z.infer<typeof NewFamilyMemberSchema>;

export const DepartmentEnum = z.enum([
  "ACCOUNTS", "COMMERCIAL", "ELECTRICAL", "ENGINEERING", "GA",
  "MECHANICAL", "MEDICAL", "OPERATING", "PERSONNEL", "RRB",
  "S&T", "SAFETY", "SECURITY", "STORES"
]);
export type Department = z.infer<typeof DepartmentEnum>;

export const BillUnitEnum = z.enum([
  "3101001", "3101002", "3101003", "3101004", "3101010", "3101023",
  "3101024", "3101025", "3101026", "3101027", "3101065", "3101066",
  "3101165", "3101166", "3101285", "3101286", "3101287", "3101288",
  "3101470"
]);
export type BillUnit = z.infer<typeof BillUnitEnum>;

// Base schema, server-safe (no FileList or other browser-specific types)
export const BaseApplicationSchema = z.discriminatedUnion('applicantType', [
  // Gazetted Officer Schema
  z.object({
    // Required System Fields
    status: z.string().default('Pending'),
    applicationDate: z.union([z.date(), z.string()]),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),

    // Core Fields
    familyMembersJson: z.string(),
    applicantType: z.literal('gazetted'),
    employeeName: z.string().min(1, "Employee name is required"),
    designation: z.string().min(1, "Designation is required"),
    employeeNo: z.string().optional(),
    ruidNo: z.string().min(1, "RUID number is required for gazetted officers"),
    dateOfBirth: z.union([z.date(), z.string()]),
    department: z.string().min(1, "Department is required"),
    station: z.string().min(1, "Station is required"),
    billUnit: z.string().min(1, "Bill unit is required"),
    residentialAddress: z.string().min(1, "Residential address is required"),
    rlyContactNumber: z.string(),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
    reasonForApplication: z.string().min(1, "Reason for application is required"),
    emergencyContactName: z.string().min(1, "Emergency contact name is required"),
    emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit emergency contact number required"),

    // File IDs
    photoFileId: z.string(),
    signatureFileId: z.string(),
    hindiNameFileId: z.string().min(1, "Hindi name file is required for gazetted officers"),
    hindiDesignationFileId: z.string().min(1, "Hindi designation file is required for gazetted officers"),

    // Additional Fields
    remark: z.string().default('')
  }),

  // Non-Gazetted Employee Schema
  z.object({
    // Required System Fields
    status: z.string().default('Pending'),
    applicationDate: z.union([z.date(), z.string()]),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),

    // Core Fields
    familyMembersJson: z.string(),
    applicantType: z.literal('non-gazetted'),
    employeeName: z.string().min(1, "Employee name is required"),
    designation: z.string().min(1, "Designation is required"),
    employeeNo: z.string().min(1, "Employee number is required for non-gazetted employees"),
    ruidNo: z.string().optional(),
    dateOfBirth: z.union([z.date(), z.string()]),
    department: z.string().min(1, "Department is required"),
    station: z.string().min(1, "Station is required"),
    billUnit: z.string().min(1, "Bill unit is required"),
    residentialAddress: z.string().min(1, "Residential address is required"),
    rlyContactNumber: z.string(),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
    reasonForApplication: z.string().min(1, "Reason for application is required"),
    emergencyContactName: z.string().min(1, "Emergency contact name is required"),
    emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit emergency contact number required"),

    // File IDs
    photoFileId: z.string(),
    signatureFileId: z.string(),
    hindiNameFileId: z.string().optional(),
    hindiDesignationFileId: z.string().optional(),

    // Additional Fields
    remark: z.string().default('')
  })
]);

// ------------------------------------------------------------------------------------------------
// Status helpers
// Includes both lowercase and uppercase variants to keep backward compatibility across the codebase
export type ApplicationStatus =
  | 'pending' | 'approved' | 'rejected' | 'closed'
  | 'printing (draft)' | 'printing (to be sent)' | 'printing (sent)'
  | 'Pending' | 'Approved' | 'Rejected' | 'Closed'
  | 'Printing (Draft)' | 'Printing (To be Sent)' | 'Printing (Sent)';


export interface InputEmployeeData {
  // Required System Fields
  status: string;
  applicationDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Core Fields
  familyMembersJson: string;
  applicantType: string;
  employeeName: string;
  designation: string;
  employeeNo: string;
  ruidNo: string;
  dateOfBirth: Date | string;
  department: string;
  station: string;
  billUnit: string;
  residentialAddress: string;
  rlyContactNumber: string;
  mobileNumber: string;
  reasonForApplication: string;
  emergencyContactName: string;
  emergencyContactNumber: string;

  // File IDs
  photoFileId: string;
  signatureFileId: string;
  hindiNameFileId: string;
  hindiDesignationFileId: string;

  // Additional Fields
  remark: string;
}

export interface StoredEmployee {
  // Appwrite Document Fields
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];

  // Required System Fields
  status: string;
  applicationDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Core Fields
  familyMembersJson: string;
  applicantType: string;
  employeeName: string;
  designation: string;
  employeeNo: string;
  ruidNo: string;
  dateOfBirth: Date;
  department: string;
  station: string;
  billUnit: string;
  residentialAddress: string;
  rlyContactNumber: string;
  mobileNumber: string;
  reasonForApplication: string;
  emergencyContactName: string;
  emergencyContactNumber: string;

  // File IDs
  photoFileId: string;
  signatureFileId: string;
  hindiNameFileId: string;
  hindiDesignationFileId: string;

  // File URLs
  photoUrl?: string;
  signatureUrl?: string;
  hindiNameUrl?: string;
  hindiDesignationUrl?: string;

  // Additional Fields
  remark: string;

  // Legacy Fields (for backward compatibility)
  dob?: Date;
  familyMembers?: Array<{
    name: string;
    relationship: string;
    dob: string | Date;
  }>;
  empName?: string;
  empId?: string;
}

export interface FamilyMember {
  id?: string | number;
  name: string;
  relationship?: string;
  // Alias used in UI components
  relation?: string;
  dob: Date | string;
  bloodGroup?: string;
  identificationMarks?: string;
}

export interface InputAdminUserData {
  name: string;
  role: string;
  department?: string;
}

export interface StoredAdminUser {
  id: string;
  name: string;
  role: string;
  department?: string;
  createdAt: string;
}

export interface StoredApplicationStats {
  totalApplications: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  lastUpdated: string;
}

// Legacy aliases for backward compatibility
export type EmployeeStatus = StoredEmployee['status'];
export type StoredApplication = StoredEmployee;
export type InputApplicationData = InputEmployeeData;

export interface ApplicationResult {
  success: boolean;
  message: string;
  status?: ApplicationStatus | null;
  applicantName?: string | null;
  submissionDate?: string | null;
  rejectionRemarks?: string | null;
}