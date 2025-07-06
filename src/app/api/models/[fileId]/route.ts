import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveConfig } from '@/lib/googleDriveConfig';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  console.log('🔥 Models API route called');
  console.log('🔍 Request URL:', request.url);
  console.log('🔍 Context params:', context);
  
  try {
    const resolvedParams = await context.params;
    const fileId = resolvedParams.fileId;
    console.log('🔍 Resolved params:', resolvedParams);
    console.log('📁 FileId:', fileId);
    
    // Get API key directly from environment variable for server-side use
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
    console.log('🔑 API Key configured:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('❌ No API key configured');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // Fetch the file from Google Drive using the proper API endpoint
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    console.log('🌐 Fetching from URL:', driveUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(driveUrl);
    console.log('📊 Google Drive response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch from Google Drive:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch model', 
        status: response.status,
        details: errorText 
      }, { status: response.status });
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