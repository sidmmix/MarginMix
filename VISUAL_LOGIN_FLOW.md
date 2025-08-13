# Visual Login Flow Guide

## User Interface Flow

### 1. Authentication Page (`/auth`)
```
┌─────────────────────────────────────────────────┐
│                Login Form                       │
│                                                 │
│  📧 Email: [_________________]                  │
│  🔒 Password: [_________________] 👁            │
│                                                 │
│  [        Sign In        ]                      │
│                                                 │
│  ─────────── Or continue with ──────────────    │
│                                                 │
│  [ 🌐 Google ] [ 📘 Meta ]                     │
│                                                 │
│  Don't have an account? Create account          │
└─────────────────────────────────────────────────┘
```

### 2. Registration Form
```
┌─────────────────────────────────────────────────┐
│              Create Account                     │
│                                                 │
│  First Name: [_________________]                │
│  Last Name:  [_________________]                │
│  Company:    [_________________]                │
│  📧 Email:   [_________________]                │
│  🔒 Password: [_________________] 👁            │
│  🔒 Confirm:  [_________________] 👁            │
│                                                 │
│  ☑ I agree to Terms of Service                 │
│  ☑ I agree to Privacy Policy                   │
│  ☑ I consent to data processing (Required)     │
│  ☐ Marketing communications (Optional)         │
│                                                 │
│  [       Create Account      ]                  │
│                                                 │
│  ─────────── Or sign up with ──────────────     │
│                                                 │
│  [ 🌐 Google ] [ 📘 Meta ]                     │
│                                                 │
│  Already have an account? Sign in              │
└─────────────────────────────────────────────────┘
```

## Technical Flow Diagram

### Email/Password Authentication
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Express   │    │ PostgreSQL  │
│  (React)    │    │   Server    │    │ Database    │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
  1.  │ POST /api/auth/login                │
      │ { email, password }                 │
      ├─────────────────▶│                  │
      │                  │                  │
  2.  │                  │ SELECT * FROM users
      │                  │ WHERE email = ?  │
      │                  ├─────────────────▶│
      │                  │                  │
  3.  │                  │◀─────────────────┤
      │                  │ user record      │
      │                  │                  │
  4.  │                  │ bcrypt.compare() │
      │                  │ (password hash)  │
      │                  │                  │
  5.  │                  │ req.session.userId = user.id
      │                  │                  │
  6.  │◀─────────────────┤                  │
      │ { id, email, ... }                  │
      │                  │                  │
  7.  │ GET /api/auth/me │                  │
      ├─────────────────▶│                  │
      │                  │                  │
  8.  │◀─────────────────┤                  │
      │ user data        │                  │
```

### Google OAuth Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Express   │    │   Google    │    │ PostgreSQL  │
│  (Browser)  │    │   Server    │    │   OAuth     │    │ Database    │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │                  │
  1.  │ Click "Google"   │                  │                  │
      ├─────────────────▶│                  │                  │
      │                  │                  │                  │
  2.  │ Redirect to      │                  │                  │
      │ /api/auth/google │                  │                  │
      ├─────────────────▶│                  │                  │
      │                  │                  │                  │
  3.  │                  │ Redirect to      │                  │
      │                  │ Google OAuth     │                  │
      │                  ├─────────────────▶│                  │
      │                  │                  │                  │
  4.  │ User grants      │                  │                  │
      │ permissions      │                  │                  │
      ├─────────────────────────────────────▶│                  │
      │                  │                  │                  │
  5.  │                  │ Callback with    │                  │
      │                  │ auth code        │                  │
      │                  │◀─────────────────┤                  │
      │                  │                  │                  │
  6.  │                  │ Exchange code    │                  │
      │                  │ for tokens       │                  │
      │                  ├─────────────────▶│                  │
      │                  │                  │                  │
  7.  │                  │◀─────────────────┤                  │
      │                  │ Access token +   │                  │
      │                  │ User profile     │                  │
      │                  │                  │                  │
  8.  │                  │ Check if user exists by email     │
      │                  ├─────────────────────────────────────▶│
      │                  │                  │                  │
  9.  │                  │◀─────────────────────────────────────┤
      │                  │ existing user OR null              │
      │                  │                  │                  │
 10.  │                  │ Create/Update user record          │
      │                  ├─────────────────────────────────────▶│
      │                  │                  │                  │
 11.  │                  │ req.session.userId = user.id       │
      │                  │                  │                  │
 12.  │ Redirect to /    │                  │                  │
      │◀─────────────────┤                  │                  │
      │                  │                  │                  │
 13.  │ GET /api/auth/me │                  │                  │
      ├─────────────────▶│                  │                  │
      │                  │                  │                  │
 14.  │◀─────────────────┤                  │                  │
      │ authenticated    │                  │                  │
      │ user data        │                  │                  │
```

