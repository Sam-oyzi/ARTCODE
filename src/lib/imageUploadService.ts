import { GoogleDriveOAuth, UploadResult } from './googleDriveOAuth';
import { GoogleDriveConfig } from './googleDriveConfig';

export interface ImageUploadOptions {
  userEmail: string;
  projectName?: string;
  folderId?: string;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  results: UploadResult[];
  imageUrls: string[];
  fileIds: string[];
}

export class ImageUploadService {
  
  // Default settings
  static readonly DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  /**
   * Upload images to Google Drive with validation
   */
  static async uploadImages(
    files: File[],
    options: ImageUploadOptions
  ): Promise<UploadSummary> {
    console.log('🚀 Starting image upload process...');
    console.log('📊 Upload options:', options);

    try {
      // Validate inputs
      const validation = this.validateFiles(files, options);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Test connection first
      const connectionTest = await GoogleDriveOAuth.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`Google Drive connection failed: ${connectionTest.message}`);
      }

      console.log('✅ Connection test passed, proceeding with upload...');

      // Upload files
      const uploadResult = await GoogleDriveOAuth.uploadMultipleImages(
        files,
        options.userEmail,
        options.projectName || 'images',
        options.folderId
      );

      // Extract URLs and file IDs
      const imageUrls: string[] = [];
      const fileIds: string[] = [];
      
      uploadResult.results.forEach((result) => {
        if (result.success && result.downloadUrl && result.fileId) {
          imageUrls.push(result.downloadUrl);
          fileIds.push(result.fileId);
        }
      });

      const summary: UploadSummary = {
        total: uploadResult.summary.total,
        successful: uploadResult.summary.successful,
        failed: uploadResult.summary.failed,
        results: uploadResult.results,
        imageUrls,
        fileIds
      };

      console.log('🎉 Image upload process completed:', summary);
      return summary;

    } catch (error) {
      console.error('❌ Image upload process failed:', error);
      throw error;
    }
  }

  /**
   * Validate files before upload
   */
  static validateFiles(
    files: File[],
    options: ImageUploadOptions
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;

    // Check if files array is valid
    if (!files || files.length === 0) {
      errors.push('No files provided for upload');
      return { isValid: false, errors };
    }

    // Check user email
    if (!options.userEmail || !options.userEmail.includes('@')) {
      errors.push('Valid user email is required');
    }

    // Check individual files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${file.name}: Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }
      
      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        errors.push(`File ${file.name}: File too large. Maximum size: ${maxSizeMB}MB`);
      }

      // Check if file has content
      if (file.size === 0) {
        errors.push(`File ${file.name}: File is empty`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Test upload system
   */
  static async testUploadSystem(): Promise<{ ready: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing image upload system...');

      // Test 1: Configuration check
      if (!GoogleDriveConfig.isConfigured()) {
        return {
          ready: false,
          message: 'Google Drive configuration is incomplete. Check your environment variables.'
        };
      }

      // Test 2: Connection test
      const connectionTest = await GoogleDriveOAuth.testConnection();
      if (!connectionTest.connected) {
        return {
          ready: false,
          message: `Google Drive connection failed: ${connectionTest.message}`
        };
      }

      // Test 3: Check folder access (optional)
      // This would require additional API calls

      return {
        ready: true,
        message: 'Image upload system is ready',
        details: {
          userInfo: connectionTest.userInfo,
          configuredFolders: Object.keys(GoogleDriveConfig.FOLDERS),
          clientId: GoogleDriveConfig.getClientId()
        }
      };

    } catch (error) {
      return {
        ready: false,
        message: `System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get upload progress callback
   */
  static createProgressCallback(
    onProgress?: (current: number, total: number, fileName: string) => void
  ) {
    return (current: number, total: number, fileName: string) => {
      const percentage = Math.round((current / total) * 100);
      console.log(`📊 Upload progress: ${percentage}% (${current}/${total}) - ${fileName}`);
      
      if (onProgress) {
        onProgress(current, total, fileName);
      }
    };
  }
} 