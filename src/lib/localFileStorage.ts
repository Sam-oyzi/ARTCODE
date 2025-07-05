import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

const STORAGE_DIR = path.join(process.cwd(), '.local-storage');
const METADATA_FILE = path.join(STORAGE_DIR, 'metadata.json');

interface FileMetadata {
  mimeType: string;
  fileName: string;
  userEmail: string;
  requestId: string;
  description: string;
  uploadedAt: string;
}

interface StorageMetadata {
  [fileId: string]: FileMetadata;
}

export class LocalFileStorage {
  static ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  static saveFile(fileId: string, data: string, metadata: FileMetadata): void {
    try {
      this.ensureStorageDir();
      
      // Save file data
      const filePath = path.join(STORAGE_DIR, `${fileId}.data`);
      fs.writeFileSync(filePath, data, 'base64');
      
      // Update metadata
      let allMetadata: StorageMetadata = {};
      if (fs.existsSync(METADATA_FILE)) {
        const existingData = fs.readFileSync(METADATA_FILE, 'utf8');
        allMetadata = JSON.parse(existingData);
      }
      
      allMetadata[fileId] = {
        ...metadata,
        uploadedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(METADATA_FILE, JSON.stringify(allMetadata, null, 2));
      
      console.log(`✅ File saved locally: ${fileId}`);
    } catch (error) {
      console.error(`❌ Error saving file ${fileId}:`, error);
      throw error;
    }
  }

  static getFile(fileId: string): { data: Buffer; metadata: FileMetadata } | null {
    try {
      this.ensureStorageDir();
      
      const filePath = path.join(STORAGE_DIR, `${fileId}.data`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${fileId}`);
        return null;
      }
      
      // Get metadata
      if (!fs.existsSync(METADATA_FILE)) {
        console.log(`Metadata file not found`);
        return null;
      }
      
      const allMetadata: StorageMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
      const metadata = allMetadata[fileId];
      
      if (!metadata) {
        console.log(`Metadata not found for file: ${fileId}`);
        return null;
      }
      
      // Get file data
      const data = fs.readFileSync(filePath);
      
      console.log(`✅ File retrieved: ${fileId}`);
      return { data, metadata };
      
    } catch (error) {
      console.error(`❌ Error retrieving file ${fileId}:`, error);
      return null;
    }
  }

  static listFiles(): { fileId: string; metadata: FileMetadata }[] {
    try {
      this.ensureStorageDir();
      
      if (!fs.existsSync(METADATA_FILE)) {
        return [];
      }
      
      const allMetadata: StorageMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
      
      return Object.entries(allMetadata).map(([fileId, metadata]) => ({
        fileId,
        metadata
      }));
      
    } catch (error) {
      console.error('❌ Error listing files:', error);
      return [];
    }
  }

  static deleteFile(fileId: string): boolean {
    try {
      this.ensureStorageDir();
      
      const filePath = path.join(STORAGE_DIR, `${fileId}.data`);
      
      // Delete file data
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Update metadata
      if (fs.existsSync(METADATA_FILE)) {
        const allMetadata: StorageMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
        delete allMetadata[fileId];
        fs.writeFileSync(METADATA_FILE, JSON.stringify(allMetadata, null, 2));
      }
      
      console.log(`✅ File deleted: ${fileId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error deleting file ${fileId}:`, error);
      return false;
    }
  }
} 