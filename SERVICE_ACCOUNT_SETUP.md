# Google Drive Service Account Setup Guide

## Why Service Account?

**Service accounts solve the authentication problem:**
- ✅ **No user login required** - much better UX
- ✅ **Server-side authentication** - more secure
- ✅ **No OAuth popups** - seamless uploads
- ✅ **All images go to your Drive folder** - centralized storage

## Step-by-Step Setup

### 1. Create Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (same one with your existing OAuth credentials)
3. **Navigate to**: `IAM & Admin` → `Service Accounts`
4. **Click**: `Create Service Account`
5. **Service account name**: `art-code-uploader`
6. **Service account ID**: `art-code-uploader` (auto-generated)
7. **Description**: `Service account for Art Code app uploads`
8. **Click**: `Create and Continue`
9. **Skip roles** (click `Continue`)
10. **Click**: `Done`

### 2. Generate Service Account Key

1. **Click on the created service account** (`art-code-uploader`)
2. **Go to**: `Keys` tab
3. **Click**: `Add Key` → `Create new key`
4. **Select**: `JSON` format
5. **Click**: `Create`
6. **Download the JSON file** - keep it safe!

### 3. Share Google Drive Folder

1. **Go to your Google Drive**: https://drive.google.com/
2. **Navigate to your folder**: `USER_REQUEST` (ID: `1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL`)
3. **Right-click** → `Share`
4. **Add the service account email** (from the JSON file, looks like: `art-code-uploader@your-project.iam.gserviceaccount.com`)
5. **Give permission**: `Editor`
6. **Click**: `Share`

### 4. Add to Environment Variables

Open your `.env.local` file and add:

```env
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyBkn4wsHspAJVBDeURy7PF-eVvTOdkHad8
NEXT_PUBLIC_GOOGLE_CLIENT_ID=636014223904-0vla9fv1m610g9igqk2b85irvblsrljs.apps.googleusercontent.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"art-code-uploader@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important**: The `GOOGLE_SERVICE_ACCOUNT_KEY` should be the **entire JSON content** on one line.

### 5. Restart Your Server

After adding the environment variables:
```bash
# Stop your development server (Ctrl+C)
npm run dev
# Or
yarn dev
```

### 6. Test the Upload

1. **Go to admin page**: `http://localhost:3000/admin`
2. **Click**: `Test Service Account Upload`
3. **Select an image file**
4. **Should upload without any authentication popups!**

## User Experience Comparison

| Method | User Experience |
|--------|-----------------|
| **OAuth** | User sees Google login → Grants permission → Upload |
| **Service Account** | User selects file → Direct upload ✅ |

## Security Notes

- **Service account key contains secrets** - never commit to git
- **Use environment variables** - keep keys secure
- **Server-side only** - keys never sent to browser
- **Minimal permissions** - only Drive file access

## Troubleshooting

### Error: "Service account not configured"
- Check if `GOOGLE_SERVICE_ACCOUNT_KEY` is in `.env.local`
- Verify the JSON format is correct (no line breaks)

### Error: "Failed to get access token"
- Check if the service account key is valid
- Verify the JSON structure is complete

### Error: "File upload failed"
- Check if the service account has access to the Drive folder
- Verify the folder ID is correct
- Make sure the service account email is shared with the folder

### Error: "Permission denied"
- Share the Drive folder with the service account email
- Give "Editor" permission, not just "Viewer"

## Next Steps

Once service account is working:
1. **Update request form** to use service account upload
2. **Remove OAuth requirement** for regular users
3. **Keep OAuth for admin testing only**
4. **Much better user experience!**

This approach eliminates the OAuth redirect issues and provides a seamless upload experience for all users. 