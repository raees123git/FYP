# MongoDB Authentication Migration - Complete Guide

This guide documents the replacement of Clerk authentication with MongoDB-based JWT authentication.

## Backend Changes

### 1. New Files Created

#### `Backend/app/routers/auth.py`
- JWT-based authentication endpoints
- Password hashing with bcrypt
- User signup, login, logout, and token validation

### 2. Modified Files

#### `Backend/app/models.py`
Added authentication models:
- `UserAuth`: User authentication with hashed passwords
- `UserSignup`: User registration validation
- `UserLogin`: Login credentials
- `TokenResponse`: JWT token response

Updated `UserProfile` model:
- Changed `user_id` description from "Clerk user ID" to "User ID from auth collection"

#### `Backend/app/database.py`
- Added `get_users_collection()` function for user authentication collection

#### `Backend/app/main.py`
- Added `auth` router import
- Included auth router in the application

#### `Backend/app/routers/profile.py`
- Replaced `get_current_user_id()` with `get_current_user()` from auth router
- Now uses JWT token validation instead of Clerk

#### `Backend/app/routers/reports.py`
- Replaced `get_current_user_id()` with `get_current_user()` from auth router
- Now uses JWT token validation

### 3. Environment Variables

Add to `Backend/.env`:
```
JWT_SECRET_KEY=your-super-secret-key-change-in-production-skilledge-2024
MONGODB_URL=mongodb://localhost:27017
DB_NAME=skilledge
```

### 4. Dependencies

Already installed in `requirements.txt`:
- `python-jose[cryptography]` - JWT token handling
- `passlib` - Password hashing
- `bcrypt` - Bcrypt algorithm for passlib

## Frontend Changes

### 1. New Files Created

#### `SkillEdge-AI/lib/auth-context.jsx`
- React Context for authentication state management
- JWT token storage in localStorage and cookies
- `useAuth()` hook for components
- Signup, login, logout functions

#### `SkillEdge-AI/lib/api.js`
- API helper functions with automatic auth token injection
- `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` functions

### 2. Modified Files

#### `SkillEdge-AI/app/layout.js`
- Replaced `ClerkProvider` with `AuthProvider`
- Removed Clerk theme imports

#### `SkillEdge-AI/app/(auth)/sign-up/[[...sign-up]]/page.jsx`
- Custom signup form with validation
- Password strength requirements
- Uses `useAuth()` hook

#### `SkillEdge-AI/app/(auth)/sign-in/[[...sign-in]]/page.jsx`
- Custom login form
- Uses `useAuth()` hook

#### `SkillEdge-AI/components/header.jsx`
- Replaced Clerk components (`SignInButton`, `SignedIn`, `SignedOut`, `UserButton`, `useUser`)
- Now uses `useAuth()` hook
- Custom user dropdown menu

#### `SkillEdge-AI/components/ProfileCompletionCheck.jsx`
- Replaced `useUser` from Clerk with `useAuth`
- Updated loading states

#### `SkillEdge-AI/app/(main)/profile/page.jsx`
- Replaced `useUser` from Clerk with `useAuth`
- Updated loading states and user checks

#### `SkillEdge-AI/components/InterviewSimulator/InterviewTypeSelector.jsx`
- Replaced `useUser` from Clerk with `useAuth`

#### `SkillEdge-AI/app/api/profile/route.js`
- Removed Clerk `auth()` function
- Now uses JWT tokens from cookies
- Uses `cookies()` from 'next/headers'

#### `SkillEdge-AI/middleware.js`
- Simplified middleware
- Removed Clerk middleware
- Basic route protection (client-side auth in AuthProvider)

### 3. Files Still Need Update

These files import from Clerk but may not be critical:
- `app/industry-insights/page.jsx`
- `app/chatbot/page.jsx`
- `components/chatbot/ChatbotWidget.jsx`
- `app/interview/complete/page.jsx`
- `app/(main)/profile/update/page.jsx`

## MongoDB Collections

### `users` Collection
Stores user authentication data:
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password_hash: String,
  first_name: String,
  last_name: String,
  is_verified: Boolean,
  created_at: DateTime,
  last_login: DateTime
}
```

### `profiles` Collection
Stores user profile data (linked to users via user_id):
```javascript
{
  _id: ObjectId,
  user_id: String (references users._id),
  first_name: String,
  last_name: String,
  email: String,
  industry: String,
  position: String,
  experience: Number,
  skills: Array,
  bio: String,
  resume_file_id: String,
  resume_filename: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

## Authentication Flow

### Signup Process
1. User fills signup form with email, password, first & last name
2. Frontend sends POST to `/api/auth/signup`
3. Backend validates password requirements (8+ chars, uppercase, lowercase, digit)
4. Backend hashes password with bcrypt
5. Backend creates user in `users` collection
6. Backend creates initial profile in `profiles` collection
7. Backend generates JWT token (7-day expiry)
8. Frontend stores token in localStorage and cookie
9. User redirected to `/profile`

### Login Process
1. User enters email and password
2. Frontend sends POST to `/api/auth/login`
3. Backend finds user by email
4. Backend verifies password with bcrypt
5. Backend updates last_login timestamp
6. Backend generates JWT token
7. Frontend stores token in localStorage and cookie
8. User redirected to home page

### Protected Routes
1. Frontend checks for token in localStorage on mount
2. API requests include `Authorization: Bearer <token>` header
3. Backend validates JWT token in `get_current_user()` dependency
4. Backend extracts user_id from token payload
5. Routes receive authenticated user_id

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Signup creates user and profile in MongoDB
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails
- [ ] JWT token is stored in localStorage and cookies
- [ ] Protected routes redirect to login when not authenticated
- [ ] Profile page loads with authenticated user
- [ ] Profile updates work
- [ ] Logout clears tokens and redirects
- [ ] Token expiration is handled gracefully

## Removing Clerk

To completely remove Clerk:

1. Uninstall Clerk package (optional, but recommended):
```bash
cd SkillEdge-AI
npm uninstall @clerk/nextjs @clerk/themes
```

2. Remove Clerk environment variables from `.env.local`

3. Update remaining files that import from Clerk (see list above)

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET_KEY` to a strong, random value in production
2. **HTTPS**: Use HTTPS in production for secure token transmission
3. **Cookie Security**: Set `Secure` and `HttpOnly` flags on cookies in production
4. **Password Policy**: Current policy requires 8+ chars, uppercase, lowercase, digit
5. **Token Expiry**: Tokens expire after 7 days (configurable)
6. **CORS**: Update `allowed_origins` in `Backend/app/main.py` for production domains

## Migration from Existing Clerk Users

If you have existing users in Clerk, you'll need a migration script to:
1. Export users from Clerk
2. Create corresponding users in MongoDB `users` collection
3. Set temporary passwords or require password reset
4. Link to existing profiles if profile data exists

## Troubleshooting

### "Could not validate credentials" error
- Check if JWT_SECRET_KEY matches between signup and login
- Verify token is being sent in Authorization header
- Check token hasn't expired

### "User not found" error
- Verify user was created in users collection
- Check user_id matching between users and profiles

### CORS errors
- Ensure frontend URL is in backend `allowed_origins`
- Check if credentials are being sent with requests

### Profile not loading
- Verify JWT token is valid
- Check profile exists in profiles collection with correct user_id
- Ensure API route is using correct auth token extraction
