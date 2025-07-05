# Google Drive API Configuration - 3D Model Reading

## 1. Environment Variables (.env)

```env
# Google Drive API Configuration (from AR_Design project)
VITE_GOOGLE_DRIVE_API_KEY=AIzaSyBkn4wsHspAJVBDeURy7PF-eVvTOdkHad8
VITE_GOOGLE_CLIENT_ID=636014223904-0vla9fv1m610g9igqk2b85irvblsrljs.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here

# Firebase Configuration - USE YOUR OWN PROJECT
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 2. Google Drive Configuration (googleDriveConfig.ts)

```typescript
export class GoogleDriveConfig {
  // API Keys from AR_Design project
  static readonly API_KEY = 'AIzaSyBkn4wsHspAJVBDeURy7PF-eVvTOdkHad8';
  static readonly CLIENT_ID = '636014223904-0vla9fv1m610g9igqk2b85irvblsrljs.apps.googleusercontent.com';
  static readonly CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';

  // Exact folder IDs from AR_Design project
  static readonly FOLDERS = {
    ASSETS: '1YlVyuJrCCukNStB8Cm9RBrD3XOPFmSNd', // Folder contain ARTCODE_DATA/...
    ARTCODE_DATA:'12E8N-N82sNDKPLYVnonSTWzPnbeNwTq0', // Folder contain USER_3DOBJECT and USER_REQUEST

    USER_3DOBJECT: '1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx', // User request photos
    USER_REQUEST: '1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL', // User 3D Object
  };

  // API configuration
  static readonly API_CONFIG = {
    BASE_URL: 'https://www.googleapis.com/drive/v3',
    UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3',
    SCOPES: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ]
  };

  static isConfigured(): boolean {
    return !!(this.API_KEY && this.CLIENT_ID);
  }

  static getApiKey(): string {
    return this.API_KEY;
  }

  static getClientId(): string {
    return this.CLIENT_ID;
  }
}
```

## 3. Google Drive Service for Reading 3D Models (googleDriveService.ts)

```typescript
import { GoogleDriveConfig } from './googleDriveConfig';

export class GoogleDriveService {
  // Use configuration from GoogleDriveConfig
  static readonly FOLDERS = GoogleDriveConfig.FOLDERS;
  static readonly DRIVE_API_BASE = GoogleDriveConfig.API_CONFIG.BASE_URL;
  static readonly DRIVE_UPLOAD_BASE = GoogleDriveConfig.API_CONFIG.UPLOAD_URL;

