export class GoogleDriveConfig {
  // API Key configuration (using your existing environment variable)
  static readonly API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '';
  
  // OAuth Configuration (optional - only if you want to add OAuth later)
  static readonly CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Folder IDs for different types of uploads
  static readonly FOLDERS = {
    USER_REQUESTS: '1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL', // USER_REQUEST folder
    USER_3DOBJECT: '1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx', // USER_3DOBJECT folder (corrected ID)
    USER_IMAGES: '1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL' // Default to USER_REQUEST
  };

  // OAuth Scopes (for future OAuth implementation)
  static readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';

  // API Configuration
  static readonly API_CONFIG = {
    UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3/files',
    BASE_URL: 'https://www.googleapis.com/drive/v3'
  };

  static isConfigured(): boolean {
    return !!(this.API_KEY && this.FOLDERS.USER_REQUESTS);
  }

  static getClientId(): string {
    return this.CLIENT_ID;
  }

  static getApiKey(): string {
    return this.API_KEY;
  }

  static isAdmin(email: string): boolean {
    const adminEmails = ['hou.issam.zi@gmail.com', 'we.ardesign3d@gmail.com'];
    return adminEmails.includes(email.toLowerCase());
  }
} 