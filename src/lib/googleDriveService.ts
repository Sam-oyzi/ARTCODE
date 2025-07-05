import { GoogleDriveConfig } from './googleDriveConfig';

export class GoogleDriveService {
  static readonly FOLDERS = GoogleDriveConfig.FOLDERS;
  static readonly DRIVE_API_BASE = GoogleDriveConfig.API_CONFIG.BASE_URL;

  /**
   * CRITICAL: Convert Google Drive file ID to proxy download URL
   * This is the key to making 3D models load properly (avoids CORS issues)
   */
  static getDirectDownloadUrl(fileId: string, filename?: string): string {
    const baseUrl = `/api/models/${fileId}`;
    return filename ? `${baseUrl}?filename=${encodeURIComponent(filename)}` : baseUrl;
  }

  /**
   * CRITICAL: Convert Google Drive file ID to proxy image URL
   * Uses our API route to avoid CORS and Next.js hostname issues
   */
  static getDirectImageUrl(fileId: string, filename?: string): string {
    const baseUrl = `/api/images/${fileId}`;
    return filename ? `${baseUrl}?filename=${encodeURIComponent(filename)}` : baseUrl;
  }

  /**
   * Check if URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com');
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(url: string): string | null {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Test connection to Google Drive API
   */
  static async testConnection(): Promise<{ connected: boolean; message: string }> {
    return await GoogleDriveConfig.testConnection();
  }