  /**
   * Get Google Drive direct download link from file ID
   * Uses the format that works well with 3D model viewers
   */
  static getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get Google Drive direct view link from file ID
   */
  static getDirectViewUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Get direct image URL for Google Drive images
   */
  static getDirectImageUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(driveUrl: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)\/*/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Check if URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }

  /**
   * Generate clean item name from file name
   */
  static generateItemNameFromFile(fileName: string): string {
    // Remove file extension
    let name = fileName.replace(/\.(glb|obj|fbx|gltf)$/i, '');
    
    // Remove user identifier patterns
    name = name.replace(/_[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '');
    name = name.replace(/_\d{13,}/, ''); // Remove timestamps
    name = name.replace(/_\d+$/, ''); // Remove trailing numbers
    
    // Clean up underscores and capitalize
    name = name.replace(/_/g, ' ');
    name = name.replace(/([A-Z])/g, ' $1').trim();
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    return name;
  }

  /**
   * Main method to scan user assets in Google Drive
   * Reads 3D models and images from USER_OBJECT_3D folder
   */
  static async scanUserAssetsInDrive(
    userEmail: string,
    apiKey?: string
  ): Promise<{ objects: any[], images: any[] }> {
    const finalApiKey = apiKey || GoogleDriveConfig.getApiKey();
    
    try {
      console.log(`🔍 Scanning Google Drive for user: ${userEmail}`);
      
      // Try to use real Google Drive API if available
      if (finalApiKey) {
        console.log('🔑 Using Google Drive API');
        try {
          const result = await this.scanRealGoogleDriveFolder(userEmail, finalApiKey);
          console.log('✅ Successfully got real Google Drive data:', result);
          return result;
        } catch (apiError) {
          console.error('❌ Google Drive API failed:', apiError);
          // Fall back to mock data
        }
      }

      // Fallback to mock data
      console.log('📋 Using mock data fallback');
      return await this.getEnhancedMockData(userEmail);

    } catch (error) {
      console.error('❌ Error scanning user assets:', error);
      return await this.getEnhancedMockData(userEmail);
    }
  }

  /**
   * Scan Google Drive folder using real API with API key
   * Scans USER_OBJECT_3D folder for BOTH 3D objects and images
   */
  static async scanRealGoogleDriveFolder(
    userEmail: string,
    apiKey: string
  ): Promise<{ objects: any[], images: any[] }> {
    try {
      const userIdentifier = userEmail.replace('@', '.').replace('.', '.');
      
      // Query to get all files in the USER_OBJECT_3D folder
      const query = `'${this.FOLDERS.USER_3DOBJECT}' in parents and trashed=false`;
      const url = `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,createdTime,mimeType,webViewLink,webContentLink)&key=${apiKey}`;
      
      console.log(`📁 Scanning folder: ${this.FOLDERS.USER_3DOBJECT}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      const allFiles = data.files || [];
      
      console.log(`📊 Found ${allFiles.length} total files`);
      
      // Filter files for specific user
      const userBaseName = userEmail.split('@')[0].toLowerCase();
      let userFiles = allFiles.filter((file: any) => 
        file.name.toLowerCase().includes(userIdentifier.toLowerCase()) ||
        file.name.toLowerCase().includes(userBaseName)
      );
      
      // If no user-specific files, try broader matching
      if (userFiles.length === 0) {
        const emailParts = userEmail.split('@')[0].split('.');
        userFiles = allFiles.filter((file: any) => {
          const fileName = file.name.toLowerCase();
          return emailParts.some(part => fileName.includes(part.toLowerCase()));
        });
      }
      
      // If still no files, show all files for debugging
      if (userFiles.length === 0) {
        console.log('⚠️ No user-specific files found, showing all files');
        userFiles = allFiles;
      }
      
      console.log(`👤 Found ${userFiles.length} files for user: ${userEmail}`);
      
      // Extract 3D objects
      const objects = userFiles.filter((file: any) => 
        file.name.toLowerCase().endsWith('.glb') ||
        file.name.toLowerCase().endsWith('.obj') ||
        file.name.toLowerCase().endsWith('.fbx') ||
        file.name.toLowerCase().endsWith('.gltf')
      ).map((file: any) => ({
        id: file.id,
        name: file.name,
        originalName: this.generateItemNameFromFile(file.name),
        downloadUrl: this.getDirectDownloadUrl(file.id),
        viewUrl: file.webViewLink || this.getDirectViewUrl(file.id),
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
        size: parseInt(file.size) || 0,
        mimeType: file.mimeType
      }));
      
      // Extract images
      const images = userFiles.filter((file: any) => 
        file.name.toLowerCase().endsWith('.png') ||
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.jpeg') ||
        file.name.toLowerCase().endsWith('.webp') ||
        file.name.toLowerCase().endsWith('.gif') ||
        file.name.toLowerCase().endsWith('.bmp')
      ).map((file: any) => ({
        id: file.id,
        name: file.name,
        downloadUrl: this.getDirectImageUrl(file.id),
        viewUrl: file.webViewLink || this.getDirectViewUrl(file.id),
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
        size: parseInt(file.size) || 0,
        mimeType: file.mimeType
      }));
      
      console.log(`📦 3D Objects: ${objects.length}`);
      console.log(`🖼️ Images: ${images.length}`);
      
      return { objects, images };
      
    } catch (error) {
      console.error('❌ Error with Google Drive API:', error);
      throw error;
    }
  }

  /**
   * Auto-detect boutique items for display
   * Formats 3D models for use in a boutique/marketplace
   */
  static async autoDetectBoutiqueItems(
    userEmail: string,
    apiKey?: string
  ): Promise<Array<{
    name: string;
    glbUrl: string;
    imageUrl?: string;
    fileId: string;
    price?: number;
    description?: string;
    webContentLink?: string;
    source?: string;
    originalGoogleDriveUrl?: string;
    viewerUrl?: string;
    directDownloadUrl?: string;
  }>> {
    try {
      const { objects, images } = await this.scanUserAssetsInDrive(userEmail, apiKey);
      
      // Match objects with images
      const matchedObjects = this.matchObjectsWithImages(objects, images);
      
      // Format for boutique display
      return matchedObjects.map((obj, index) => ({
        name: obj.originalName || obj.name,
        glbUrl: obj.downloadUrl,
        imageUrl: obj.matchedImage?.downloadUrl,
        fileId: obj.id,
        price: this.generateAutoPrice(index),
        description: `3D model: ${obj.originalName || obj.name}`,
        webContentLink: obj.webContentLink,
        source: 'Google Drive',
        originalGoogleDriveUrl: obj.viewUrl,
        viewerUrl: obj.viewUrl,
        directDownloadUrl: obj.downloadUrl
      }));
      
    } catch (error) {
      console.error('❌ Error auto-detecting boutique items:', error);
      return [];
    }
  }

  /**
   * Match 3D objects with their corresponding images
   */
  static matchObjectsWithImages(objects: any[], images: any[]) {
    return objects.map(obj => {
      const objBaseName = obj.name.replace(/\.(glb|obj|fbx|gltf)$/i, '').toLowerCase();
      
      // Find matching image
      const matchedImage = images.find(img => {
        const imgBaseName = img.name.replace(/\.(png|jpg|jpeg|webp|gif|bmp)$/i, '').toLowerCase();
        return imgBaseName === objBaseName || 
               imgBaseName.includes(objBaseName) || 
               objBaseName.includes(imgBaseName);
      });
      
      return {
        ...obj,
        matchedImage,
        hasImage: !!matchedImage
      };
    });
  }

  /**
   * Generate auto price for boutique items
   */
  static generateAutoPrice(index: number): number {
    const basePrices = [29.99, 49.99, 39.99, 59.99, 44.99, 34.99, 54.99, 42.99];
    return basePrices[index % basePrices.length];
  }

  /**
   * Enhanced mock data for testing
   */
  static async getEnhancedMockData(userEmail: string): Promise<{ objects: any[], images: any[] }> {
    const userIdentifier = userEmail.replace('@', '.').replace('.', '.');
    
    console.log(`📋 Generating mock data for user: ${userEmail}`);

    const mockObjects = [
      {
        id: '1ABC123_meuble1_exemple_real_id',
        name: `meuble1_exemple_${userIdentifier}.glb`,
        originalName: 'Meuble Exemple 1',
        downloadUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Box/glTF-Binary/Box.glb',
        viewUrl: this.getDirectViewUrl('1ABC123_meuble1_exemple_real_id'),
        webContentLink: `https://drive.google.com/uc?id=1ABC123_meuble1_exemple_real_id&export=download`,
        createdTime: new Date().toISOString(),
        size: 2048576,
        mimeType: 'model/gltf-binary'
      },
      {
        id: '1DEF456_chaire1_exemple_real_id',
        name: `chaire1_exemple_${userIdentifier}.glb`,
        originalName: 'Chaise Exemple 1',
        downloadUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb',
        viewUrl: this.getDirectViewUrl('1DEF456_chaire1_exemple_real_id'),
        webContentLink: `https://drive.google.com/uc?id=1DEF456_chaire1_exemple_real_id&export=download`,
        createdTime: new Date().toISOString(),
        size: 1536789,
        mimeType: 'model/gltf-binary'
      },
      {
        id: '1GHI789_cat_condo_real_id',
        name: `Cat_Condo_${userIdentifier}.glb`,
        originalName: 'Cat Condo',
        downloadUrl: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Suzanne/glTF-Binary/Suzanne.glb',
        viewUrl: this.getDirectViewUrl('1GHI789_cat_condo_real_id'),
        webContentLink: `https://drive.google.com/uc?id=1GHI789_cat_condo_real_id&export=download`,
        createdTime: new Date().toISOString(),
        size: 3072456,
        mimeType: 'model/gltf-binary'
      }
    ];

    const mockImages = [
      {
        id: '1ABC123_meuble1_img_real_id',
        name: `meuble1_exemple_${userIdentifier}.png`,
        downloadUrl: this.getDirectImageUrl('1ABC123_meuble1_img_real_id'),
        viewUrl: this.getDirectViewUrl('1ABC123_meuble1_img_real_id'),
        webContentLink: `https://drive.google.com/uc?id=1ABC123_meuble1_img_real_id`,
        createdTime: new Date().toISOString(),
        size: 524288,
        mimeType: 'image/png'
      },
      {
        id: '1DEF456_chaire1_img_real_id',
        name: `chaire1_exemple_${userIdentifier}.png`,
        downloadUrl: this.getDirectImageUrl('1DEF456_chaire1_img_real_id'),
        viewUrl: this.getDirectViewUrl('1DEF456_chaire1_img_real_id'),
        webContentLink: `https://drive.google.com/uc?id=1DEF456_chaire1_img_real_id`,
        createdTime: new Date().toISOString(),
        size: 631459,
        mimeType: 'image/png'
      }
    ];

    return { objects: mockObjects, images: mockImages };
  }

  /**
   * Check if user has assets in Google Drive
   */
  static async checkUserHasAssets(userEmail: string, apiKey?: string): Promise<boolean> {
    try {
      const result = await this.scanUserAssetsInDrive(userEmail, apiKey);
      return result.objects.length > 0 || result.images.length > 0;
    } catch (error) {
      console.error('❌ Error checking user assets:', error);
      return false;
    }
  }

  /**
   * Get count of user assets
   */
  static async getUserAssetCount(userEmail: string, apiKey?: string): Promise<number> {
    try {
      const result = await this.scanUserAssetsInDrive(userEmail, apiKey);
      return result.objects.length + result.images.length;
    } catch (error) {
      console.error('❌ Error getting user asset count:', error);
      return 0;
    }
  }

  /**
   * Test Google Drive API connection
   */
  static async testConnection(apiKey?: string): Promise<{ connected: boolean; message: string }> {
    try {
      const finalApiKey = apiKey || GoogleDriveConfig.getApiKey();
      
      if (!finalApiKey) {
        return {
          connected: false,
          message: 'No API key provided'
        };
      }

      // Test API connection by trying to access the drive
      const url = `${this.DRIVE_API_BASE}/about?fields=user&key=${finalApiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          connected: false,
          message: `API test failed: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      
      return {
        connected: true,
        message: `Connected successfully as ${data.user?.displayName || 'Google Drive User'}`
      };
      
    } catch (error) {
      return {
        connected: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
}
```

## 4. Firebase Configuration (firebase.ts) - Use Your Own Project

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// YOUR Firebase configuration - replace with your project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

## 5. Usage Examples

### Basic 3D Model Reading

```typescript
import { GoogleDriveService } from './googleDriveService';

// Get user's 3D models and images
const assets = await GoogleDriveService.scanUserAssetsInDrive('user@example.com');
console.log('3D Objects:', assets.objects);
console.log('Images:', assets.images);

// Get boutique-ready items
const boutiqueItems = await GoogleDriveService.autoDetectBoutiqueItems('user@example.com');
console.log('Boutique Items:', boutiqueItems);
```

### 3D Model Viewer Component

```typescript
import { GoogleDriveService } from './googleDriveService';

const Model3DViewer = ({ modelUrl }: { modelUrl: string }) => {
  // Convert Google Drive URL to direct download if needed
  const directUrl = GoogleDriveService.isGoogleDriveUrl(modelUrl) 
    ? GoogleDriveService.getDirectDownloadUrl(GoogleDriveService.extractFileId(modelUrl))
    : modelUrl;

  return (
    <model-viewer
      src={directUrl}
      camera-controls
      auto-rotate
      ar
      style={{ width: '100%', height: '400px' }}
    />
  );
};
```

### Testing Connection

```typescript
import { GoogleDriveService } from './googleDriveService';

// Test connection
const testResult = await GoogleDriveService.testConnection();
console.log('Connection status:', testResult.connected);
console.log('Message:', testResult.message);
```

## 6. Package Dependencies (package.json)

```json
{
  "dependencies": {
    "firebase": "^11.9.1",
    "@google/model-viewer": "^4.1.0"
  }
}
```

## 7. Required HTML (index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Google APIs -->
  <script src="https://apis.google.com/js/api.js" async defer></script>
  <!-- Model Viewer for 3D models -->
  <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

## 8. TypeScript Declarations (types/model-viewer.d.ts)

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': any;
  }
}

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
      };
    };
  }
}

export {};
```

## Google Drive Folder Structure

Using exact folder IDs from AR_Design project:

- **USER_OBJECT_3D** (`18Exsk24LnqbKVmUiWxY57xQY2qg81FUU`): 3D models (.glb, .obj, .fbx) and images (.png, .jpg)
- **USER_DEMANDE** (`1hDh73UoCcC0JqCLrdmk3CudC8y6gXmyN`): User request photos
- **USER_PROFILE** (`1iaWdRV2wfTK2G6yW-VroWhIiDT0GbKLx`): Profile images
- **AR_DESIGN_DATA** (`1NRvAMIjmDcsZvGhdT1J17leIEm7Vh7mH`): Admin data
- **ASSETS** (`1YlVyuJrCCukNStB8Cm9RBrD3XOPFmSNd`): General assets

## Key Features

✅ **Read 3D Models**: Automatically scans Google Drive for .glb, .obj, .fbx files
✅ **Image Matching**: Matches 3D models with corresponding images
✅ **Direct Download URLs**: Converts Google Drive file IDs to direct download links
✅ **Boutique Integration**: Formats items for marketplace display
✅ **Fallback System**: Uses mock data if API fails
✅ **User Filtering**: Filters files by user email
✅ **Connection Testing**: Test Google Drive API connectivity
✅ **No Firebase Dependencies**: Uses your own Firebase project

This configuration gives you the exact same 3D model reading capabilities as the AR_Design project using the same Google Drive folders. 