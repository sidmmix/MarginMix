# OAuth Setup Guide for YourBrief Platform

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API (or Google People API)

### 2. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "YourBrief Campaign Planner"
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`
5. Save and continue

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "YourBrief Web Client"
5. Authorized redirect URIs:
   - `https://your-replit-domain.replit.app/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)

### 4. Get Your Credentials
- Copy the **Client ID** → This is your `GOOGLE_CLIENT_ID`
- Copy the **Client Secret** → This is your `GOOGLE_CLIENT_SECRET`

## Meta (Facebook) OAuth Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" or "Business" type
4. Fill in app details:
   - App name: "YourBrief Campaign Planner"
   - Contact email: your email

### 2. Configure Facebook Login
1. In your app dashboard, add "Facebook Login" product
2. Go to Facebook Login → Settings
3. Add Valid OAuth Redirect URIs:
   - `https://your-replit-domain.replit.app/api/auth/facebook/callback`
   - `http://localhost:5000/api/auth/facebook/callback` (for development)

### 3. Get Your Credentials
1. Go to Settings → Basic
2. Copy the **App ID** → This is your `FACEBOOK_APP_ID`
3. Copy the **App Secret** → This is your `FACEBOOK_APP_SECRET`

## Setting Up Environment Variables in Replit

Once you have all four credentials, add them to your Replit environment:

1. In your Replit project, go to the "Secrets" tab (lock icon)
2. Add these four secrets:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `FACEBOOK_APP_ID`: Your Facebook app ID
   - `FACEBOOK_APP_SECRET`: Your Facebook app secret

## Testing OAuth Integration

After adding the secrets:
1. Restart your Replit application
2. Go to `/auth` page
3. Try clicking "Google" and "Meta" buttons
4. You should be redirected to respective OAuth providers
5. After successful authentication, you'll be redirected back to your app

## Important Notes

- **Production URLs**: Replace `your-replit-domain.replit.app` with your actual Replit domain
- **HTTPS Required**: OAuth providers require HTTPS URLs in production
- **Domain Verification**: Some providers may require domain verification
- **App Review**: Facebook may require app review for production use

## Troubleshooting

- **"Unknown authentication strategy"**: Missing environment variables
- **"Redirect URI mismatch"**: Check callback URLs in OAuth provider settings
- **"App not approved"**: Facebook apps need approval for public use
- **CORS errors**: Ensure proper domain configuration in OAuth providers