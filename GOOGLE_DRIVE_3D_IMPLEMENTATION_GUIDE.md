# Google Drive 3D Model Implementation Guide

## Overview
This guide explains how to implement a system that reads 3D models from Google Drive and displays them in user boutiques. Many developers face issues getting this to work properly, so this guide covers all the technical details and common pitfalls.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Drive Setup](#google-drive-setup)
3. [Project Configuration](#project-configuration)
4. [Implementation Steps](#implementation-steps)
5. [File Naming Conventions](#file-naming-conventions)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Testing Guide](#testing-guide)
8. [Advanced Features](#advanced-features)

---

## Prerequisites

### Required Dependencies
```json
{
  "dependencies": {
    "firebase": "^11.9.1",
    "@google/model-viewer": "^4.1.0"
  }
}
```

### Google Cloud Console Requirements
- Google Cloud Project with Google Drive API enabled
- API Key for Google Drive API
- OAuth 2.0 Client ID (optional but recommended)
- Google Drive folder with proper permissions

---

## Google Drive Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Generate API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated key
4. **IMPORTANT**: Restrict the key to Google Drive API only for security

### Step 3: Create Google Drive Folders
Create these folders in your Google Drive:
```
📁 AR_Design_Assets/
  ├── 📁 USER_OBJECT_3D/         # Main folder for 3D models and images
  ├── 📁 USER_DEMANDE/           # User request photos
  ├── 📁 USER_PROFILE/           # Profile images
  └── 📁 AR_DESIGN_DATA/         # Admin data
```

### Step 4: Get Folder IDs
1. Open each folder in Google Drive
2. Copy the folder ID from the URL
   - Example: `https://drive.google.com/drive/folders/18Exsk24LnqbKVmUiWxY57xQY2qg81FUU`
   - Folder ID: `18Exsk24LnqbKVmUiWxY57xQY2qg81FUU`

### Step 5: Set Folder Permissions
**Option A: Public Access (Easier)**
- Right-click folder → Share → "Anyone with the link can view"

**Option B: API Access (More Secure)**
- Keep folders private
- Use API key for authentication

---

## Project Configuration

### Environment Variables (.env)
```env
# Google Drive API Configuration
VITE_GOOGLE_DRIVE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Firebase Configuration (Your Own Project)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Google Drive Configuration (googleDriveConfig.ts)
```typescript
export class GoogleDriveConfig {
  // Replace with your actual API key
  static readonly API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';
  static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Replace with your actual folder IDs
  static readonly FOLDERS = {
    USER_OBJECT_3D: 'your_user_object_3d_folder_id',
    USER_DEMANDE: 'your_user_demande_folder_id',
    USER_PROFILE: 'your_user_profile_folder_id',
    AR_DESIGN_DATA: 'your_ar_design_data_folder_id'
  };

  // API configuration
  static readonly API_CONFIG = {
    BASE_URL: 'https://www.googleapis.com/drive/v3',
    UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3'
  };

  static isConfigured(): boolean {
    return !!(this.API_KEY && this.FOLDERS.USER_OBJECT_3D);
  }

  static getApiKey(): string {
    return this.API_KEY;
  }
}
```

---

## Implementation Steps

### Step 1: Create Google Drive Service
```typescript
import { GoogleDriveConfig } from './googleDriveConfig';

export class GoogleDriveService {
  static readonly FOLDERS = GoogleDriveConfig.FOLDERS;
  static readonly DRIVE_API_BASE = GoogleDriveConfig.API_CONFIG.BASE_URL;

  /**
   * CRITICAL: Convert Google Drive file ID to direct download URL
   * This is the key to making 3D models load properly
   */
  static getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * CRITICAL: Convert Google Drive file ID to direct image URL
   * Different format needed for images
   */
  static getDirectImageUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  /**
   * Main method to scan user's 3D models from Google Drive
   * This is where most developers have issues
   */
  static async scanUserAssetsInDrive(
    userEmail: string,
    apiKey?: string
  ): Promise<{ objects: any[], images: any[] }> {
    const finalApiKey = apiKey || GoogleDriveConfig.getApiKey();
    
    console.log('🔍 Starting Google Drive scan for user:', userEmail);
    console.log('🔑 API Key configured:', !!finalApiKey);
    console.log('📁 Target folder:', this.FOLDERS.USER_OBJECT_3D);

    if (!finalApiKey) {
      console.error('❌ No API key configured!');
      return { objects: [], images: [] };
    }

    try {
      const result = await this.scanRealGoogleDriveFolder(userEmail, finalApiKey);
      console.log('✅ Successfully scanned Google Drive:', result);
      return result;
    } catch (error) {
      console.error('❌ Google Drive scan failed:', error);
      // Return mock data for testing
      return await this.getMockDataForTesting(userEmail);
    }
  }

  /**
   * The actual Google Drive API call - this is where the magic happens
   */
  static async scanRealGoogleDriveFolder(
    userEmail: string,
    apiKey: string
  ): Promise<{ objects: any[], images: any[] }> {
    try {
      // Build the Google Drive API query
      const query = `'${this.FOLDERS.USER_OBJECT_3D}' in parents and trashed=false`;
      const url = `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,createdTime,mimeType,webViewLink)&key=${apiKey}`;
      
      console.log('🌐 Making API call to:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw API response:', data);
      
      const allFiles = data.files || [];
      console.log(`📁 Found ${allFiles.length} total files in folder`);
      
      // Filter files for the specific user
      const userFiles = this.filterUserFiles(allFiles, userEmail);
      console.log(`👤 Found ${userFiles.length} files for user: ${userEmail}`);
      
      // Separate 3D objects and images
      const objects = this.extract3DObjects(userFiles);
      const images = this.extractImages(userFiles);
      
      console.log(`📦 3D Objects found: ${objects.length}`);
      console.log(`🖼️ Images found: ${images.length}`);
      
      if (objects.length === 0) {
        console.warn('⚠️ No 3D objects found! Check file naming and folder structure.');
      }
      
      return { objects, images };
      
    } catch (error) {
      console.error('❌ Error in scanRealGoogleDriveFolder:', error);
      throw error;
    }
  }

  /**
   * Filter files to find those belonging to a specific user
   * This is crucial for multi-user systems
   */
  static filterUserFiles(allFiles: any[], userEmail: string): any[] {
    const userIdentifier = userEmail.replace('@', '.').replace(/\./g, '.');
    const userBaseName = userEmail.split('@')[0].toLowerCase();
    
    console.log(`🔍 Looking for files with identifiers: ${userIdentifier}, ${userBaseName}`);
    
    // Try multiple filtering approaches
    let userFiles = allFiles.filter((file: any) => 
      file.name.toLowerCase().includes(userIdentifier.toLowerCase()) ||
      file.name.toLowerCase().includes(userBaseName)
    );
    
    if (userFiles.length === 0) {
      console.log('🔄 No exact matches, trying broader search...');
      const emailParts = userEmail.split('@')[0].split('.');
      userFiles = allFiles.filter((file: any) => {
        const fileName = file.name.toLowerCase();
        return emailParts.some(part => fileName.includes(part.toLowerCase()));
      });
    }
    
    if (userFiles.length === 0) {
      console.log('⚠️ No user-specific files found, showing all files for debugging');
      userFiles = allFiles;
    }
    
    return userFiles;
  }

  /**
   * Extract 3D objects from file list
   */
  static extract3DObjects(files: any[]): any[] {
    const objects = files.filter((file: any) => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.glb') || 
             fileName.endsWith('.obj') || 
             fileName.endsWith('.fbx') || 
             fileName.endsWith('.gltf');
    }).map((file: any) => ({
      id: file.id,
      name: file.name,
      originalName: this.generateCleanName(file.name),
      downloadUrl: this.getDirectDownloadUrl(file.id),
      viewUrl: file.webViewLink,
      createdTime: file.createdTime,
      size: parseInt(file.size) || 0,
      mimeType: file.mimeType
    }));
    
    console.log('📦 3D Objects extracted:');
    objects.forEach((obj, index) => {
      console.log(`   ${index + 1}. ${obj.name} (ID: ${obj.id})`);
    });
    
    return objects;
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
   */
  static generateCleanName(fileName: string): string {
    let name = fileName.replace(/\.(glb|obj|fbx|gltf|png|jpg|jpeg|webp)$/i, '');
    name = name.replace(/_[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '');
    name = name.replace(/_\d{13,}/, '');
    name = name.replace(/_/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
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
}
```

### Step 2: Create Boutique Service
```typescript
import { GoogleDriveService } from './googleDriveService';

export class BoutiqueService {
  /**
   * Load user's boutique items from Google Drive
   */
  static async loadUserBoutiqueItems(userEmail: string): Promise<any[]> {
    console.log('🏪 Loading boutique items for user:', userEmail);
    
    try {
      // Get 3D models and images from Google Drive
      const { objects, images } = await GoogleDriveService.scanUserAssetsInDrive(userEmail);
      
      if (objects.length === 0) {
        console.warn('⚠️ No 3D objects found for boutique!');
        return [];
      }
      
      // Match objects with images
      const boutiqueItems = objects.map((obj, index) => {
        const matchedImage = images.find(img => 
          img.name.toLowerCase().includes(obj.name.toLowerCase().replace('.glb', ''))
        );
        
        return {
          id: obj.id,
          name: obj.originalName,
          glb_url: obj.downloadUrl,
          image: matchedImage?.downloadUrl || '/placeholder.png',
          price: this.generatePrice(index),
          description: `3D model: ${obj.originalName}`,
          category: 'furniture',
          status: 'active'
        };
      });
      
      console.log(`🏪 Created ${boutiqueItems.length} boutique items`);
      return boutiqueItems;
      
    } catch (error) {
      console.error('❌ Error loading boutique items:', error);
      return [];
    }
  }

  static generatePrice(index: number): number {
    const prices = [29.99, 39.99, 49.99, 59.99, 44.99];
    return prices[index % prices.length];
  }
}
```

### Step 3: Create 3D Model Viewer Component
```typescript
import React, { useEffect, useState } from 'react';
import { GoogleDriveService } from '../lib/googleDriveService';

interface Model3DViewerProps {
  modelUrl: string;
  alt?: string;
  style?: React.CSSProperties;
}

const Model3DViewer: React.FC<Model3DViewerProps> = ({ modelUrl, alt, style }) => {
  const [directUrl, setDirectUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const prepareModelUrl = async () => {
      try {
        console.log('🔄 Preparing model URL:', modelUrl);
        
        let finalUrl = modelUrl;
        
        // Check if it's a Google Drive URL and convert to direct download
        if (GoogleDriveService.isGoogleDriveUrl(modelUrl)) {
          const fileId = GoogleDriveService.extractFileId(modelUrl);
          if (fileId) {
            finalUrl = GoogleDriveService.getDirectDownloadUrl(fileId);
            console.log('✅ Converted to direct URL:', finalUrl);
          }
        }
        
        setDirectUrl(finalUrl);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Error preparing model URL:', err);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    };

    if (modelUrl) {
      prepareModelUrl();
    }
  }, [modelUrl]);

  if (loading) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading 3D model...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <model-viewer
      src={directUrl}
      alt={alt}
      camera-controls
      auto-rotate
      ar
      style={{ width: '100%', height: '400px', ...style }}
      onLoad={() => console.log('✅ 3D model loaded successfully')}
      onError={(e) => {
        console.error('❌ 3D model failed to load:', e);
        setError('Failed to load 3D model');
      }}
    />
  );
};

export default Model3DViewer;
```

### Step 4: Create Boutique Component
```typescript
import React, { useEffect, useState } from 'react';
import { BoutiqueService } from '../lib/boutiqueService';
import Model3DViewer from './Model3DViewer';

interface BoutiqueItem {
  id: string;
  name: string;
  glb_url: string;
  image: string;
  price: number;
  description: string;
}

const UserBoutique: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [items, setItems] = useState<BoutiqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadBoutiqueItems = async () => {
      try {
        console.log('🏪 Loading boutique for user:', userEmail);
        setLoading(true);
        
        const boutiqueItems = await BoutiqueService.loadUserBoutiqueItems(userEmail);
        
        if (boutiqueItems.length === 0) {
          setError('No 3D models found. Please upload .glb files to your Google Drive folder.');
        } else {
          setItems(boutiqueItems);
          console.log(`✅ Loaded ${boutiqueItems.length} boutique items`);
        }
        
      } catch (err) {
        console.error('❌ Error loading boutique:', err);
        setError('Failed to load boutique items');
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      loadBoutiqueItems();
    }
  }, [userEmail]);

  if (loading) {
    return <div>Loading boutique...</div>;
  }

  if (error) {
    return (
      <div>
        <h3>Error loading boutique</h3>
        <p>{error}</p>
        <h4>Troubleshooting:</h4>
        <ul>
          <li>Check if your Google Drive API key is configured</li>
          <li>Ensure your Google Drive folder contains .glb files</li>
          <li>Verify file naming convention includes your email</li>
          <li>Check browser console for detailed error messages</li>
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h2>My Boutique</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h3>{item.name}</h3>
            <Model3DViewer 
              modelUrl={item.glb_url}
              alt={item.name}
              style={{ height: '300px', marginBottom: '10px' }}
            />
            <img 
              src={item.image} 
              alt={item.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '10px' }}
            />
            <p>{item.description}</p>
            <p><strong>Price: ${item.price}</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserBoutique;
```

---

## File Naming Conventions

### Critical: Proper File Naming
For the system to work, files must be named properly:

**3D Models:**
```
furniture_name_user.email.glb
table_modern_john.doe.glb
chair_leather_jane.smith.glb
```

**Images:**
```
furniture_name_user.email.png
table_modern_john.doe.png
chair_leather_jane.smith.png
```

### File Structure in Google Drive
```
📁 USER_OBJECT_3D/
  ├── 📄 chair_modern_john.doe.glb
  ├── 🖼️ chair_modern_john.doe.png
  ├── 📄 table_wooden_jane.smith.glb
  ├── 🖼️ table_wooden_jane.smith.png
  └── 📄 sofa_leather_bob.wilson.glb
```

---

## Common Issues & Solutions

### Issue 1: No 3D Objects Found
**Symptoms:** Empty boutique, console shows "No 3D objects found"

**Solutions:**
1. **Check API Key:**
   ```typescript
   // Test your API key
   const testResult = await GoogleDriveService.testConnection();
   console.log('API Key Status:', testResult);
   ```

2. **Verify Folder ID:**
   ```typescript
   console.log('Folder ID:', GoogleDriveConfig.FOLDERS.USER_OBJECT_3D);
   // Make sure this matches your actual Google Drive folder ID
   ```

3. **Check File Naming:**
   - Files must include user email: `chair_modern_john.doe.glb`
   - Use supported formats: `.glb`, `.obj`, `.fbx`, `.gltf`

### Issue 2: 3D Models Not Loading
**Symptoms:** Model viewer shows error or blank

**Solutions:**
1. **Check Direct Download URL:**
   ```typescript
   // Test the URL format
   const fileId = 'your_file_id_here';
   const url = GoogleDriveService.getDirectDownloadUrl(fileId);
   console.log('Direct URL:', url);
   // Should be: https://drive.google.com/uc?export=download&id=your_file_id
   ```

2. **Verify File Permissions:**
   - Make sure Google Drive folder is accessible
   - Test with public folder first

3. **Check CORS Issues:**
   - Some browsers block Google Drive downloads
   - Try different browsers for testing

### Issue 3: API Key Errors
**Symptoms:** "API key not valid" or 403 errors

**Solutions:**
1. **Verify API Key:**
   - Check it's correctly set in environment variables
   - Ensure no extra spaces or characters

2. **Check API Restrictions:**
   - Go to Google Cloud Console → Credentials
   - Edit your API key
   - Ensure it's restricted to Google Drive API only

3. **Verify API Quota:**
   - Check Google Cloud Console → APIs & Services → Quotas
   - Ensure you haven't exceeded daily limits

### Issue 4: User Filter Not Working
**Symptoms:** Wrong user's files showing, or no files found

**Solutions:**
1. **Debug File Filtering:**
   ```typescript
   // Add this to your service for debugging
   static debugUserFiltering(allFiles: any[], userEmail: string) {
     console.log('All files:', allFiles.map(f => f.name));
     console.log('User email:', userEmail);
     console.log('User identifier:', userEmail.replace('@', '.'));
     
     const filtered = allFiles.filter(f => 
       f.name.toLowerCase().includes(userEmail.split('@')[0].toLowerCase())
     );
     console.log('Filtered files:', filtered.map(f => f.name));
   }
   ```

2. **Check File Naming:**
   - Ensure files are named with correct user email
   - Use lowercase for consistency

---

## Testing Guide

### Step 1: Test API Connection
```typescript
// Add this to your component for testing
const testConnection = async () => {
  const result = await GoogleDriveService.testConnection();
  console.log('Connection test:', result);
  
  if (!result.connected) {
    console.error('API connection failed:', result.message);
  }
};
```

### Step 2: Test File Scanning
```typescript
// Add this to test file scanning
const testFileScan = async () => {
  const result = await GoogleDriveService.scanUserAssetsInDrive('test@example.com');
  console.log('File scan result:', result);
  
  if (result.objects.length === 0) {
    console.warn('No 3D objects found - check file naming and folder structure');
  }
};
```

### Step 3: Test 3D Model Loading
```typescript
// Add this to test model loading
const testModelUrl = async () => {
  const fileId = 'your_test_file_id';
  const url = GoogleDriveService.getDirectDownloadUrl(fileId);
  console.log('Testing model URL:', url);
  
  // Try to fetch the URL
  try {
    const response = await fetch(url);
    console.log('Model fetch status:', response.status);
  } catch (error) {
    console.error('Model fetch error:', error);
  }
};
```

### Step 4: Debug Checklist
Run through this checklist when things don't work:

1. ✅ **API Key configured** - Check environment variables
2. ✅ **Folder ID correct** - Verify Google Drive folder ID
3. ✅ **Files uploaded** - Check files exist in Google Drive
4. ✅ **File naming correct** - Files include user email
5. ✅ **Permissions set** - Folder is accessible
6. ✅ **Console logs** - Check browser console for errors
7. ✅ **Network requests** - Check Network tab in DevTools

---

## Advanced Features

### Auto-Sync with Google Drive
```typescript
// Periodically sync with Google Drive
class GoogleDriveSync {
  static async syncUserBoutique(userEmail: string) {
    setInterval(async () => {
      const items = await BoutiqueService.loadUserBoutiqueItems(userEmail);
      // Update your state/database
    }, 300000); // Sync every 5 minutes
  }
}
```

### Batch File Operations
```typescript
// Process multiple files efficiently
static async processBatchFiles(userEmail: string) {
  const { objects } = await GoogleDriveService.scanUserAssetsInDrive(userEmail);
  
  // Process files in batches to avoid API limits
  const batches = this.chunkArray(objects, 10);
  
  for (const batch of batches) {
    await Promise.all(batch.map(obj => this.processFile(obj)));
    await this.delay(1000); // Wait 1 second between batches
  }
}
```

### Error Recovery
```typescript
// Implement retry logic for failed API calls
static async apiCallWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

## Final Notes

### Production Considerations
1. **Rate Limiting:** Implement proper rate limiting for Google Drive API
2. **Caching:** Cache API responses to reduce API calls
3. **Error Handling:** Implement comprehensive error handling
4. **Security:** Never expose API keys in client-side code in production
5. **Monitoring:** Monitor API usage and errors

### Performance Tips
1. **Lazy Loading:** Load 3D models only when needed
2. **Image Optimization:** Compress images before uploading
3. **CDN:** Consider using a CDN for faster model loading
4. **Pagination:** Implement pagination for large numbers of models

### Support Resources
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/reference)
- [Model Viewer Documentation](https://modelviewer.dev/)
- [Chrome DevTools for debugging](https://developer.chrome.com/docs/devtools/)

This guide should help you successfully implement the 3D model system. If you encounter issues, work through the troubleshooting section step by step, and check the browser console for detailed error messages. 