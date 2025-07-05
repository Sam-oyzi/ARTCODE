# Environment Setup for Google Drive

## Current Setup (API Key Only)

Your current `.env.local` file works with API key authentication:

```env
# Google Drive API Key (for reading 3D models)
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## API Key Limitations

**API Keys can:**
- ✅ Read public files (your 3D models)
- ✅ List files in public folders
- ✅ Download public files

**API Keys cannot:**
- ❌ Upload files to Google Drive
- ❌ Create new files
- ❌ Modify existing files

## Optional: OAuth Setup for Uploads

If you want to enable Google Drive uploads, add these optional variables:

```env
# Optional: OAuth Configuration for uploads
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### How to Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable Google Drive API
4. Create OAuth 2.0 Client ID for web application
5. Add your domain to authorized origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Copy the Client ID to your `.env.local` file

## Google Drive Folder IDs

The following folder IDs are already configured in the code:
- USER_REQUESTS: `1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL`
- USER_3DOBJECT: `1CKw8qPXrFQCMjIjPq-dFLhwvZzLBjhQB`

## Current Status

- ✅ 3D Model viewing works with API key
- ✅ File listing works with API key
- ⚠️ Image uploads require OAuth (optional)
- ⚠️ Without OAuth, images are stored locally 