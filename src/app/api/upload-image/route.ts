import { NextRequest, NextResponse } from 'next/server';
import { LocalFileStorage } from '@/lib/localFileStorage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;
    const requestId = formData.get('requestId') as string;
    const description = formData.get('description') as string;

    if (!file || !userEmail || !requestId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Generate unique file ID
    const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store file locally
    LocalFileStorage.saveFile(fileId, base64, {
      mimeType: file.type,
      fileName: file.name,
      userEmail,
      requestId,
      description,
      uploadedAt: new Date().toISOString()
    });
    
    console.log(`📁 File stored locally with ID: ${fileId}`);

    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: 'Image uploaded successfully (local storage)'
    });

  } catch (error) {
    console.error('❌ Error in upload API:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
} 