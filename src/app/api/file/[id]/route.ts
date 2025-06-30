import { NextRequest, NextResponse } from 'next/server';
import { storage, STORAGE_BUCKET_ID } from '@/lib/appwrite';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get the file view - returns an ArrayBuffer
    const fileBuffer = await storage.getFileView(STORAGE_BUCKET_ID, params.id) as unknown as ArrayBuffer;
    
    // Get file download to access file metadata
    const fileMetadata = await storage.getFile(STORAGE_BUCKET_ID, params.id);
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileMetadata.mimeType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('[API_FILE] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
} 