# Google Drive Folder Setup Guide

## Current Error: "File not found: ."

This error means the Google Drive folder isn't accessible with your API key. Here's how to fix it:

## ✅ **Solution Options:**

### **Option 1: Use Your Own 3D Models Folder**

1. **Go to your Google Drive**: https://drive.google.com/
2. **Create a new folder** called "USER_3DOBJECT" 
3. **Make it public**:
   - Right-click the folder → "Share"
   - Click "Change to anyone with the link"
   - Set permission to "Viewer"
   - Copy the folder ID from the URL
4. **Update the folder ID** in your code

### **Option 2: Test with a Simple Folder**

Create a test folder with some sample files:

1. **Create folder** named "Test_3D_Models"
2. **Add some sample files**:
   - Any `.glb`, `.obj`, or `.fbx` files
   - Some `.png` or `.jpg` images
3. **Make it public** (same steps as above)
4. **Use this folder ID** for testing

### **Option 3: Skip 3D Model Loading**

If you don't have 3D models yet, disable the scanning:

```typescript
// In model-context.tsx, comment out the Google Drive scanning
// await refreshGoogleDriveModels();
```

## 🔧 **How to Get Folder ID:**

1. **Open the folder** in Google Drive
2. **Look at the URL**: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. **Copy the ID** (the long string after `/folders/`)

**Example URL:**
```
https://drive.google.com/drive/folders/1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx
```
**Folder ID:** `1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx`

## 📋 **Current Folder IDs in Your Code:**

- **USER_REQUESTS**: `1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL`
- **USER_3DOBJECT**: `1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx` ← This one is causing the error

## 🧪 **Quick Test:**

Try opening this URL in your browser:
```
https://drive.google.com/drive/folders/1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx
```

If you get "Permission denied" or "Not found", the folder doesn't exist or isn't accessible.

## 🎯 **Recommended Quick Fix:**

1. **Create a new public folder** with some test files
2. **Get its folder ID**
3. **Update `GoogleDriveConfig.ts`**:

```typescript
USER_3DOBJECT: 'YOUR_NEW_FOLDER_ID_HERE'
```

## 🔒 **Important Notes:**

- **API keys** can only access **public folders**
- **Private folders** require OAuth authentication
- **Folder must exist** and be accessible
- **Files inside** should also be public for downloading 