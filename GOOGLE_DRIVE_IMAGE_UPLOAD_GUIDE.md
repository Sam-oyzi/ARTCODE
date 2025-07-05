# Google Drive Image Upload Implementation Guide

## Overview
This guide explains how to implement image upload/export functionality to Google Drive folders using OAuth authentication. This system allows users to upload images directly from your web application to specific Google Drive folders, with automatic file naming, public access configuration, and comprehensive error handling.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [OAuth Configuration](#oauth-configuration)
4. [Implementation Files](#implementation-files)
5. [Usage Examples](#usage-examples)
6. [File Naming System](#file-naming-system)
7. [Error Handling](#error-handling)
8. [Testing Guide](#testing-guide)
9. [Common Issues](#common-issues)

---

## Prerequisites

### Required Dependencies
```json
{
  "dependencies": {
    "firebase": "^11.9.1"  // Optional, for storing metadata
  }
}
```

### Google Cloud Console Requirements
- Google Cloud Project with Google Drive API enabled
- OAuth 2.0 Client ID for web application
- API Key for Google Drive API (optional)
- Google Drive folder with proper permissions

---

## Google Cloud Setup

### Step 1: Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" → "Library"
4. Search for "Google Drive API" and enable it

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add your domain to "Authorized JavaScript origins":
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Add redirect URIs if needed
6. Copy the Client ID

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" for public apps
3. Fill in required information:
   - App name
   - User support email
   - Developer contact email
4. Add scopes: `https://www.googleapis.com/auth/drive.file`
5. Add test users (for development)

---

## OAuth Configuration

### Environment Variables (.env)
```env
# Google Drive OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key_here

# Google Drive Folder IDs
VITE_USER_IMAGES_FOLDER_ID=your_images_folder_id
VITE_USER_DOCUMENTS_FOLDER_ID=your_documents_folder_id
```

### Google Drive Configuration (googleDriveConfig.ts)
```typescript
export class GoogleDriveConfig {
  // OAuth Configuration
  static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  static readonly API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

  // Folder IDs for different types of uploads
  static readonly FOLDERS = {
    USER_IMAGES: import.meta.env.VITE_USER_IMAGES_FOLDER_ID || '',
    USER_DOCUMENTS: import.meta.env.VITE_USER_DOCUMENTS_FOLDER_ID || '',
    USER_REQUESTS: 'your_user_requests_folder_id'  // Replace with actual ID
  };

  // OAuth Scopes
  static readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';

  // API Configuration
  static readonly API_CONFIG = {
    UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3/files',
    BASE_URL: 'https://www.googleapis.com/drive/v3'
  };

  static isConfigured(): boolean {
    return !!(this.CLIENT_ID && this.FOLDERS.USER_IMAGES);
  }

  static getClientId(): string {
    return this.CLIENT_ID;
  }
}
```

---

## Implementation Files

### 1. Google Drive OAuth Service (googleDriveOAuth.ts)

```typescript
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
        // Create token client
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GoogleDriveConfig.getClientId(),
          scope: GoogleDriveConfig.SCOPES,
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
        description: `Uploaded from Web App - ${new Date().toISOString()}`
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
      return {
        success: false,
        fileName: fileName,
        error: error.message
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
        results.push({
          success: false,
          fileName: files[i].name,
          error: error.message
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
      return {
        connected: false,
        message: `Connection failed: ${error.message}`
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
```

### 2. Image Upload Service (imageUploadService.ts)

```typescript
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
        message: `System test failed: ${error.message}`
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
```

---

## Usage Examples

### 1. Basic Image Upload Component

```typescript
import React, { useState } from 'react';
import { ImageUploadService, UploadSummary } from '../lib/imageUploadService';

interface ImageUploaderProps {
  userEmail: string;
  projectName?: string;
  onUploadComplete?: (summary: UploadSummary) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  userEmail, 
  projectName = 'photos',
  onUploadComplete 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadSummary | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError('');
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      console.log('🚀 Starting upload for user:', userEmail);
      
      const summary = await ImageUploadService.uploadImages(selectedFiles, {
        userEmail,
        projectName,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      console.log('✅ Upload completed:', summary);
      setUploadResult(summary);
      
      if (onUploadComplete) {
        onUploadComplete(summary);
      }

      // Clear selected files
      setSelectedFiles([]);

    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const testConnection = async () => {
    try {
      const test = await ImageUploadService.testUploadSystem();
      if (test.ready) {
        alert('✅ System ready for uploads!');
      } else {
        alert(`❌ System not ready: ${test.message}`);
      }
    } catch (err) {
      alert(`❌ Test failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Upload Images to Google Drive</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} style={{ marginBottom: '10px' }}>
          🧪 Test Connection
        </button>
        
        <div>
          <label htmlFor="file-input">Select Images:</label>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>
        
        {selectedFiles.length > 0 && (
          <div style={{ margin: '10px 0' }}>
            <p>Selected files: {selectedFiles.length}</p>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button 
        onClick={handleUpload} 
        disabled={uploading || selectedFiles.length === 0}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? '📤 Uploading...' : '📤 Upload Images'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ❌ Error: {error}
        </div>
      )}

      {uploadResult && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>Upload Results:</h4>
          <p>Total: {uploadResult.total}</p>
          <p>Successful: {uploadResult.successful}</p>
          <p>Failed: {uploadResult.failed}</p>
          
          {uploadResult.successful > 0 && (
            <div>
              <h5>Uploaded Images:</h5>
              <ul>
                {uploadResult.results
                  .filter(r => r.success)
                  .map((result, index) => (
                    <li key={index}>
                      <a href={result.viewUrl} target="_blank" rel="noopener noreferrer">
                        {result.fileName}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {uploadResult.failed > 0 && (
            <div>
              <h5>Failed Uploads:</h5>
              <ul>
                {uploadResult.results
                  .filter(r => !r.success)
                  .map((result, index) => (
                    <li key={index} style={{ color: 'red' }}>
                      {result.fileName}: {result.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
```

### 2. Drag & Drop Upload Component

```typescript
import React, { useState, useCallback } from 'react';
import { ImageUploadService } from '../lib/imageUploadService';

const DragDropUploader: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      alert('Please drop image files only');
      return;
    }

    setUploading(true);

    try {
      const summary = await ImageUploadService.uploadImages(files, { userEmail });
      alert(`✅ Upload complete: ${summary.successful}/${summary.total} images uploaded`);
    } catch (error) {
      alert(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [userEmail]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8ff' : '#f9f9f9',
        cursor: uploading ? 'not-allowed' : 'pointer'
      }}
    >
      {uploading ? (
        <div>📤 Uploading images...</div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
          <div>Drag & drop images here to upload to Google Drive</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Supports: JPG, PNG, WebP (max 5MB each)
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUploader;
```

### 3. Programmatic Upload Example

```typescript
import { ImageUploadService } from '../lib/imageUploadService';

// Example: Upload user profile picture
export async function uploadProfilePicture(file: File, userEmail: string): Promise<string> {
  try {
    const summary = await ImageUploadService.uploadImages([file], {
      userEmail,
      projectName: 'profile_picture',
      folderId: 'your_profile_pictures_folder_id'
    });

    if (summary.successful > 0) {
      return summary.imageUrls[0]; // Return the URL of uploaded image
    } else {
      throw new Error('Failed to upload profile picture');
    }
  } catch (error) {
    console.error('Profile picture upload failed:', error);
    throw error;
  }
}

// Example: Batch upload project images
export async function uploadProjectImages(
  files: File[], 
  userEmail: string, 
  projectName: string
): Promise<string[]> {
  try {
    const summary = await ImageUploadService.uploadImages(files, {
      userEmail,
      projectName,
      maxFileSize: 10 * 1024 * 1024, // 10MB for project images
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
    });

    console.log(`Project upload: ${summary.successful}/${summary.total} images uploaded`);
    return summary.imageUrls;
  } catch (error) {
    console.error('Project images upload failed:', error);
    throw error;
  }
}
```

---

## File Naming System

The system automatically generates unique filenames to prevent conflicts and organize files:

### Naming Pattern
```
{prefix}_{baseName}_{userIdentifier}_{timestamp}_{index}.{extension}
```

### Examples
```
profile_picture_avatar_john_doe_1699123456789_1.png
project_furniture_chair_jane_smith_1699123456790_2.jpg
request_sofa_modern_bob_wilson_1699123456791_3.webp
```

### Components
- **prefix**: Optional prefix (e.g., "profile_picture", "project")
- **baseName**: Cleaned original filename
- **userIdentifier**: User email prefix with special chars removed
- **timestamp**: Unix timestamp for uniqueness
- **index**: File number for multiple uploads
- **extension**: Original file extension

---

## Error Handling

### Common Error Types and Solutions

#### 1. OAuth/Authentication Errors
```typescript
// Handle OAuth errors
try {
  await ImageUploadService.uploadImages(files, options);
} catch (error) {
  if (error.message.includes('OAuth')) {
    // Clear token and retry
    GoogleDriveOAuth.clearAccessToken();
    // Show re-authentication UI
  }
}
```

#### 2. File Validation Errors
```typescript
// Validate before upload
const validation = ImageUploadService.validateFiles(files, options);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  // Show validation errors to user
  return;
}
```

#### 3. Network/API Errors
```typescript
// Implement retry logic
async function uploadWithRetry(files, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ImageUploadService.uploadImages(files, options);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`Upload attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## Testing Guide

### Test Checklist

1. **✅ Configuration Test**
   ```typescript
   const configTest = GoogleDriveConfig.isConfigured();
   console.log('Config ready:', configTest);
   ```

2. **✅ Connection Test**
   ```typescript
   const connectionTest = await ImageUploadService.testUploadSystem();
   console.log('System ready:', connectionTest.ready);
   ```

3. **✅ Single File Upload Test**
   ```typescript
   // Test with a small image file
   const testFile = new File(['test'], 'test.png', { type: 'image/png' });
   ```

4. **✅ Multiple File Upload Test**
   ```typescript
   // Test with multiple files
   const testFiles = [file1, file2, file3];
   ```

5. **✅ Large File Test**
   ```typescript
   // Test file size limits
   const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg');
   ```

### Debug Steps

1. Open browser console and check for errors
2. Verify environment variables are set correctly
3. Test OAuth flow manually
4. Check Google Cloud Console quotas
5. Verify folder permissions in Google Drive

---

## Common Issues

### Issue 1: "OAuth Error" or "Access Denied"
**Solutions:**
- Check OAuth consent screen configuration
- Verify authorized JavaScript origins
- Ensure client ID is correct
- Check if app is in testing mode with proper test users

### Issue 2: "Folder Not Found" or "Permission Denied"
**Solutions:**
- Verify folder IDs are correct
- Check folder permissions in Google Drive
- Ensure OAuth scopes include `drive.file`

### Issue 3: Files Upload but Can't Access
**Solutions:**
- Verify `makeFilePublic` is working
- Check if files are in the correct folder
- Test direct URLs manually

### Issue 4: Upload Fails Silently
**Solutions:**
- Check browser console for errors
- Verify API quotas in Google Cloud Console
- Test with smaller files first
- Check network connectivity

### Production Considerations

1. **Rate Limiting**: Implement proper rate limiting
2. **Error Recovery**: Add comprehensive retry logic  
3. **Progress Tracking**: Show upload progress to users
4. **Security**: Never expose sensitive tokens
5. **Monitoring**: Track upload success rates
6. **Cleanup**: Implement file cleanup for failed uploads

This guide provides everything needed to implement robust image upload functionality to Google Drive folders. The system handles authentication, file validation, progress tracking, and error recovery automatically. 