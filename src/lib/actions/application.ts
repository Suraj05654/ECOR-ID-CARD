'use server';

import type { ApplicationStatus, StoredEmployee } from '@/lib/types';

import { Buffer } from 'node:buffer';

import { getEmployeesService, getEmployeeService, createEmployee, updateEmployee, deleteEmployee, searchEmployees, getEmployeesByDateRange } from '@/lib/new_admin_backend/services';
import { uploadFile as uploadToStorage } from '@/lib/appwriteService';
import { ID } from 'appwrite';
import { format, parseISO, isValid } from 'date-fns';

const mapBackendEmployee = (emp: any): StoredEmployee => ({
  // Appwrite Document Fields
  $id: emp.$id,
  $collectionId: emp.$collectionId,
  $databaseId: emp.$databaseId,
  $createdAt: emp.$createdAt,
  $updatedAt: emp.$updatedAt,
  $permissions: emp.$permissions,

  // Required System Fields
  status: emp.status || 'Pending',
  applicationDate: new Date(emp.applicationDate || emp.$createdAt),
  createdAt: new Date(emp.$createdAt),
  updatedAt: new Date(emp.$updatedAt),

  // Core Fields
  familyMembersJson: emp.familyMembersJson || '[]',
  applicantType: emp.applicantType || 'non-gazetted',
  employeeName: emp.employeeName || emp.name || 'Unknown',
  designation: emp.designation || '',
  employeeNo: emp.employeeNo || '',
  ruidNo: emp.ruidNo || '',
  dateOfBirth: new Date(emp.dateOfBirth || emp.dob || Date.now()),
  department: emp.department || '',
  station: emp.station || '',
  billUnit: emp.billUnit || '',
  residentialAddress: emp.residentialAddress || '',
  rlyContactNumber: emp.rlyContactNumber || '',
  mobileNumber: emp.mobileNumber || '',
  reasonForApplication: emp.reasonForApplication || '',
  emergencyContactName: emp.emergencyContactName || '',
  emergencyContactNumber: emp.emergencyContactNumber || '',

  // File IDs
  photoFileId: emp.photoFileId || '',
  signatureFileId: emp.signatureFileId || '',
  hindiNameFileId: emp.hindiNameFileId || '',
  hindiDesignationFileId: emp.hindiDesignationFileId || '',

  // File URLs
  photoUrl: emp.photoUrl || '',
  signatureUrl: emp.signatureUrl || '',
  hindiNameUrl: emp.hindiNameUrl || '',
  hindiDesignationUrl: emp.hindiDesignationUrl || '',

  // Additional Fields
  remark: emp.remark || '',

  // Legacy Fields
  dob: emp.dob ? new Date(emp.dob) : undefined,
  familyMembers: emp.familyMembers,
  empName: emp.empName || emp.employeeName || '',
  empId: emp.empId || emp.employeeNo || ''
});

// Utility to extract only the date part (yyyy-mm-dd) from a string or Date
function extractDatePart(dateVal: string | Date | undefined): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    const match = dateVal.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return null;
}

export async function getAllApplications(): Promise<StoredEmployee[]> {
  console.log('[GET_ALL_APPLICATIONS] Fetching all applications for admin dashboard.');
  try {
    const { employees } = await getEmployeesService({}, 0, 1000) as { employees: any }; // Get first 1000 applications
    console.log(`[GET_ALL_APPLICATIONS] Found ${employees.length} documents in Appwrite.`);
    // helper to map backend object shape into UI StoredEmployee
    const mapBackendEmployee = (emp: any): StoredEmployee => ({
      ...emp,
      empName: emp.empName || emp.fullName || '',
      empId: emp.empId || emp.employeeId || '',
      applicationId: emp.applicationId ?? emp.id ?? '',
      fullName: emp.fullName || emp.empName,
      employeeId: emp.employeeId || emp.empId,
      submissionDate: emp.submissionDate || emp.applicationDate,
    });

    const mapped: StoredEmployee[] = (employees as any[]).map(mapBackendEmployee);
    return mapped;
  } catch (error: any) {
    console.error('[GET_ALL_APPLICATIONS] Error fetching all applications:', error.message, error.stack);
    return [];
  }
}

