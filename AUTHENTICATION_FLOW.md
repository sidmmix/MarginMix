# Authentication Flow Documentation

## Overview
Our platform supports three authentication methods:
1. **Email/Password** - Traditional registration and login
2. **Google OAuth** - "Continue with Google" 
3. **Meta OAuth** - "Continue with Meta"

## Authentication Flow Diagram

```
┌─────────────────┐
│   User Visits   │
│   Login Page    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Three Options  │
│                 │
│ 1. Email/Pass   │
│ 2. Google       │
│ 3. Meta         │
└─────────┬───────┘
          │
    ┌─────┴─────┬─────────────┐
    │           │             │
    ▼           ▼             ▼
┌───────┐  ┌─────────┐  ┌─────────┐
│Email/ │  │ Google  │  │  Meta   │
│Pass   │  │ OAuth   │  │ OAuth   │
└───┬───┘  └────┬────┘  └────┬────┘
    │           │             │
    │           │             │
    ▼           ▼             ▼
┌───────────────────────────────────┐
│      Backend Validation           │
│                                   │
│ • Check credentials               │
│ • Validate OAuth tokens           │
│ • Create/link user accounts       │
└─────────────┬─────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│        Session Creation         │
│                                 │
│ • Set req.session.userId        │
│ • Store user data in session    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│       Redirect to Home          │
│                                 │
│ • User authenticated            │
│ • Access to protected routes    │
└─────────────────────────────────┘
```

## Detailed Authentication Flows

### 1. Email/Password Authentication

```
Frontend (Login Form)
│
├─ User enters email/password
├─ Form validation (Zod schema)
├─ POST /api/auth/login
│
Backend (routes.ts)
│
├─ Parse request body
├─ Find user by email
├─ Compare password hash (bcrypt)
├─ Create session: req.session.userId = user.id
├─ Return user data (without password)
│
Frontend
│
├─ Store user in React Query cache
├─ Redirect to home page
└─ Show authenticated UI
```

### 2. Google OAuth Authentication

```
Frontend
│
├─ User clicks "Continue with Google"
├─ Redirect to: /api/auth/google
│
Backend OAuth Flow
│
├─ passport.authenticate('google')
├─ Redirect to Google OAuth consent screen
│
Google OAuth Provider
│
├─ User grants permissions
├─ Redirect to: /api/auth/google/callback
│
Backend Callback
│
├─ passport.authenticate('google')
├─ Verify OAuth token
├─ Extract user profile data
├─ Check if user exists by email
│
├─ If existing user:
│   ├─ Update authProvider to "google"
│   ├─ Update profile image if available
│   └─ Link Google account
│
├─ If new user:
│   ├─ Create new user record
│   ├─ Set authProvider: "google"
│   ├─ Set consentGiven: true
│   └─ Save profile data
│
├─ Create session: req.session.userId = user.id
├─ Redirect to home page
│
Frontend
│
├─ Detect successful authentication
├─ Fetch user data via /api/auth/me
└─ Show authenticated UI
```

### 3. Meta (Facebook) OAuth Authentication

```
Frontend
│
├─ User clicks "Continue with Meta"
├─ Redirect to: /api/auth/facebook
│
Backend OAuth Flow
│
├─ passport.authenticate('facebook')
├─ Redirect to Facebook OAuth consent screen
│
Facebook OAuth Provider
│
├─ User grants permissions
├─ Redirect to: /api/auth/facebook/callback
│
Backend Callback
│
├─ passport.authenticate('facebook')
├─ Verify OAuth token
├─ Extract user profile data
├─ Check if user exists by email
│
├─ If existing user:
│   ├─ Update authProvider to "facebook"
│   ├─ Update profile image if available
│   └─ Link Facebook account
│
├─ If new user:
│   ├─ Create new user record
│   ├─ Set authProvider: "facebook"
│   ├─ Set consentGiven: true
│   └─ Save profile data
│
├─ Create session: req.session.userId = user.id
├─ Redirect to home page
│
Frontend
│
├─ Detect successful authentication
├─ Fetch user data via /api/auth/me
└─ Show authenticated UI
```

## File Structure and Components

### Backend Files:
```
server/
├── routes.ts          # Main authentication routes
├── oauth.ts           # OAuth strategies and configuration
├── storage.ts         # User data operations
└── db.ts             # Database connection

Key Routes:
├── POST /api/auth/login          # Email/password login
├── POST /api/auth/register       # Email/password registration
├── GET /api/auth/logout          # Logout (all methods)
├── GET /api/auth/me              # Get current user
├── GET /api/auth/google          # Start Google OAuth
├── GET /api/auth/google/callback # Google OAuth callback
├── GET /api/auth/facebook        # Start Facebook OAuth
└── GET /api/auth/facebook/callback # Facebook OAuth callback
```

### Frontend Files:
```
client/src/
├── components/
│   ├── login-form.tsx     # Login form with OAuth buttons
│   └── register-form.tsx  # Register form with OAuth buttons
├── hooks/
│   └── useAuth.ts         # Authentication state management
└── pages/
    ├── auth.tsx           # Authentication page
    └── home.tsx           # Protected home page

Components:
├── LoginForm              # Email/password + OAuth buttons
├── RegisterForm           # Registration + OAuth buttons
└── useAuth hook           # Manages authentication state
```

## Session Management

### Session Storage:
```
PostgreSQL sessions table:
├── sid: session ID (primary key)
├── sess: session data (JSONB)
└── expire: expiration timestamp

Session Data Structure:
{
  userId: "user-uuid-here",
  cookie: {
    httpOnly: true,
    secure: false, // true in production
    maxAge: 604800000 // 1 week
  }
}
```

### Authentication Check:
```
requireAuth middleware:
├── Check if req.session.userId exists
├── If exists: call next()
├── If not: return 401 Unauthorized
```

## Error Handling

### Common Error Scenarios:
```
1. Invalid email/password
   └── Return 401 with "Invalid credentials"

2. OAuth email already registered
   └── Link accounts automatically

3. OAuth consent denied
   └── Redirect back to login with error

4. Missing OAuth configuration
   └── Server error, check environment variables

5. Session expired
   └── 401 Unauthorized, redirect to login
```

## Security Features

### Password Security:
- bcrypt hashing with salt rounds
- Password validation (minimum length, complexity)

### OAuth Security:
- CSRF protection via state parameter
- Secure callback URL validation
- Token verification with OAuth providers

### Session Security:
- HttpOnly cookies
- Secure flag in production
- Session expiration (1 week)
- PostgreSQL session storage

## Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...

# Session Secret
SESSION_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## User Experience Flow

1. **Landing Page**: User sees login/register options
2. **Auth Choice**: User chooses email/password or OAuth
3. **Authentication**: System processes credentials
4. **Session Creation**: Backend creates authenticated session
5. **Redirect**: User redirected to home/dashboard
6. **Protected Access**: User can access authenticated features
7. **Logout**: Session destroyed, redirect to landing page

This multi-provider authentication system provides flexibility while maintaining security and a smooth user experience.