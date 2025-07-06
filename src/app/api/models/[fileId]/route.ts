import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveConfig } from '@/lib/googleDriveConfig';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.log('🔥 Models API route called');
  try {
    const { fileId } = await params;
    console.log('📁 FileId:', fileId);
    
    const apiKey = GoogleDriveConfig.getApiKey();
    console.log('🔑 API Key configured:', !!apiKey);
    
    if (!apiKey) {
      console.error('❌ No API key configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // Fetch the file from Google Drive using the proper API endpoint
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch from Google Drive:', response.status);
      return NextResponse.json({ error: 'Failed to fetch model' }, { status: response.status });
    }
    
    // Get the file content
    const fileBuffer = await response.arrayBuffer();
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename') || '';
    
    if (filename.endsWith('.glb')) {
      contentType = 'model/gltf-binary';
    } else if (filename.endsWith('.gltf')) {
      contentType = 'model/gltf+json';
    } else if (filename.endsWith('.obj')) {
      contentType = 'text/plain';
    } else if (filename.endsWith('.fbx')) {
      contentType = 'application/octet-stream';
    }
    
    // Return the file with proper CORS headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
    
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 