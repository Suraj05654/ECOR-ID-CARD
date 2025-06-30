import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Use API key on the server to bypass guest restriction
if (typeof window === 'undefined' && process.env.APPWRITE_API_KEY) {
  const c: any = client as any;
  if (typeof c.setHeader === 'function') {
    c.setHeader('X-Appwrite-Key', process.env.APPWRITE_API_KEY);
  }
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const EMPLOYEES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID!;
export const ADMIN_USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_USERS_COLLECTION_ID!;
export const STATS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STATS_COLLECTION_ID!;
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;

// Re-export Appwrite utilities
export { ID, Query, client };