### Meta (Facebook) OAuth Flow
```
Similar to Google OAuth, but with:
- /api/auth/facebook endpoint
- Facebook OAuth provider
- Different profile data structure
- Same user creation/linking logic
```

## Key Components Breakdown

### Frontend Components

#### 1. `useAuth` Hook (`client/src/hooks/useAuth.ts`)
```typescript
// Manages authentication state across the app
const { user, isAuthenticated, isLoading } = useAuth();

// Provides login/logout functions
const { login, logout, register } = useAuth();
```

#### 2. `LoginForm` Component
```typescript
// Handles three login methods:
- Email/password form submission
- Google OAuth redirect
- Meta OAuth redirect

// State management:
- Form validation (Zod schema)
- Loading states
- Error handling
```

#### 3. `RegisterForm` Component
```typescript
// Handles registration with:
- Personal information collection
- GDPR compliance checkboxes
- OAuth alternatives
- Form validation
```

### Backend Components

#### 1. Authentication Routes (`server/routes.ts`)
```
POST /api/auth/register  - Email/password registration
POST /api/auth/login     - Email/password login
POST /api/auth/logout    - Session destruction
GET  /api/auth/me        - Get current user
```

#### 2. OAuth Routes (`server/oauth.ts`)
```
GET /api/auth/google           - Start Google OAuth
GET /api/auth/google/callback  - Google OAuth callback
GET /api/auth/facebook         - Start Facebook OAuth
GET /api/auth/facebook/callback - Facebook OAuth callback
```

#### 3. Storage Layer (`server/storage.ts`)
```typescript
interface IStorage {
  // User operations
  createUser(userData): Promise<User>
  getUserByEmail(email): Promise<User>
  updateUser(id, updates): Promise<User>
  
  // Password operations
  hashPassword(password): Promise<string>
  comparePassword(password, hash): Promise<boolean>
}
```

## Session Flow

### Session Creation
```
1. User authenticates (any method)
2. Server sets: req.session.userId = user.id
3. Session stored in PostgreSQL sessions table
4. Cookie sent to browser with session ID
```

### Protected Route Access
```
1. Browser sends request with session cookie
2. requireAuth middleware checks req.session.userId
3. If valid: continue to route handler
4. If invalid: return 401 Unauthorized
```

### Session Persistence
```
Session Storage: PostgreSQL
Session Lifetime: 1 week
Session Data: { userId, cookie metadata }
Security: HttpOnly cookies, CSRF protection
```

## Error Handling Flow

### Authentication Errors
```
Invalid credentials → 401 + error message
OAuth denied → Redirect to login with error
Missing OAuth config → 500 server error
Session expired → 401 + redirect to login
```

### User Experience
```
Success: Smooth redirect to home page
Error: Clear error messages + retry options
Loading: Spinner states during authentication
Validation: Real-time form validation
```

This comprehensive authentication system provides multiple entry points while maintaining security and user experience standards.