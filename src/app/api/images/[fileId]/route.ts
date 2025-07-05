import { NextRequest, NextResponse } from 'next/server';
import { LocalFileStorage } from '@/lib/localFileStorage';
import { GoogleAuth } from 'google-auth-library';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // First try to get from local storage
    const fileData = LocalFileStorage.getFile(fileId);
    
    if (fileData) {
      // Convert base64 back to buffer
      const buffer = Buffer.from(fileData.data, 'base64');

      // Return the image with appropriate headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': fileData.metadata.mimeType || 'image/jpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Disposition': `inline; filename="${fileData.metadata.fileName || 'image'}"`,
        },
      });
    }

    // If not in local storage, try to fetch from Google Drive
    let driveResponse;
    
    // Try Service Account first (for private files)
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        let credentials;
        try {
          credentials = JSON.parse(serviceAccountKey);
        } catch (jsonError) {
          try {
            const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
            credentials = JSON.parse(decodedKey);
          } catch (base64Error) {
            console.error('Failed to parse service account key:', jsonError.message);
            throw new Error('Invalid service account configuration');
          }
        }

        const auth = new GoogleAuth({
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });

        const authClient = await auth.getClient();
        const accessToken = await authClient.getAccessToken();

        if (!accessToken.token) {
          throw new Error('Failed to get access token');
        }

        // Fetch image from Google Drive using Service Account
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        driveResponse = await fetch(driveUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`
          }
        });

        if (!driveResponse.ok) {
          console.error(`❌ Google Drive Service Account fetch failed: ${driveResponse.status} ${driveResponse.statusText}`);
          throw new Error('Service Account fetch failed');
        }
      } catch (authError) {
        console.error('❌ Service Account authentication failed:', authError);
        // Fall back to API key
        driveResponse = null;
      }
    }
    
    // If Service Account failed or not configured, try API key for public files
    if (!driveResponse) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Google Drive access not configured' },
          { status: 500 }
        );
      }

      const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
      driveResponse = await fetch(driveUrl);
      
      if (!driveResponse.ok) {
        console.error(`❌ Google Drive API key fetch failed: ${driveResponse.status} ${driveResponse.statusText}`);
        return NextResponse.json(
          { error: 'Image not found in Google Drive' },
          { status: 404 }
        );
      }
    }

    const imageBuffer = await driveResponse.arrayBuffer();
    const contentType = driveResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="image"`,
      },
    });

  } catch (error) {
    console.error('❌ Error serving image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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