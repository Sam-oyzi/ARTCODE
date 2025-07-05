# OAuth Redirect URI Fix

## The Problem

You're getting `Error 400: redirect_uri_mismatch` because Google's newer Identity Services library generates random ports (like `localhost:63778`) but your Google Console is configured for `localhost:3000`.

## ✅ **Best Solution: Use Alternative OAuth**

I've implemented an **Alternative OAuth** method using the older `gapi.auth2` library that avoids redirect issues entirely:

### **Method 1: Alternative OAuth (Recommended)**

1. **In Admin Panel**: Click "**Test Alt OAuth**" instead of "Test OAuth"
2. **In Photo Upload Test**: Toggle to "**Alternative OAuth**" method
3. **This uses**: `gapi.auth2` library with predictable authentication flow

### **Method 2: Standard OAuth + Google Console Fix**

If you prefer the standard method, add these to Google Console:

**Authorized JavaScript origins**:
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:8080
http://localhost:8000
http://localhost:5000
```

**Authorized redirect URIs**:
```
http://localhost:3000/
http://localhost:3000/auth/callback
http://127.0.0.1:3000/
http://127.0.0.1:3000/auth/callback
```

## 🎯 **Testing Both OAuth Methods**

### **Admin Panel Tests**:
1. **"Test OAuth"** - Standard Google Identity Services
2. **"Test Alt OAuth"** - Alternative gapi.auth2 method
3. **"Test OAuth Upload"** - File upload with standard method

### **Photo Upload Test**:
1. **Select OAuth method** - Toggle between Standard/Alternative
2. **Upload photos** - Test actual file uploads
3. **View results** - Detailed success/error information

## 🧪 **How to Test:**

1. **Go to `/admin` page**
2. **Try "Test Alt OAuth"** first (most reliable)
3. **Use Photo Upload Test** with "Alternative OAuth" selected
4. **Upload photos** and view detailed results

## 🔧 **Debugging Steps:**

### **If OAuth Still Fails:**

1. **Check browser console** for detailed error messages
2. **Try incognito/private browser** window
3. **Clear browser cache** and cookies
4. **Wait 10 minutes** after Google Console changes

### **If Upload Test Shows Errors:**

1. **Check console logs** - they'll show exactly what's failing
2. **Try with small image files** first (< 1MB)
3. **Verify Google Drive folder permissions**

## 🎯 **Next Steps:**

1. **Try "Test Alt OAuth"** first (most reliable)
2. **Use Photo Upload Test** with "Alternative OAuth" selected
3. **Upload photos** directly from browser - no Python needed!
4. **Check console** for detailed error messages if needed

## ✅ **What Works Now:**

- **Browser-based OAuth** - Upload images directly from web interface
- **Alternative OAuth** - Uses `gapi.auth2` library (avoids redirect errors)
- **Standard OAuth** - Uses Google Identity Services (may need Console config)
- **Local fallback** - Stores images locally if OAuth fails

**No Python scripts required** - everything works from the browser! 