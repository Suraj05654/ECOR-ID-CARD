// Lightweight fallback to avoid firebase dependency for type checking
class FallbackTimestamp {
  constructor(private date: Date = new Date()) {}
  toDate() { return this.date; }
}

type Timestamp = FallbackTimestamp;
import { z } from 'zod';
import { ApplicationStatus } from '@/lib/types';

// Base Employee Schema (for data input and core structure)
export const BaseEmployeeSchema = z.object({
  // Required Core Fields
  empName: z.string().min(1, "Employee Name is required"),
  empId: z.string().min(1, "Employee ID is required"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  station: z.string().min(1, "Station is required"),
  dob: z.union([z.date(), z.string()], { required_error: "Date of Birth is required" }),
  status: z.enum(["Pending", "Approved", "Printing (Draft)", "Printing (To be Sent)", "Printing (Sent)", "Closed", "Rejected"]),
  applicantType: z.enum(['gazetted', 'non-gazetted']),
  applicationDate: z.union([z.date(), z.string()], { required_error: "Application Date is required" }),
  
  // Required Contact Fields
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  emergencyContactName: z.string().min(1, "Emergency Contact Name is required"),
  emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit emergency contact number required"),
  residentialAddress: z.string().min(1, "Residential address is required"),
  
  // Required Type-Specific Fields (conditionally required based on applicantType)
  employeeNo: z.string().optional(),
  ruidNo: z.string().optional(),
  
  // Optional Fields
  remark: z.string().optional(),
  photoFileId: z.string().optional(),
  signatureFileId: z.string().optional(),
  hindiNameFileId: z.string().optional(),
  hindiDesignationFileId: z.string().optional(),
  rlyContactNumber: z.string().optional(),
  reasonForApplication: z.string().optional(),
  bloodGroup: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  
  // Family Members
  familyMembers: z.array(z.object({
    name: z.string().min(1, "Family member name is required"),
    relationship: z.string().min(1, "Family member relationship is required"),
    dob: z.union([z.date(), z.string()], { required_error: "Family member Date of Birth is required" }),
  })).optional().default([]),
  familyMembersJson: z.string().optional(),
  
  // File URLs (generated from FileIds)
  photoUrl: z.string().url("Invalid photo URL").optional(),
  signatureUrl: z.string().url("Invalid signature URL").optional(),
  hindiNameUrl: z.string().url("Invalid Hindi name URL").optional(),
  hindiDesignationUrl: z.string().url("Invalid Hindi designation URL").optional(),
  
  // Legacy/Compatibility Fields
  applicationId: z.union([z.string(), z.number()]).optional(),
  fullName: z.string().optional(),
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
  submissionDate: z.union([z.date(), z.string()]).optional(),
  dateOfBirth: z.union([z.date(), z.string()]).optional(),
  photoURL: z.string().url("Invalid photo URL").optional(),
  signatureURL: z.string().url("Invalid signature URL").optional(),
  
  // Legacy Document URLs
  idProofUrl: z.string().url("Invalid ID proof URL").optional(),
  addressProofUrl: z.string().url("Invalid address proof URL").optional(),
  gazettedProofUrl: z.string().url("Invalid gazetted proof URL").optional(),
  otherDocumentUrl: z.string().url("Invalid document URL").optional(),
  
  // Legacy Contact Fields
  contactNumber: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
});

export type InputEmployeeData = z.infer<typeof BaseEmployeeSchema>;

// StoredEmployee: Represents how employee data is structured in Firestore, including server-generated timestamps.
export interface StoredEmployee extends Omit<InputEmployeeData, 'dob' | 'applicationDate' | 'familyMembers'> {
  id?: string; // Firestore document ID
  dob: Timestamp;
  applicationDate: Date;
  familyMembers: Array<{
    name: string;
    relationship: string;
    dob: Timestamp;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Admin User Schema
export const AdminUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["super_admin", "admin", "operator"]),
  name: z.string().min(1, "Admin name is required"),
  permissions: z.array(z.string()).optional().default([]),
});

export type InputAdminUserData = z.infer<typeof AdminUserSchema>;

export interface StoredAdminUser extends InputAdminUserData {
  id?: string; // Firestore document ID
  createdAt: Timestamp;
}

// Application Statistics Schema
export const ApplicationStatsSchema = z.object({
  totalApplications: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  approvedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
});

export interface StoredApplicationStats extends z.infer<typeof ApplicationStatsSchema> {
  lastUpdated: Timestamp;
}

export interface Application {
  id: string;
  name: string;
  designation: string;
  dateOfBirth: string;
  station: string;
  department: string;
  pfNumber: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionRemarks?: string;
  // ... rest of the fields ...
}

// Types for employee data
export interface InputEmployeeData {
  status?: string;
  applicationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  familyMembersJson: string;
  applicantType: 'gazetted' | 'non-gazetted';
  employeeName: string;
  designation: string;
  employeeNo?: string;
  ruidNo?: string;
  dateOfBirth: string;
  department: string;
  station: string;
  billUnit: string;
  residentialAddress: string;
  rlyContactNumber?: string;
  mobileNumber: string;
  reasonForApplication: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  photoFileId?: string;
  signatureFileId?: string;
  hindiNameFileId?: string;
  hindiDesignationFileId?: string;
  remark?: string;
  photoUrl?: string;
  signatureUrl?: string;
}

export interface StoredEmployee extends Omit<InputEmployeeData, 'photoUrl' | 'signatureUrl'> {
  id: string;
  familyMembers: Array<{
    name: string;
    bloodGroup: string;
    relationship: string;
    dob?: string;
    identificationMarks: string;
  }>;
}

// Types for application statistics
export interface StoredApplicationStats {
  id: string;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  gazettedApplications: number;
  nonGazettedApplications: number;
  lastUpdated: string;
}


