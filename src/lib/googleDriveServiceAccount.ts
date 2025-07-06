/**
 * Google Drive Service Account Implementation
 * This allows server-side uploads without user authentication
 */

export interface ServiceAccountConfig {
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  downloadUrl?: string;
  viewUrl?: string;
  error?: string;
}

export class GoogleDriveServiceAccount {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  /**
   * Generate JWT token for service account authentication
   */
  private static async generateJWT(serviceAccount: ServiceAccountConfig): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now
    };

    // In a real implementation, you'd use a proper JWT library
    // For now, we'll use the server-side approach
    return 'jwt-token-placeholder';
  }

  /**
   * Get access token using service account
   */
  private static async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken!;
    }

    // This should be done server-side for security
    throw new Error('Service account authentication must be implemented server-side');
  }

  /**
   * Upload file using service account (server-side only)
   */
  static async uploadFile(
    file: File,
    fileName: string,
    folderId: string
  ): Promise<UploadResult> {
    try {
      // This would be called via API route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('folderId', folderId);

      const response = await fetch('/api/upload-to-drive', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Service account upload failed:', error);
      return {
        success: false,
        fileName: fileName,
        error: error.message
      };
    }
  }
}

// Configuration guide
export const SERVICE_ACCOUNT_SETUP_GUIDE = `
# Service Account Setup Guide

## 1. Create Service Account
1. Go to Google Cloud Console
2. Navigate to IAM & Admin → Service Accounts
3. Click "Create Service Account"
4. Fill in name: "art-code-uploader"
5. Click "Create and Continue"

## 2. Generate Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the key file

## 3. Share Drive Folder
1. Go to your Google Drive folder
2. Right-click → Share
3. Add the service account email (from JSON)
4. Give "Editor" permission

## 4. Add to Environment
Add to your .env.local:
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

## 5. Better UX
- Users upload without Google login
- Files go directly to your Drive folder
- No authentication popups
- Much faster and cleaner
`; 