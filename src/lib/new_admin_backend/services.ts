'use server';

import { Client, Databases, Storage, ID, Query, Models } from 'appwrite';
import { storage, account } from '../appwrite';
import { databases } from '../appwrite';
import { StoredEmployee, InputEmployeeData, StoredAdminUser, StoredApplicationStats } from './types';

// Define a base document interface that matches Appwrite's Document type
interface AppwriteDocument extends Models.Document {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
}

// Extend the base document for our employee type
interface EmployeeDocument extends AppwriteDocument {
  name?: string;
  empName?: string;
  email?: string;
  department?: string;
  station?: string;
  status?: string;
  familyMembers?: Array<{
    name: string;
    relationship: string;
    dob: string | Date;
  }>;
  [key: string]: any;
}

// Extend for stats document
interface StatsDocument extends AppwriteDocument, StoredApplicationStats {}

// Helper type for document lists
interface DocumentList<T> {
  total: number;
  documents: T[];
}

import type { InputEmployeeData, StoredApplicationStats } from './types';

// Initialize database client
const getDatabases = () => {
  if (process.env.NEXT_PUBLIC_USE_ADMIN_API === 'true') {
    return new Databases(new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    );
  }
  throw new Error('Database client not initialized');
};

// Database constants
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const EMPLOYEES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID!;
const ADMIN_USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_USERS_COLLECTION_ID || 'admin_users';
const STATS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STATS_COLLECTION_ID || 'application_stats';
const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'YOUR_BUCKET_ID';

// Privileged server-side Appwrite client using API key (node-appwrite)
let adminDatabases: any = null;
let adminStorage: any = null;

if (typeof window === 'undefined' && process.env.APPWRITE_API_KEY) {
  try {
    // Dynamically import to avoid bundling in client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client, Databases, Storage } = require('node-appwrite');
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    adminDatabases = new Databases(adminClient);
    adminStorage = new Storage(adminClient);
  } catch (e) {
    console.error('Failed to init node-appwrite privileged client', e);
  }
}

// --- Authentication Functions ---
export const loginAdmin = async (email: string, password: string): Promise<any> => {
  return await account.createEmailPasswordSession(email, password);
};

export const createAdminUser = async (email: string, password: string, userData: InputAdminUserData): Promise<any> => {
  const user = await account.create(ID.unique(), email, password, userData.name);
  await databases.createDocument(
    DATABASE_ID,
    ADMIN_USERS_COLLECTION_ID,
    user.$id,
    {
      ...userData,
      createdAt: new Date().toISOString()
    }
  );
  return user;
};

// --- Employee Management ---
export const createEmployee = async (payload: any): Promise<any> => {
  try {
    console.log('[CREATE_EMPLOYEE] Validated payload:', payload);

    // Remove photoUrl and signatureUrl from payload as they're not part of the database schema
    const { photoUrl, signatureUrl, ...documentPayload } = payload;

    const response = await databases.createDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      ID.unique(),
      documentPayload
    );

    return response;
  } catch (error: any) {
    console.error('[CREATE_EMPLOYEE] Error:', error);
    throw new Error(error.message || 'Failed to create employee record');
  }
};

