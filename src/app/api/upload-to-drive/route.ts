import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Server-side Google Drive upload started');

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folderId = formData.get('folderId') as string;

    if (!file || !fileName || !folderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if service account is configured
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service account not configured. Add GOOGLE_SERVICE_ACCOUNT_KEY to environment variables.',
          fallback: 'local-storage'
        },
        { status: 500 }
      );
    }

    // Parse service account credentials with better error handling
    let credentials;
    try {
      // Try to parse as regular JSON first
      credentials = JSON.parse(serviceAccountKey);
    } catch (jsonError) {
      try {
        // If that fails, try base64 decoding first
        const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
        credentials = JSON.parse(decodedKey);
      } catch (base64Error) {
        const jsonErrorMsg = jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        const base64ErrorMsg = base64Error instanceof Error ? base64Error.message : 'Unknown base64 error';
        
        console.error('JSON parsing error:', jsonErrorMsg);
        console.error('Base64 parsing error:', base64ErrorMsg);
        console.error('Service account key starts with:', serviceAccountKey.substring(0, 100) + '...');
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid service account key format. Error: ${jsonErrorMsg}. Make sure the JSON is properly formatted and all newlines are escaped as \\n`,
            debug: {
              jsonError: jsonErrorMsg,
              keyStart: serviceAccountKey.substring(0, 50) + '...',
              keyLength: serviceAccountKey.length
            }
          },
          { status: 500 }
        );
      }
    }

    // Validate required fields
    if (!credentials.type || !credentials.project_id || !credentials.private_key || !credentials.client_email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service account key is missing required fields (type, project_id, private_key, client_email)' 
        },
        { status: 500 }
      );
    }

    // Create Google Auth client
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    // Get access token
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // Create file metadata
    const metadata = {
      name: fileName,
      parents: [folderId],
      description: `Uploaded from Art Code - ${new Date().toISOString()}`
    };

    // Create multipart form data for Google Drive API
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const requestBody = 
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + file.type + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      Buffer.from(fileBuffer).toString('base64') +
      close_delim;

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: requestBody
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Google Drive upload error:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);

    // Make file publicly accessible
    try {
      console.log('🔓 Making file publicly accessible...');
      const permissionResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'writer',
            type: 'anyone'
          })
        }
      );
      
      if (!permissionResponse.ok) {
        const errorText = await permissionResponse.text();
        console.error('❌ Permission setting failed:', permissionResponse.status, errorText);
        throw new Error(`Permission setting failed: ${permissionResponse.status} ${permissionResponse.statusText}`);
      }
      
      const permissionResult = await permissionResponse.json();
      console.log('✅ File made publicly accessible:', permissionResult);
    } catch (permissionError) {
      console.error('❌ Failed to make file public:', permissionError);
      // Don't throw - file upload succeeded, just permission failed
      console.warn('⚠️  File uploaded but not publicly accessible. Will use Service Account for access.');
    }

    // Generate URLs
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${uploadResult.id}`;
    const viewUrl = uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.id}/view`;

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      fileName: fileName,
      downloadUrl: downloadUrl,
      viewUrl: viewUrl,
      method: 'Service Account (Server-side)'
    });

  } catch (error) {
    console.error('❌ Server-side upload failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        fallback: 'local-storage'
      },
      { status: 500 }
    );
  }
} 