export async function getApplicationById(applicationId: string): Promise<StoredEmployee | null> {
  console.log(`[GET_APPLICATION_BY_ID] Fetching application with ID: ${applicationId}`);
  try {
    const employee = await getEmployeeService(applicationId);
    if (employee) {
      console.log(`[GET_APPLICATION_BY_ID] Successfully retrieved application ID: ${applicationId}`);
    } else {
      console.log(`[GET_APPLICATION_BY_ID] No application found with ID: ${applicationId}`);
    }
    return employee ? (mapBackendEmployee as any)(employee) : null;
  } catch (error: any) {
    console.error(`[GET_APPLICATION_BY_ID] Error fetching application ${applicationId}:`, error.message);
    return null;
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: 'approved' | 'rejected',
  rejectionRemarks?: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[UPDATE_APPLICATION_STATUS] Updating App ID ${applicationId} to status: ${newStatus}`);

  try {
    // First verify the application exists
    const application = await getEmployeeService(applicationId);
    if (!application) {
      console.error(`[UPDATE_APPLICATION_STATUS] Application ${applicationId} not found`);
      return {
        success: false,
        message: 'Application not found'
      };
    }

    const statusMap = {
      'approved': 'Approved',
      'rejected': 'Rejected'
    } as const;

    const updateData = {
      status: statusMap[newStatus.toLowerCase() as keyof typeof statusMap],
      ...(rejectionRemarks && { remark: rejectionRemarks }),
      updatedAt: new Date().toISOString()
    };

    console.log(`[UPDATE_APPLICATION_STATUS] Updating with data:`, updateData);
    await updateEmployee(applicationId, updateData);
    console.log(`[UPDATE_APPLICATION_STATUS] Successfully updated App ID ${applicationId} to ${newStatus}`);
    return {
      success: true,
      message: `Application ${newStatus.toLowerCase()} successfully.`
    };
  } catch (error: any) {
    console.error(`[UPDATE_APPLICATION_STATUS] Error updating App ID ${applicationId}:`, error.message);
    return {
      success: false,
      message: `Failed to update application status: ${error.message}`
    };
  }
}

export async function getApplicationStatus(applicationId: string, dateOfBirth: string) {
  console.log(`[GET_APPLICATION_STATUS] Checking status for ID: ${applicationId}, DOB: ${dateOfBirth}`);
  
  try {
    const appData = await getEmployeeService(applicationId);
    console.log('[GET_APPLICATION_STATUS] Retrieved data:', appData);

    if (!appData) {
      console.log('[GET_APPLICATION_STATUS] No application found');
      return {
        success: false,
        message: 'Application not found'
      };
    }

    // Always compare only the date part for DOB
    const storedDob = extractDatePart(appData.dateOfBirth || appData.dob);
    const providedDob = extractDatePart(dateOfBirth);

    console.log('[GET_APPLICATION_STATUS] Comparing DOB:', { stored: storedDob, provided: providedDob });
    const dobMatch = storedDob === providedDob;

    if (!dobMatch) {
      console.log('[GET_APPLICATION_STATUS] DOB mismatch');
      return {
        success: false,
        message: 'Invalid date of birth'
      };
    }

    const result = {
      success: true,
      message: 'Application found',
      status: appData.status?.toLowerCase(),
      applicantName: appData.employeeName,
      submissionDate: appData.applicationDate ? 
        extractDatePart(appData.applicationDate) : null,
      remark: appData.remark || '',
      photoUrl: appData.photoUrl || (appData.photoFileId ? `/api/file/${appData.photoFileId}` : ''),
      signatureUrl: appData.signatureUrl || (appData.signatureFileId ? `/api/file/${appData.signatureFileId}` : '')
    };

    console.log('[GET_APPLICATION_STATUS] Returning result:', result);
    return result;
  } catch (error) {
    console.error('[GET_APPLICATION_STATUS] Error:', error);
    return {
      success: false,
      message: 'Failed to fetch application status. Please try again.'
    };
  }
}

export async function submitApplication(formData: FormData) {
  try {
    console.log('Starting application submission...');

    // Get files from form data
    const photoFile = formData.get('uploadPhoto') as File;
    const signatureFile = formData.get('uploadSignature') as File;
    const hindiNameFile = formData.get('uploadHindiName') as File | null;
    const hindiDesignationFile = formData.get('uploadHindiDesignation') as File | null;

    // Validate required files
    if (!photoFile || !signatureFile) {
      throw new Error('Photo and signature files are required');
    }

    // Verify files are actually File objects
    if (!(photoFile instanceof File) || !(signatureFile instanceof File)) {
      throw new Error('Invalid file upload data');
    }

    let photoId, signatureId, hindiNameId, hindiDesignationId;

    try {
      // Upload photo
      console.log('Uploading photo...', { name: photoFile.name, size: photoFile.size });
      const photoResult = await uploadToStorage(photoFile);
      photoId = photoResult.$id;
      console.log('Photo upload successful:', photoId);

      // Upload signature
      console.log('Uploading signature...', { name: signatureFile.name, size: signatureFile.size });
      const signatureResult = await uploadToStorage(signatureFile);
      signatureId = signatureResult.$id;
      console.log('Signature upload successful:', signatureId);

      // Upload optional hindi name file
      if (hindiNameFile instanceof File) {
        console.log('Uploading hindi name...', { name: hindiNameFile.name, size: hindiNameFile.size });
        const hindiNameResult = await uploadToStorage(hindiNameFile);
        hindiNameId = hindiNameResult.$id;
        console.log('Hindi name upload successful:', hindiNameId);
      }

      // Upload optional hindi designation file
      if (hindiDesignationFile instanceof File) {
        console.log('Uploading hindi designation...', { name: hindiDesignationFile.name, size: hindiDesignationFile.size });
        const hindiDesignationResult = await uploadToStorage(hindiDesignationFile);
        hindiDesignationId = hindiDesignationResult.$id;
        console.log('Hindi designation upload successful:', hindiDesignationId);
      }
    } catch (err) {
      const error = err as Error;
      console.error('File upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }

    // Create the payload
    const payload = {
      status: 'Pending',
      applicationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicantType: formData.get('applicantType'),
      employeeName: formData.get('employeeName'),
      designation: formData.get('designation'),
      employeeNo: formData.get('employeeNo'),
      ruidNo: formData.get('ruidNo'),
      dateOfBirth: formData.get('dateOfBirth'),
      department: formData.get('department'),
      station: formData.get('station'),
      billUnit: formData.get('billUnit'),
      residentialAddress: formData.get('residentialAddress'),
      rlyContactNumber: formData.get('rlyContactNumber'),
      mobileNumber: formData.get('mobileNumber'),
      reasonForApplication: formData.get('reasonForApplication'),
      emergencyContactName: formData.get('emergencyContactName'),
      emergencyContactNumber: formData.get('emergencyContactNumber'),
      familyMembersJson: formData.get('familyMembersJson'),
      photoFileId: photoId,
      signatureFileId: signatureId,
      hindiNameFileId: hindiNameId,
      hindiDesignationFileId: hindiDesignationId,
    };

    console.log('Creating employee record with payload:', payload);

    // Create employee record
    const response = await createEmployee(payload);
    console.log('Employee record created successfully:', response);

    return {
      success: true,
      data: response
    };

  } catch (err) {
    const error = err as Error;
    console.error('Application submission failed:', error);
    throw new Error(`Failed to submit application: ${error.message}`);
  }
}