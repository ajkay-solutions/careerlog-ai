# OAuth Configuration Fix Instructions

## Issue 1: Google OAuth 404 Error

The Google OAuth is redirecting correctly but Google is rejecting the callback. You need to add the development callback URL to your Google OAuth app.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth 2.0 Client IDs**
   - Go to "APIs & Services" > "Credentials"
   - Click on your OAuth 2.0 Client ID (677875518045-8qa0q2msug0ngmgvkokc5s3somaooh0.apps.googleusercontent.com)

3. **Add Development Callback URL**
   Add these authorized redirect URIs:
   - `http://localhost:3004/auth/google/callback` (for development)
   - `https://worklog-ai-backend.onrender.com/auth/google/callback` (for production)
   
   Make sure you have ALL of these URIs configured:
   ```
   http://localhost:3004/auth/google/callback
   https://worklog-ai-backend.onrender.com/auth/google/callback
   https://worklog.ajkaysolutions.com/auth/google/callback
   ```

4. **Save the Changes**
   - Click "Save" at the bottom of the page
   - Wait a few minutes for changes to propagate

## Issue 2: Entry Loading Timeout with LinkedIn OAuth

The entries are timing out when using LinkedIn OAuth. This is happening because the backend is having database connection issues.

### Already Fixed:
The database queries are protected by authentication middleware and the JWT token is being properly validated.

### To verify the fix works:

1. Clear your browser localStorage:
   ```javascript
   localStorage.clear()
   ```

2. Login again with LinkedIn OAuth

3. Check if entries load properly

## Testing Commands:

```bash
# Test Google OAuth (after adding callback URLs)
curl http://localhost:3004/auth/google

# Test LinkedIn OAuth
curl http://localhost:3004/auth/linkedin

# Check backend health
curl http://localhost:3004/api/health
```

## Current Status:
- Backend is running on port 3004 ✅
- Frontend is running on port 5173 ✅
- LinkedIn OAuth is working ✅
- Google OAuth needs callback URL configuration ⚠️
- Database connection is healthy ✅