export const getEmployeeService = async (employeeId: string): Promise<StoredEmployee | null> => {
  try {
    console.log('[GET_EMPLOYEE_SERVICE] Config:', {
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      employeeId
    });
    
    const db = adminDatabases ?? databases;
    console.log('[GET_EMPLOYEE_SERVICE] Using admin databases:', !!adminDatabases);
    
    const response = await db.getDocument(DATABASE_ID, EMPLOYEES_COLLECTION_ID, employeeId);
    console.log('[GET_EMPLOYEE_SERVICE] Raw response:', response);
    
    if (!response) {
      console.log('[GET_EMPLOYEE_SERVICE] No document found');
      return null;
    }

    // Ensure required date fields exist
    if (!response.dob && !response.dateOfBirth) {
      console.error('[GET_EMPLOYEE_SERVICE] Missing dob/dateOfBirth field');
      return null;
    }

    if (!response.applicationDate) {
      console.error('[GET_EMPLOYEE_SERVICE] Missing applicationDate field');
      return null;
    }

    // Construct file URLs if file IDs are present
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const photoUrl = response.photoFileId && endpoint && projectId
      ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${response.photoFileId}/view?project=${projectId}&mode=admin`
      : response.photoUrl || '';
    const signatureUrl = response.signatureFileId && endpoint && projectId
      ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${response.signatureFileId}/view?project=${projectId}&mode=admin`
      : response.signatureUrl || '';
    const hindiNameUrl = response.hindiNameFileId && endpoint && projectId
      ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${response.hindiNameFileId}/view?project=${projectId}&mode=admin`
      : response.hindiNameUrl || '';
    const hindiDesignationUrl = response.hindiDesignationFileId && endpoint && projectId
      ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${response.hindiDesignationFileId}/view?project=${projectId}&mode=admin`
      : response.hindiDesignationUrl || '';

    const employee = {
      id: response.$id,
      ...response,
      empName: response.empName || response.fullName || '',
      empId: response.empId || response.employeeId || '',
      applicationId: response.applicationId ?? response.id ?? '',
      fullName: response.fullName || response.empName,
      employeeId: response.employeeId || response.empId,
      submissionDate: response.submissionDate || response.applicationDate,
      remark: response.remark ?? '',
      dob: new Date(response.dob || response.dateOfBirth),
      applicationDate: new Date(response.applicationDate),
      photoUrl,
      signatureUrl,
      hindiNameUrl,
      hindiDesignationUrl,
      familyMembers: (() => {
        const raw = response.familyMembers ?? response.familyMembersJson ?? [];
        let arr: any[] = [];
        try {
          arr = Array.isArray(raw) ? raw : JSON.parse(raw);
        } catch {
          arr = [];
        }
        if (!Array.isArray(arr)) arr = [];
        return arr.map((fm: any) => ({
          ...fm,
          dob: fm && fm.dob ? new Date(fm.dob) : new Date()
        }));
      })(),
      createdAt: new Date(response.$createdAt),
      updatedAt: new Date(response.$updatedAt),
      status: response.status || 'Pending'
    } as unknown as StoredEmployee;

    console.log('[GET_EMPLOYEE_SERVICE] Mapped employee:', employee);
    return employee;
  } catch (error) {
    console.error('[GET_EMPLOYEE_SERVICE] Error:', error);
    return null;
  }
};

export const updateEmployee = async (
  employeeId: string,
  updateData: Partial<Omit<StoredEmployee, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const dataToUpdate: any = { ...updateData };
  if (updateData.dob && updateData.dob instanceof Date) {
    dataToUpdate.dob = updateData.dob.toISOString();
  }
  if (updateData.applicationDate && updateData.applicationDate instanceof Date) {
    dataToUpdate.applicationDate = updateData.applicationDate.toISOString();
  }
  if (updateData.familyMembers) {
    dataToUpdate.familyMembers = JSON.stringify(updateData.familyMembers.map((fm: any) => ({
      ...fm,
      dob: fm.dob instanceof Date ? fm.dob.toISOString() : fm.dob,
    })));
  }

  const db = adminDatabases ?? databases;
  await db.updateDocument(
    DATABASE_ID,
    EMPLOYEES_COLLECTION_ID,
    employeeId,
    {
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    }
  );
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  await databases.deleteDocument(DATABASE_ID, EMPLOYEES_COLLECTION_ID, employeeId);
  await updateStats();
};

interface SimpleEmployee {
  id: string;
  status: string;
  [key: string]: any;
}

