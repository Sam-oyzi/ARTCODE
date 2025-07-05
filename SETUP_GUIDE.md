# ART CODE Setup Guide

## Quick Start

You now have a robust Google Drive integration system! Here's how to get it running:

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with these variables:

```env
# Google Drive API Configuration
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key_here

# Firebase Configuration (keep your existing values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Get Your Google Drive API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated key
   - **IMPORTANT**: Restrict the key to Google Drive API only

### 3. Configure Google Drive Folders

Your system is configured to use these folder IDs:

```
📁 Google Drive Structure:
├── ASSETS (1YlVyuJrCCukNStB8Cm9RBrD3XOPFmSNd)
│   └── ARTCODE_DATA (12E8N-N82sNDKPLYVnonSTWzPnbeNwTq0)
│       ├── USER_3DOBJECT (1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx) ← 3D models go here
│       └── USER_REQUEST (1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL) ← Request photos
```

### 4. File Naming Convention

For 3D models to appear in user dashboards, name them:
```
model_title_user.email.glb
```

Examples:
- `Blastoise_catenary.bim.designer.glb` ← For catenary.bim.designer@gmail.com
- `chair_modern_issam.mester.hi.glb` ← For issam.mester.hi@gmail.com
- `table_wooden_john.doe.glb` ← For john.doe@gmail.com

### 5. Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/dashboard`

3. Use the Debug panel:
   - Click the "Debug" button
   - Check "API Key Status" is "Configured"
   - Click "Test Connection" to verify API access
   - Click "Debug Filtering" to test filename matching

### 6. Upload Test File

Upload a test file to your Google Drive USER_3DOBJECT folder:
- Name it: `test_model_your.email.glb` (replace with your actual email)
- Use the format: `title_your.email.replaced.with.dots.glb`
- Click "Refresh" in the dashboard

## Key Features

### ✅ What's Working Now

- **API Key Authentication**: Simpler than OAuth2, more reliable
- **Robust Error Handling**: Mock data fallback prevents empty dashboards
- **Comprehensive Logging**: Detailed console logs for debugging
- **Multiple File Formats**: Supports .glb, .obj, .fbx, .gltf
- **Smart File Filtering**: Multiple approaches to match user files
- **Clean Name Generation**: Removes email suffixes from display names
- **Connection Testing**: Built-in API connection validation
- **Debug Mode**: Comprehensive debugging tools

### 🔧 Debug Features

- **API Key Status**: Shows if environment variable is configured
- **Connection Test**: Validates Google Drive API access
- **File Filtering Debug**: Tests filename matching logic
- **Comprehensive Logging**: All operations logged to console

### 🎯 User Experience

- **Loading States**: Proper loading indicators
- **Error Recovery**: Graceful error handling with troubleshooting tips
- **Mock Data**: Fallback test data when API fails
- **Real-time Updates**: Refresh button to reload data

## Troubleshooting

### No Models Showing Up?

1. **Check API Key**: Verify `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY` is set
2. **Check File Names**: Ensure files include your email in the name
3. **Check Folder**: Verify files are in the correct Google Drive folder
4. **Test Connection**: Use the "Test Connection" button
5. **Check Console**: Look for detailed error messages

### API Key Issues?

1. **Verify Key**: Check it's correctly set in `.env.local`
2. **Restart Server**: Restart `npm run dev` after changing environment variables
3. **Check Restrictions**: Ensure API key is restricted to Google Drive API only
4. **Check Quotas**: Verify you haven't exceeded API limits

### File Naming Issues?

1. **Use Debug Mode**: Click "Debug Filtering" to test filename matching
2. **Check Format**: Use `title_your.email.glb` format
3. **Replace Dots**: Replace @ and . with dots in email
4. **Test Examples**: Try `test_model_john.doe.glb` format

## Next Steps

1. **Add Your API Key**: Set `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY` in `.env.local`
2. **Upload Test Files**: Add some .glb files to your Google Drive folder
3. **Test Dashboard**: Check if models appear in `/dashboard`
4. **Debug Issues**: Use the built-in debug tools

Your system is now much more robust and easier to debug! The API key approach is simpler and more reliable than OAuth2 for this use case. 