  /**
   * Upload a request image to Google Drive via server-side API
   */
  static async uploadRequestImage(
    file: File,
    userEmail: string,
    requestId: string,
    description: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', userEmail);
      formData.append('requestId', requestId);
      formData.append('description', description);

      // Upload via our server-side API route
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        return { success: false, error: `Upload failed: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      console.log('✅ Image uploaded successfully:', result);
      
      return { success: true, fileId: result.fileId };
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  /**
   * Scan user assets in Google Drive
   * @param userEmail - User's email address
   * @param apiKey - Optional API key (uses environment variable if not provided)
   * @returns Promise with objects and images arrays
   */
  static async scanUserAssetsInDrive(
    userEmail: string,
    apiKey?: string
  ): Promise<{ objects: any[], images: any[] }> {
    const actualApiKey = apiKey || GoogleDriveConfig.getApiKey();
    
    if (!actualApiKey) {
      console.error('❌ No API key available for Google Drive');
      return await GoogleDriveService.getMockDataForTesting(userEmail);
    }
    
    try {
      console.log(`🔍 Scanning user assets for: ${userEmail}`);
      
      // Only scan USER_3DOBJECT folder for user assets (not USER_REQUESTS)
      return await GoogleDriveService.scanRealGoogleDriveFolder(userEmail, actualApiKey, 'USER_3DOBJECT');
      
    } catch (error) {
      console.error('❌ Error scanning user assets:', error);
      console.log('📋 Falling back to mock data...');
      return await GoogleDriveService.getMockDataForTesting(userEmail);
    }
  }

  /**
   * Scan real Google Drive folder and return all files or user-specific files
   * @param userEmail - User email or 'all-users' to get all files
   * @param apiKey - Google Drive API key
   * @param foldersToScan - Array of folder types to scan: 'USER_3DOBJECT' | 'USER_REQUESTS' | 'both'
   * @returns Promise with objects and images arrays
   */
  static async scanRealGoogleDriveFolder(
    userEmail: string,
    apiKey: string,
    foldersToScan: 'USER_3DOBJECT' | 'USER_REQUESTS' | 'both' = 'both'
  ): Promise<{ objects: any[], images: any[] }> {
    let folders: { id: string; name: string }[] = [];
    
    if (foldersToScan === 'USER_3DOBJECT' || foldersToScan === 'both') {
      folders.push({ id: GoogleDriveService.FOLDERS.USER_3DOBJECT, name: 'USER_3DOBJECT' });
    }
    
    if (foldersToScan === 'USER_REQUESTS' || foldersToScan === 'both') {
      folders.push({ id: GoogleDriveService.FOLDERS.USER_REQUESTS, name: 'USER_REQUESTS' });
    }
    
    let allFiles: any[] = [];
    
    for (const folder of folders) {
      console.log(`🔍 Scanning folder: ${folder.name} (${folder.id})`);
      
      try {
        const url = `${GoogleDriveService.DRIVE_API_BASE}/files?q='${folder.id}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType,size,createdTime,webViewLink)`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error accessing folder ${folder.name}:`, response.status, errorText);
          continue;
        }
        
        const data = await response.json();
        console.log(`📁 Found ${data.files?.length || 0} files in ${folder.name}`);
        
        if (data.files && data.files.length > 0) {
          allFiles = allFiles.concat(data.files);
        }
        
      } catch (error) {
        console.error(`❌ Error scanning folder ${folder.name}:`, error);
      }
    }
    
    console.log(`📊 Total files found: ${allFiles.length}`);
    
    // Filter files by user if userEmail is not 'all-users'
    let filteredFiles = allFiles;
    if (userEmail !== 'all-users') {
      filteredFiles = GoogleDriveService.filterUserFiles(allFiles, userEmail);
    } else {
      console.log('🌐 Loading ALL files (no user filtering)');
    }
    
    if (filteredFiles.length === 0) {
      console.log('ℹ️ No files found - using mock data for testing');
      return await GoogleDriveService.getMockDataForTesting(userEmail);
    }
    
    // Extract 3D objects and images from filtered files
    const objects = GoogleDriveService.extract3DObjects(filteredFiles);
    const images = GoogleDriveService.extractImages(filteredFiles);
    
    return { objects, images };
  }

  /**
   * Filter files to find those belonging to a specific user
   * This is crucial for multi-user systems
   */
  static filterUserFiles(allFiles: any[], userEmail: string): any[] {
    const userBaseName = userEmail.split('@')[0].toLowerCase();
    // Convert all non-alphanumeric characters to underscores to match request form logic
    const userIdentifier = userBaseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log(`🔍 Looking for files with user identifier: ${userIdentifier} (from ${userEmail})`);
    
    // Only match files that have the exact user identifier in the filename
    const userFiles = allFiles.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      
      // Check for exact user identifier match (more precise)
      const hasUserIdentifier = fileName.includes(userIdentifier.toLowerCase());
      
      if (hasUserIdentifier) {
        console.log(`✅ File matches user ${userEmail}: ${file.name}`);
      }
      
      return hasUserIdentifier;
    });
    
    console.log(`📊 Found ${userFiles.length} files for user: ${userEmail}`);
    
    // Don't fall back to showing all files - only return files that actually belong to the user
    if (userFiles.length === 0) {
      console.log(`ℹ️ No files found for user: ${userEmail} - this is normal for users without uploaded models`);
    }
    
    return userFiles;
  }

  /**
   * Extract 3D objects from file list and match with images
   */
  static extract3DObjects(files: any[]): any[] {
    // First, get all 3D model files
    const modelFiles = files.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.glb') || 
             fileName.endsWith('.obj') || 
             fileName.endsWith('.fbx') || 
             fileName.endsWith('.gltf');
    });

    // Get all image files
    const imageFiles = files.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.png') || 
             fileName.endsWith('.jpg') || 
             fileName.endsWith('.jpeg') || 
             fileName.endsWith('.webp') ||
             fileName.endsWith('.gif') ||
             fileName.endsWith('.bmp') ||
             fileName.endsWith('.svg');
    });

    // Map 3D models and try to find matching images
    const objects = modelFiles.map((file: any) => {
      const baseFileName = this.getBaseFileName(file.name);
      
      // Find matching image by base filename
      const matchingImage = imageFiles.find(imageFile => {
        const imageBaseName = this.getBaseFileName(imageFile.name);
        return imageBaseName === baseFileName;
      });

      return {
        id: file.id,
        name: file.name,
        originalName: this.generateCleanName(file.name),
        downloadUrl: this.getDirectDownloadUrl(file.id, file.name),
        viewUrl: file.webViewLink,
        createdTime: file.createdTime,
        size: parseInt(file.size) || 0,
        mimeType: file.mimeType,
        imageUrl: matchingImage ? this.getDirectImageUrl(matchingImage.id, matchingImage.name) : null
      };
    });
    
    console.log('📦 3D Objects extracted with images:');
    objects.forEach((obj, index) => {
      console.log(`   ${index + 1}. ${obj.name} (ID: ${obj.id}) - Image: ${obj.imageUrl ? '✅' : '❌'}`);
    });
    
    return objects;
  }

  /**
   * Get base filename without extension (for matching models with images)
   */
  static getBaseFileName(fileName: string): string {
    return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  }

  /**
   * Extract images from file list
   */
  static extractImages(files: any[]): any[] {
    const images = files.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.png') || 
             fileName.endsWith('.jpg') || 
             fileName.endsWith('.jpeg') || 
             fileName.endsWith('.webp');
    }).map((file: any) => ({
      id: file.id,
      name: file.name,
      downloadUrl: this.getDirectImageUrl(file.id),
      viewUrl: file.webViewLink,
      createdTime: file.createdTime,
      size: parseInt(file.size) || 0,
      mimeType: file.mimeType
    }));
    
    console.log('🖼️ Images extracted:');
    images.forEach((img, index) => {
      console.log(`   ${index + 1}. ${img.name} (ID: ${img.id})`);
    });
    
    return images;
  }

  /**
   * Generate clean display name from file name
   * Removes user emails, timestamps, and other identifiers
   */
  static generateCleanName(fileName: string): string {
    let name = fileName.replace(/\.(glb|obj|fbx|gltf|png|jpg|jpeg|webp)$/i, '');
    
    // Remove email patterns more aggressively
    name = name.replace(/_[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    name = name.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    
    // Remove email username parts (before @)
    name = name.replace(/_[a-zA-Z0-9._%+-]+\.[a-zA-Z0-9._%+-]+/g, '');
    
    // Remove timestamps and IDs
    name = name.replace(/_\d{10,}/g, '');
    
    // Remove common patterns like "user.email", "firstname.lastname"
    name = name.replace(/[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+/g, '');
    name = name.replace(/\b[a-zA-Z]+\.[a-zA-Z]+\b/g, '');
    
    // Clean up multiple underscores and replace with spaces
    name = name.replace(/_+/g, ' ');
    
    // Remove leading/trailing whitespace and underscores
    name = name.trim().replace(/^[_\s]+|[_\s]+$/g, '');
    
    // Handle edge cases where name might be empty or just separators
    if (!name || name.length < 2) {
      name = 'Custom Model';
    }
    
    // Capitalize each word properly
    name = name.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return name;
  }

  /**
   * Mock data for testing - use this when API fails
   */
  static async getMockDataForTesting(userEmail: string): Promise<{ objects: any[], images: any[] }> {
    console.log('📋 Using mock data for testing');
    
    const mockObjects = [
      {
        id: 'mock_1',
        name: 'test_model_1.glb',
        originalName: 'Test Model 1',
        downloadUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Box/glTF-Binary/Box.glb',
        viewUrl: 'https://drive.google.com/file/d/mock_1/view',
        createdTime: new Date().toISOString(),
        size: 1024,
        mimeType: 'model/gltf-binary'
      }
    ];
    
    return { objects: mockObjects, images: [] };
  }

  /**
   * Debug function to test filename matching
   */
  static debugUserFiltering(allFiles: any[], userEmail: string): void {
    console.log('🔍 Debug: User filtering for:', userEmail);
    console.log('📁 All files:', allFiles.map(f => f.name));
    console.log('👤 User email:', userEmail);
    console.log('🔑 User identifier:', userEmail.replace('@', '.'));
    
    const filtered = allFiles.filter(f => 
      f.name.toLowerCase().includes(userEmail.split('@')[0].toLowerCase())
    );
    console.log('✅ Filtered files:', filtered.map(f => f.name));
  }

  /**
   * Utility method to add delay between API calls
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Chunk array for batch processing
   */
  static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 