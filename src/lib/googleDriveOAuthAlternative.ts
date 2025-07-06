import { GoogleDriveConfig } from './googleDriveConfig';

// Extend the global Window interface to include gapi with auth2
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[]; }) => Promise<void>;
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

/**
 * Alternative OAuth implementation using older Google Sign-In library
 * This avoids the redirect_uri_mismatch issues with the newer Google Identity Services
 */
export class GoogleDriveOAuthAlternative {
  private static accessToken: string | null = null;
  private static isInitialized = false;

  /**
   * Initialize using the older gapi.auth2 library
   */
  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      console.log('🔄 Initializing Google OAuth (Alternative)...');

      // Check if client ID is configured
      const clientId = GoogleDriveConfig.getClientId();
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Load the Google API library
      await this.loadGoogleAPI();
      
      // Check if gapi is available
      if (!window.gapi) {
        throw new Error('Google API library failed to load');
      }

      // Initialize gapi client
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('auth2', () => {
          resolve();
        });
      });

      // Initialize auth2 with our client ID
      const authInstance = await window.gapi.auth2.init({
        client_id: clientId,
        scope: GoogleDriveConfig.SCOPES
      });

      if (!authInstance) {
        throw new Error('Failed to initialize auth2 instance');
      }

      this.isInitialized = true;
      console.log('✅ Google OAuth (Alternative) initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Google OAuth (Alternative):', error);
      this.isInitialized = false;
      return false;
    }
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
   * Get access token using auth2 library
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

      console.log('🔑 Requesting new access token (Alternative)...');

      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        console.log('🔐 User not signed in, prompting for sign-in...');
        const googleUser = await authInstance.signIn();
        const authResponse = googleUser.getAuthResponse();
        this.accessToken = authResponse.access_token;
      } else {
        console.log('✅ User already signed in');
        const googleUser = authInstance.currentUser.get();
        const authResponse = googleUser.getAuthResponse();
        this.accessToken = authResponse.access_token;
      }

      console.log('✅ Access token obtained successfully (Alternative)');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get access token (Alternative):', error);
      throw error;
    }
  }

  /**
   * Upload single file to Google Drive
   */
  static async uploadFile(
    file: File,
    fileName: string,
    folderId: string
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading ${fileName} to Google Drive folder: ${folderId}`);

      // Check if initialization is possible
      if (!this.isInitialized) {
        const initSuccess = await this.initialize();
        if (!initSuccess) {
          throw new Error('Failed to initialize Google OAuth Alternative - API library not available');
        }
      }

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
   * Test connection
   */
  static async testConnection(): Promise<{ connected: boolean; message: string; userInfo?: any }> {
    try {
      console.log('🔄 Testing Google OAuth connection (Alternative)...');

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
        console.log('✅ Google OAuth connection successful (Alternative)');
        return {
          connected: true,
          message: 'Connected to Google Drive (Alternative)',
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
      console.error('❌ Connection test failed (Alternative):', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        connected: false,
        message: `Connection failed: ${errorMessage}`
      };
    }
  }

  /**
   * Clear stored access token
   */
  static clearAccessToken(): void {
    this.accessToken = null;
    console.log('🔓 Access token cleared (Alternative)');
  }
} 