export const getEmployeesService = async (filters: Record<string, string>, offset = 0, limit = 1000) => {
  try {
    console.log('[GET_EMPLOYEES_SERVICE] Config:', {
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      filters,
      offset,
      limit
    });

    const db = adminDatabases ?? databases;
    console.log('[GET_EMPLOYEES_SERVICE] Using admin databases:', !!adminDatabases);

    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    // Add filters
    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }
    if (filters.department) {
      queries.push(Query.equal('department', filters.department));
    }
    if (filters.station) {
      queries.push(Query.equal('station', filters.station));
    }
    if (filters.applicantType) {
      queries.push(Query.equal('applicantType', filters.applicantType));
    }

    const response = await db.listDocuments(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      queries
    );

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    
    const employees = response.documents.map((doc: Models.Document) => {
      // Construct file URLs if file IDs are present
      const photoUrl = doc.photoFileId && endpoint && projectId
        ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${doc.photoFileId}/view?project=${projectId}&mode=admin`
        : '';
      const signatureUrl = doc.signatureFileId && endpoint && projectId
        ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${doc.signatureFileId}/view?project=${projectId}&mode=admin`
        : '';
      const hindiNameUrl = doc.hindiNameFileId && endpoint && projectId
        ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${doc.hindiNameFileId}/view?project=${projectId}&mode=admin`
        : '';
      const hindiDesignationUrl = doc.hindiDesignationFileId && endpoint && projectId
        ? `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${doc.hindiDesignationFileId}/view?project=${projectId}&mode=admin`
        : '';

      // Map the data to match StoredEmployee type exactly
      return {
        // Appwrite Document Fields
        $id: doc.$id,
        $collectionId: doc.$collectionId,
        $databaseId: doc.$databaseId,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        $permissions: doc.$permissions,

        // Required System Fields
        status: doc.status || 'Pending',
        applicationDate: new Date(doc.applicationDate || doc.$createdAt),
        createdAt: new Date(doc.$createdAt),
        updatedAt: new Date(doc.$updatedAt),

        // Core Fields
        familyMembersJson: doc.familyMembersJson || '[]',
        applicantType: doc.applicantType || 'non-gazetted',
        employeeName: doc.employeeName || doc.name || 'Unknown',
        designation: doc.designation || '',
        employeeNo: doc.employeeNo || '',
        ruidNo: doc.ruidNo || '',
        dateOfBirth: new Date(doc.dateOfBirth || doc.dob || Date.now()),
        department: doc.department || '',
        station: doc.station || '',
        billUnit: doc.billUnit || '',
        residentialAddress: doc.residentialAddress || '',
        rlyContactNumber: doc.rlyContactNumber || '',
        mobileNumber: doc.mobileNumber || '',
        reasonForApplication: doc.reasonForApplication || '',
        emergencyContactName: doc.emergencyContactName || '',
        emergencyContactNumber: doc.emergencyContactNumber || '',

        // File IDs
        photoFileId: doc.photoFileId || '',
        signatureFileId: doc.signatureFileId || '',
        hindiNameFileId: doc.hindiNameFileId || '',
        hindiDesignationFileId: doc.hindiDesignationFileId || '',

        // File URLs
        photoUrl,
        signatureUrl,
        hindiNameUrl,
        hindiDesignationUrl,

        // Additional Fields
        remark: doc.remark || ''
      } as StoredEmployee;
    });

    return { 
      employees, 
      total: response.total 
    };
  } catch (error) {
    console.error('Error in getEmployeesService:', error);
    return { employees: [], total: 0 };
  }
};

// --- File Management ---
export const uploadFile = async (fileUrl: string): Promise<string> => {
  let filePreview = '';
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Convert blob to file
    const file = new File(
      [blob], 
      'uploaded-file', 
      { type: blob.type }
    );
    
    // Upload to Appwrite Storage
    const fileId = await storage.createFile(
      STORAGE_BUCKET_ID,
      ID.unique(),
      file as any // Temporary workaround for type issue
    );
    
    // FIXED: Manual URL construction for uploadFile function
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (endpoint && projectId) {
      filePreview = `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId.$id}/view?project=${projectId}&mode=admin`;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    // Continue without the file preview if upload fails
  }
  return filePreview;
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
};

// --- Statistics & Analytics ---
export const updateStats = async (): Promise<void> => {
  try {
    const dbClient = adminDatabases ?? databases;

    const totalQuery = await dbClient.listDocuments(DATABASE_ID, EMPLOYEES_COLLECTION_ID, [Query.limit(1)]);
    const pendingQuery = await dbClient.listDocuments(DATABASE_ID, EMPLOYEES_COLLECTION_ID, [Query.equal('status', 'pending'), Query.limit(1)]);
    const approvedQuery = await dbClient.listDocuments(DATABASE_ID, EMPLOYEES_COLLECTION_ID, [Query.equal('status', 'approved'), Query.limit(1)]);
    const rejectedQuery = await dbClient.listDocuments(DATABASE_ID, EMPLOYEES_COLLECTION_ID, [Query.equal('status', 'rejected'), Query.limit(1)]);

    const statsData = {
      totalApplications: totalQuery.total,
      pendingCount: pendingQuery.total,
      approvedCount: approvedQuery.total,
      rejectedCount: rejectedQuery.total,
      lastUpdated: new Date().toISOString()
    };

    try {
      await dbClient.updateDocument(DATABASE_ID, STATS_COLLECTION_ID, 'summary', statsData);
    } catch (error) {
      await dbClient.createDocument(DATABASE_ID, STATS_COLLECTION_ID, 'summary', statsData);
    }
  } catch (error) {
    console.error("Error updating stats: ", error);
  }
};

export const getStats = async (): Promise<StoredApplicationStats | null> => {
  try {
    const response = await databases.listDocuments<StatsDocument>(
      DATABASE_ID,
      STATS_COLLECTION_ID,
      [Query.orderDesc('$createdAt'), Query.limit(1)]
    ) as unknown as DocumentList<StatsDocument>;

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      // Return only the stats fields we need
      return {
        lastUpdated: doc.lastUpdated || new Date().toISOString(),
        totalApplications: doc.totalApplications || 0,
        pendingCount: doc.pendingCount || 0,
        approvedCount: doc.approvedCount || 0,
        rejectedCount: doc.rejectedCount || 0
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting stats: ", error);
    return null;
  }
};

// --- Search & Filter Functions ---
export const searchEmployees = async (searchTerm: string): Promise<StoredEmployee[]> => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    EMPLOYEES_COLLECTION_ID,
    [
      Query.search('empName', searchTerm),
      Query.orderAsc('empName'),
      Query.limit(20)
    ]
  );

  return response.documents.map(doc => ({
    id: doc.$id,
    ...doc,
    empName: doc.empName ?? '',
    empId: doc.empId ?? '',
    designation: doc.designation ?? '',
    department: doc.department ?? '',
    station: doc.station ?? '',
    status: (doc.status ?? 'Pending') as StoredEmployee['status'],
    applicantType: doc.applicantType ?? 'non-gazetted',
    dob: new Date(doc.dob),
    applicationDate: new Date(doc.applicationDate),
    familyMembers: (doc.familyMembers || []).map((fm: any) => ({
      ...fm,
      dob: new Date(fm.dob),
    })),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  })) as unknown as StoredEmployee[];
};

export const getEmployeesByDateRange = async (startDate: Date, endDate: Date): Promise<StoredEmployee[]> => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    EMPLOYEES_COLLECTION_ID,
    [
      Query.greaterThanEqual('applicationDate', startDate.toISOString()),
      Query.lessThanEqual('applicationDate', endDate.toISOString()),
      Query.orderDesc('applicationDate')
    ]
  );

  return response.documents.map(doc => ({
    id: doc.$id,
    ...doc,
    empName: doc.empName ?? '',
    empId: doc.empId ?? '',
    designation: doc.designation ?? '',
    department: doc.department ?? '',
    station: doc.station ?? '',
    status: (doc.status ?? 'Pending') as StoredEmployee['status'],
    applicantType: doc.applicantType ?? 'non-gazetted',
    dob: new Date(doc.dob),
    applicationDate: new Date(doc.applicationDate),
    familyMembers: (doc.familyMembers || []).map((fm: any) => ({
      ...fm,
      dob: new Date(fm.dob),
    })),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  })) as unknown as StoredEmployee[];
};

export const getRecentApplications = async (): Promise<SimpleEmployee[]> => {
  try {
    console.log('[GET_RECENT_APPLICATIONS] Fetching recent applications');
    const db = adminDatabases ?? databases;
    const response = await db.listDocuments(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      [
        Query.limit(5),
        Query.orderDesc('$createdAt')
      ]
    );

    console.log('[GET_RECENT_APPLICATIONS] Response:', response);
    
    if (!response || !response.documents) {
      console.error('[GET_RECENT_APPLICATIONS] Invalid response');
      return [];
    }

    return response.documents.map((doc: Models.Document) => ({
      id: doc.$id,
      status: doc.status || 'Pending',
      empName: doc.empName || doc.fullName || 'Unknown',
      dob: doc.dob,
      applicationDate: doc.$createdAt
    }));
  } catch (error) {
    console.error('[GET_RECENT_APPLICATIONS] Error:', error);
    return [];
  }
};

// Helper function to map database response to StoredEmployee type
const mapEmployeeFromDb = (response: any): StoredEmployee => {
  const familyMembers = response.familyMembersJson ? JSON.parse(response.familyMembersJson) : [];
  
  return {
    id: response.$id,
    status: response.status,
    applicationDate: response.applicationDate,
    createdAt: response.$createdAt,
    updatedAt: response.$updatedAt,
    familyMembersJson: response.familyMembersJson,
    applicantType: response.applicantType,
    employeeName: response.employeeName,
    designation: response.designation,
    employeeNo: response.employeeNo,
    ruidNo: response.ruidNo,
    dateOfBirth: response.dateOfBirth,
    department: response.department,
    station: response.station,
    billUnit: response.billUnit,
    residentialAddress: response.residentialAddress,
    rlyContactNumber: response.rlyContactNumber,
    mobileNumber: response.mobileNumber,
    reasonForApplication: response.reasonForApplication,
    emergencyContactName: response.emergencyContactName,
    emergencyContactNumber: response.emergencyContactNumber,
    photoFileId: response.photoFileId,
    signatureFileId: response.signatureFileId,
    hindiNameFileId: response.hindiNameFileId,
    hindiDesignationFileId: response.hindiDesignationFileId,
    remark: response.remark,
    familyMembers,
  };
};