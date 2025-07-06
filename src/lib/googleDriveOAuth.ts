import { GoogleDriveConfig } from './googleDriveConfig';

// Google Drive Folder IDs
export const GOOGLE_DRIVE_FOLDERS = GoogleDriveConfig.FOLDERS;

// Type definitions
declare global {
  interface Window {
    google: any;
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
      };
      auth2: {
        init: (config: { client_id: string; scope: string }) => Promise<any>;
        getAuthInstance: () => any;
      };
    };
  }
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  downloadUrl?: string;
  viewUrl?: string;
  error?: string;
}

export class GoogleDriveOAuth {
  private static accessToken: string | null = null;
  private static isInitialized = false;

  /**
   * Initialize Google Identity Services and APIs
   */
  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      console.log('🔄 Initializing Google Drive OAuth...');

      // Load Google Identity Services
      await this.loadGoogleIdentityServices();
      
      // Load Google API for Drive calls
      await this.loadGoogleAPI();
      
      // Initialize gapi client
      await new Promise<void>((resolve) => {
        window.gapi.load('client', resolve);
      });

      // Initialize with API key if available
      if (GoogleDriveConfig.API_KEY) {
        await window.gapi.client.init({
          apiKey: GoogleDriveConfig.API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });
      }

      this.isInitialized = true;
      console.log('✅ Google Drive OAuth initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Google Drive OAuth:', error);
      return false;
    }
  }

  /**
   * Load Google Identity Services script
   */
  private static loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load Google API script
   */
  private static loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Get OAuth access token using Google Identity Services
   */
  static async getAccessToken(): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.accessToken) {
        console.log('🔑 Using existing access token');
        return this.accessToken;
      }

      console.log('🔑 Requesting new access token...');

      return new Promise((resolve, reject) => {
        // Create token client with explicit redirect URI
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GoogleDriveConfig.getClientId(),
          scope: GoogleDriveConfig.SCOPES,
          redirect_uri: window.location.origin, // Use current origin as redirect URI
          ux_mode: 'popup', // Use popup mode to avoid redirect issues
          callback: (response: any) => {
            if (response.error) {
              console.error('❌ OAuth error:', response.error);
              reject(new Error(response.error));
              return;
            }
            
            this.accessToken = response.access_token;
            console.log('✅ Access token obtained successfully');
            resolve(response.access_token);
          },
        });

        // Request access token with user consent
        tokenClient.requestAccessToken({
          prompt: 'consent'
        });
      });

    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Generate unique filename for uploads
   */
  static generateFileName(
    originalName: string, 
    userEmail: string, 
    index: number = 1,
    prefix: string = ''
  ): string {
    const timestamp = Date.now();
    const userIdentifier = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const extension = originalName.split('.').pop() || 'jpg';
    const baseName = cleanName.replace(`.${extension}`, '');
    
    const fileName = prefix 
      ? `${prefix}_${baseName}_${userIdentifier}_${timestamp}_${index}.${extension}`
      : `${baseName}_${userIdentifier}_${timestamp}_${index}.${extension}`;
    
    return fileName;
  }

  /**
   * Upload single file to Google Drive
   */
  static async uploadFile(
    file: File,
    fileName: string,
    folderId: string = GOOGLE_DRIVE_FOLDERS.USER_IMAGES
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading ${fileName} to Google Drive folder: ${folderId}`);

      // Get access token
      const accessToken = await this.getAccessToken();

      // Create file metadata
      const metadata = {
        name: fileName,
        parents: [folderId],
        description: `Uploaded from Art Code - ${new Date().toISOString()}`
      };

      // Create multipart form data
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      // Upload file using Google Drive API
      const response = await fetch(
        `${GoogleDriveConfig.API_CONFIG.UPLOAD_URL}?uploadType=multipart&fields=id,name,webViewLink`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: form
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload API Error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Upload API Response:', result);
      
      // Make file publicly accessible
      await this.makeFilePublic(result.id, accessToken);

      // Generate download URL
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${result.id}`;
      const viewUrl = result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;

      console.log(`✅ File uploaded successfully: ${fileName} (ID: ${result.id})`);
      
      return {
        success: true,
        fileId: result.id,
        fileName: fileName,
        downloadUrl: downloadUrl,
        viewUrl: viewUrl
      };

    } catch (error) {
      console.error('❌ File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        fileName: fileName,
        error: errorMessage
      };
    }
  }

  /**
   * Make file publicly accessible
   */
  static async makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    try {
      console.log(`🔓 Making file ${fileId} publicly accessible...`);

      const response = await fetch(
        `${GoogleDriveConfig.API_CONFIG.BASE_URL}/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        }
      );

      if (response.ok) {
        console.log(`✅ File ${fileId} made publicly accessible`);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Could not make file public:', errorText);
      }
    } catch (error) {
      console.warn('⚠️ Could not make file public:', error);
    }
  }

  /**
   * Upload multiple images with progress tracking
   */
  static async uploadMultipleImages(
    files: File[],
    userEmail: string,
    projectName: string = '',
    folderId?: string
  ): Promise<{
    success: boolean;
    results: UploadResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    console.log(`📸 Starting upload of ${files.length} images`);
    console.log(`👤 User: ${userEmail}`);
    console.log(`📁 Project: ${projectName}`);

    const targetFolder = folderId || GOOGLE_DRIVE_FOLDERS.USER_IMAGES;
    const results: UploadResult[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        console.log(`📤 Uploading image ${i + 1}/${files.length}: ${file.name}`);

        // Generate unique filename
        const fileName = this.generateFileName(
          file.name,
          userEmail,
          i + 1,
          projectName
        );

        // Upload file
        const uploadResult = await this.uploadFile(file, fileName, targetFolder);
        results.push(uploadResult);

        if (uploadResult.success) {
          successful++;
          console.log(`✅ Image ${i + 1}/${files.length} uploaded successfully: ${fileName}`);
        } else {
          failed++;
          console.error(`❌ Failed to upload image ${i + 1}:`, uploadResult.error);
        }

      } catch (error) {
        console.error(`❌ Failed to upload image ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({
          success: false,
          fileName: files[i].name,
          error: errorMessage
        });
        failed++;
      }
    }

    const overallSuccess = successful > 0;
    console.log(`🎉 Upload batch complete: ${successful}/${files.length} images uploaded successfully`);

    return {
      success: overallSuccess,
      results,
      summary: {
        total: files.length,
        successful,
        failed
      }
    };
  }

  /**
   * Test Google Drive connection
   */
  static async testConnection(): Promise<{ connected: boolean; message: string; userInfo?: any }> {
    try {
      console.log('🔄 Testing Google Drive connection...');

      const initialized = await this.initialize();
      if (!initialized) {
        return { connected: false, message: 'Failed to initialize Google API' };
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return { connected: false, message: 'Failed to get access token' };
      }

      // Test API call to get user info
      const response = await fetch(
        `${GoogleDriveConfig.API_CONFIG.BASE_URL}/about?fields=user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Google Drive connection successful');
        return {
          connected: true,
          message: 'Connected to Google Drive',
          userInfo: {
            name: data.user?.displayName || 'Unknown',
            email: data.user?.emailAddress || 'Unknown',
            photoLink: data.user?.photoLink
          }
        };
      } else {
        const errorText = await response.text();
        return {
          connected: false,
          message: `API test failed: ${response.status} ${response.statusText} - ${errorText}`
        };
      }

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        connected: false,
        message: `Connection failed: ${errorMessage}`
      };
    }
  }

  /**
   * Clear stored access token (for logout)
   */
  static clearAccessToken(): void {
    this.accessToken = null;
    console.log('🔓 Access token cleared');
  }
} 