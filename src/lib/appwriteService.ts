import { 
  ID,
  databases, 
  storage,
  DATABASE_ID,
  EMPLOYEES_COLLECTION_ID,
  ADMIN_USERS_COLLECTION_ID,
  STATS_COLLECTION_ID,
  STORAGE_BUCKET_ID
} from './appwrite';
import { Buffer } from 'buffer';

let InputFile: any;
if (typeof window === 'undefined') {
  ({ InputFile } = require('node-appwrite'));
}

// Employee Operations
export const employeeService = {
  async listEmployees(queries: string[] = []) {
    return await databases.listDocuments(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      queries
    );
  },

  async getEmployee(documentId: string) {
    return await databases.getDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      documentId
    );
  },

  async createEmployee(data: any) {
    return await databases.createDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      ID.unique(),
      data
    );
  },

  async updateEmployee(documentId: string, data: any) {
    return await databases.updateDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      documentId,
      data
    );
  },

  async deleteEmployee(documentId: string) {
    return await databases.deleteDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      documentId
    );
  }
};

// Admin User Operations
export const adminService = {
  async listAdmins(queries: string[] = []) {
    return await databases.listDocuments(
      DATABASE_ID,
      ADMIN_USERS_COLLECTION_ID,
      queries
    );
  },
  // Add other admin operations as needed
};

// Stats Operations
export const statsService = {
  async getStats(queries: string[] = []) {
    return await databases.listDocuments(
      DATABASE_ID,
      STATS_COLLECTION_ID,
      queries
    );
  },
  // Add other stats operations as needed
};

// File Storage Operations
export const fileService = {
  async uploadFile(file: File) {
    if (!file) throw new Error('File not provided');
    
    try {
      // Direct file upload using SDK
      const result = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Log success for debugging
      console.log('File upload successful:', {
        fileId: result.$id,
        name: file.name,
        size: file.size
      });
      
      return result;
    } catch (error) {
      // Log error for debugging
      console.error('File upload failed:', {
        error,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw error;
    }
  },

  async getFilePreview(fileId: string) {
    return storage.getFilePreview(STORAGE_BUCKET_ID, fileId);
  },

  async deleteFile(fileId: string) {
    return storage.deleteFile(STORAGE_BUCKET_ID, fileId);
  }
};

// Convenience re-export
export const uploadFile = fileService.uploadFile;
